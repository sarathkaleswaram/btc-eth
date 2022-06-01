const litecore = require('bitcore-lib-ltc')
const bitcore = require('bitcore-lib')
const request = require('request')
const sb = require('satoshi-bitcoin')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var ltcSend = async function (req, res) {
    try {
        //logger.debug('ltcSend body:', req.body)
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var amountSatoshi

        logger.debug('ltcSend sourceAddress: ' + sourceAddress + " destinationAddress: " + destinationAddress + " amount: " + amount)

        if (!sourceAddress || !privateKey || !destinationAddress || !amount) {
            logger.error('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }


        let isSourceAddressInvalid = server.isMainnet ? !litecore.Address.isValid(sourceAddress) : !bitcore.Address.isValid(sourceAddress, server.network)
        let isdestinationAddressInvalid = server.isMainnet ? !litecore.Address.isValid(destinationAddress) : !bitcore.Address.isValid(destinationAddress, server.network)

        if (isSourceAddressInvalid) {
            logger.error('Invalid sourceAddress')
            res.json({
                result: 'error',
                message: 'Invalid sourceAddress',
            })
            return
        }
        if (isdestinationAddressInvalid) {
            logger.error('Invalid destinationAddress')
            res.json({
                result: 'error',
                message: 'Invalid destinationAddress',
            })
            return
        }
        if (!bitcore.PrivateKey.isValid(privateKey, server.network)) {
            logger.error('Invalid PrivateKey')
            res.json({
                result: 'error',
                message: 'Invalid PrivateKey',
            })
            return
        }
        try {
            amountSatoshi = sb.toSatoshi(amount)
        } catch (error) {
            logger.error('Invalid amount')
            res.json({
                result: 'error',
                message: 'Invalid amount',
            })
            return
        }

        getBalance(sourceAddress, res, function (balance) {
            logger.verbose(balance + ' < ' + amountSatoshi)
            if (balance < amountSatoshi) {
                logger.error('Insufficient funds')
                res.json({
                    result: 'error',
                    message: 'Insufficient funds',
                })
                return
            }
            // get Unspent transaction output
            getUTXO(sourceAddress, res, function (utxos) {
                try {
                    var transaction = new bitcore.Transaction()
                        .from(utxos)
                        .to(destinationAddress, amountSatoshi)
                        .change(sourceAddress)
                        // .fee(fee)
                        .sign(privateKey)
                } catch (error) {
                    logger.verbose('Failed to sign Transaction')
                    logger.error('Error: ' + error)
                    res.json({
                        result: 'error',
                        message: 'Failed to sign Transaction',
                    })
                    return
                }

                var payload = {
                    'tx': transaction.toString()
                }
                // broadcast transaction
                pushTransaction(payload, res, function (txid) {
                    const url = `${server.ltcExplorerUrl}/tx/${txid}`
                    logger.verbose('Send Tx', { transactionHash: txid, link: url })
                    res.json({
                        result: 'success',
                        transactionHash: txid,
                        link: url
                    })
                })
            })
        })
    } catch (error) {
        logger.error('ltcSend catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

function getBalance(address, res, callback) {
    request({
        url: `http://localhost:${server.port}/ltc/balance/${address}`,
        json: true
    }, function (error, response, body) {
        try {
            if (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
            }
            if (body.error) {
                logger.error(body.error)
                res.json({
                    result: 'error',
                    message: body.error,
                })
                return
            }
            var balance = parseFloat(body.balance.split(' ')[0])
            logger.verbose('Source address balance is: ' + balance + ' LTC')
            if (balance <= 0) {
                res.json({
                    result: 'error',
                    message: 'Source address balance is: ' + balance + ' LTC',
                })
                return
            }
            callback(sb.toSatoshi(balance))
        } catch (error) {
            logger.error('Error: ' + error)
            res.json({
                result: 'error',
                message: error.toString(),
            })
        }
    })
}

function getUTXO(address, res, callback) {
    if (server.isMainnet) {
        request({
            url: `${server.ltcAPI}/addrs/${address}?unspentOnly=true&includeScript=true`,
            json: true
        }, function (error, response, body) {
            try {
                if (!error && response.statusCode == 200) {
                    if (!body.txrefs) {
                        logger.error('Empty Unspend Transaction (Pending other Transaction) ' + JSON.stringify(body))
                        res.json({
                            result: 'error',
                            message: 'Empty Unspend Transaction (Pending other Transaction)',
                        })
                        return
                    }
                    logger.verbose('UTXO length: ' + body.txrefs.length)
                    var utxos = []
                    for (i = 0; i < body.txrefs.length; i++) {
                        var utxo = {
                            'txId': body.txrefs[i].tx_hash,
                            'outputIndex': body.txrefs[i].tx_output_n,
                            'address': address,
                            'script': body.txrefs[i].script,
                            'satoshis': body.txrefs[i].value
                        }
                        utxos.push(utxo)
                    }
                    callback(utxos)
                } else {
                    logger.error('Error: ' + error)
                    logger.error('Unable to get UTXO')
                    res.json({
                        result: 'error',
                        message: 'Unable to get UTXO',
                    })
                    return
                }
            } catch (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } else {
        request({
            url: `${server.ltcTestAPI}/addresses/${address}/unspent-outputs`,
            headers: {
                'X-API-Key': server.ltcTestApiKey,
                'Content-Type': 'application/json'
            },
            json: true
        }, function (error, response, body) {
            try {
                if (!error && response.statusCode == 200) {
                    if (!body.data.items.length) {
                        logger.error('Empty Unspend Transaction (Pending other Transaction) ' + JSON.stringify(body))
                        res.json({
                            result: 'error',
                            message: 'Empty Unspend Transaction (Pending other Transaction)',
                        })
                        return
                    }
                    logger.verbose('UTXO length: ' + body.data.items.length)
                    var utxos = []
                    for (i = 0; i < body.data.items.length; i++) {
                        var utxo = {
                            'txId': body.data.items[i].transactionId,
                            'outputIndex': body.data.items[i].index,
                            'address': address,
                            // 'script': body.data.items[i].script,
                            script: '76a91447862fe165e6121af80d5dde1ecb478ed170565b88ac',
                            'satoshis': sb.toSatoshi(body.data.items[i].amount)
                        }
                        utxos.push(utxo)
                    }
                    callback(utxos)
                } else {
                    logger.error('Error: ' + error)
                    logger.error('Unable to get UTXO')
                    res.json({
                        result: 'error',
                        message: 'Unable to get UTXO',
                    })
                    return
                }
            } catch (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    }
}

function pushTransaction(pload, res, callback) {
    if (server.isMainnet) {
        request({
            url: `${server.ltcAPI}/txs/push`,
            method: 'POST',
            json: true,
            headers: { 'content-type': 'application/json' },
            body: pload
        }, function (error, response, body) {
            try {
                if (error) {
                    logger.error('Error: ' + error)
                    logger.error('Broadcast failed. Please try later')
                    res.json({
                        result: 'error',
                        message: 'Broadcast failed. Please try later',
                    })
                    return
                } else {
                    if (body.error) {
                        logger.error(body.error)
                        res.json({
                            result: 'error',
                            message: body.error,
                        })
                        return
                    }
                    callback(body.tx.hash)
                }
            } catch (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } else {
        var walletId = '609e221675d04500068718dc'
        var payload = {
            data: {
                item: {
                    feePriority: 'standard',
                    recipients: [
                        {
                            address: '2MtzNEqm2D9jcbPJ5mW7Z3AUNwqt3afZH66',
                            amount: '0.125'
                        }
                    ]
                }
            }
        }
        request({
            url: `https://rest.cryptoapis.io/v2/wallet-as-a-service/wallets/${walletId}/litecoin/testnet/transaction-requests`,
            // url: `https://api.cryptoapis.io/v1/bc/ltc/testnet/txs/send/`,
            method: 'POST',
            headers: {
                'X-API-Key': server.ltcTestApiKey,
                'Content-Type': 'application/json'
            },
            json: true,
            body: payload
        }, function (error, response, body) {
            try {
                if (error) {
                    logger.error('Error: ' + error)
                    logger.error('Broadcast failed. Please try later')
                    res.json({
                        result: 'error',
                        message: 'Broadcast failed. Please try later',
                    })
                    return
                } else {
                    if (body.error) {
                        logger.error(body.error)
                        res.json({
                            result: 'error',
                            message: body.error,
                        })
                        return
                    }
                    callback(body.tx.hash)
                }
            } catch (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    }
}

module.exports = ltcSend
