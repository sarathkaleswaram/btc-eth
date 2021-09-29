const bitcore = require('bitcore-lib')
const request = require('request')
const sb = require('satoshi-bitcoin')
var server = require('../../server')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var btcSend = async function (req, res) {
    try {
        logger.debug('btcSend body:', req.body)
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var chain = server.network === 'testnet' ? 'test3' : 'main'
        var amountSatoshi

        if (!sourceAddress || !privateKey || !destinationAddress || !amount) {
            logger.error('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }
        if (!bitcore.Address.isValid(sourceAddress, server.network)) {
            logger.error('Invalid sourceAddress')
            res.json({
                result: 'error',
                message: 'Invalid sourceAddress',
            })
            return
        }
        if (!bitcore.Address.isValid(destinationAddress, server.network)) {
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

        getBalance(sourceAddress, chain, res, function (balance) {
            logger.debug(balance, ' < ', amountSatoshi)
            if (balance < amountSatoshi) {
                logger.error('Insufficient funds')
                res.json({
                    result: 'error',
                    message: 'Insufficient funds',
                })
                return
            }
            // get Unspent transaction output
            getUTXO(sourceAddress, chain, res, function (utxos) {
                try {
                    var transaction = new bitcore.Transaction()
                        .from(utxos)
                        .to(destinationAddress, amountSatoshi)
                        .change(sourceAddress)
                        // .fee(fee)
                        .sign(privateKey)
                } catch (error) {
                    logger.debug('Failed to sign Transaction')
                    logger.error(error)
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
                pushTransaction(payload, chain, res, function (txid) {
                    const url = `${server.btcExplorerUrl}/tx/${txid}`
                    logger.debug({ transactionHash: txid, link: url })
                    res.json({
                        result: 'success',
                        transactionHash: txid,
                        link: url
                    })
                })
            })
        })
    } catch (error) {
        logger.error('btcSend catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

function getBalance(address, chain, res, callback) {
    request({
        url: `${server.btcAPI}/addrs/${address}/balance`,
        json: true
    }, function (error, response, body) {
        if (error) {
            logger.error(error)
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
        var balance = sb.toBitcoin(body.final_balance)
        logger.debug('Source address balance is:', balance + ' BTC')
        if (body.final_balance <= 0) {
            res.json({
                result: 'error',
                message: 'Source address balance is: ' + balance + ' BTC',
            })
            return
        }
        callback(body.final_balance)
    })
}

function getUTXO(address, chain, res, callback) {
    request({
        url: `${server.btcAPI}/addrs/${address}?unspentOnly=true&includeScript=true`,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (!body.txrefs) {
                logger.error('Empty Unspend Transaction (Pending other Transaction) '+JSON.stringify(body))
                res.json({
                    result: 'error',
                    message: 'Empty Unspend Transaction (Pending other Transaction)',
                })
                return
            }
            logger.debug('UTXO length: ', body.txrefs.length)
            var utxos = []
            var totalSats = 0
            var txSize = 44
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
            logger.error(error)
            logger.error('Unable to get UTXO')
            res.json({
                result: 'error',
                message: 'Unable to get UTXO',
            })
            return
        }
    })
}

function pushTransaction(pload, chain, res, callback) {
    request({
        url: `${server.btcAPI}/txs/push`,
        method: 'POST',
        json: true,
        headers: { 'content-type': 'application/json' },
        body: pload
    }, function (err, response, body) {
        if (err) {
            logger.error(err)
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
    })
}

module.exports = btcSend
