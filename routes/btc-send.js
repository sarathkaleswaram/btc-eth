const bitcore = require('bitcore-lib')
const request = require('request')
const sb = require('satoshi-bitcoin')
var server = require('../server')

var btcSend = async function (req, res) {
    try {
        console.log('\nbtcSend body:', req.body)
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var chain = server.network === 'testnet' ? 'test3' : 'main'
        var amountSatoshi

        if (!sourceAddress || !privateKey || !destinationAddress || !amount) {
            console.log('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }
        if (!bitcore.Address.isValid(sourceAddress, server.network)) {
            console.log('Invalid sourceAddress')
            res.json({
                result: 'error',
                message: 'Invalid sourceAddress',
            })
            return
        }
        if (!bitcore.Address.isValid(destinationAddress, server.network)) {
            console.log('Invalid destinationAddress')
            res.json({
                result: 'error',
                message: 'Invalid destinationAddress',
            })
            return
        }
        if (!bitcore.PrivateKey.isValid(privateKey, server.network)) {
            console.log('Invalid PrivateKey')
            res.json({
                result: 'error',
                message: 'Invalid PrivateKey',
            })
            return
        }
        try {
            amountSatoshi = sb.toSatoshi(amount)
        } catch (error) {
            console.error('Invalid amount')
            res.json({
                result: 'error',
                message: 'Invalid amount',
            })
            return
        }

        getBalance(sourceAddress, chain, res, function (balance) {
            console.log(balance, ' < ', amountSatoshi)
            if (balance < amountSatoshi) {
                console.log('Insufficient funds')
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
                    console.log('Failed to sign Transaction')
                    console.error(error)
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
                    var path = server.network === 'mainnet' ? 'btc' : 'btc-testnet'
                    const url = `https://live.blockcypher.com/${path}/tx/${txid}`
                    console.log({ transactionHash: txid, link: url })
                    res.json({
                        result: 'success',
                        transactionHash: txid,
                        link: url
                    })
                })
            })
        })
    } catch (error) {
        console.error('btcSend catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
    }
}

function getBalance(address, chain, res, callback) {
    request({
        url: `https://api.blockcypher.com/v1/btc/${chain}/addrs/${address}/balance`,
        json: true
    }, function (error, response, body) {
        if (error) {
            console.error(error)
            res.json({
                result: 'error',
                message: error,
            })
            return
        }
        if (body.error) {
            console.log(body.error)
            res.json({
                result: 'error',
                message: body.error,
            })
            return
        }
        var balance = sb.toBitcoin(body.final_balance)
        console.log('Source address balance is:', balance + ' BTC')
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
        url: `http://api.blockcypher.com/v1/btc/${chain}/addrs/${address}?unspentOnly=true&includeScript=true`,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (!body.txrefs) {
                console.log('Empty Unspend Transaction (Pending other Transaction)')
                res.json({
                    result: 'error',
                    message: 'Empty Unspend Transaction (Pending other Transaction)',
                })
                return
            }
            console.log('UTXO length: ', body.txrefs.length)
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
            console.log(error)
            console.log('Unable to get UTXO')
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
        url: `https://api.blockcypher.com/v1/btc/${chain}/txs/push`,
        method: 'POST',
        json: true,
        headers: { 'content-type': 'application/json' },
        body: pload
    }, function (err, response, body) {
        if (err) {
            console.log(err)
            console.log('Broadcast failed. Please try later')
            res.json({
                result: 'error',
                message: 'Broadcast failed. Please try later',
            })
            return
        } else {
            if (body.error) {
                console.log(body.error)
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
