const request = require('request')
const sb = require('satoshi-bitcoin')
var server = require('../server')
var requests = require('../models/requests')
var { checkTxAndCallback, makeSubmittedCallback } = require('./callback')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'trace'

var dbPendingBtcTx = function (address, blocknumber) {
    var url = `${server.btcAPI}/addrs/${address}/full?after=${blocknumber}`
    logger.trace('Running Blockcypher API:', url)
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (error) {
            logger.error(error)
            return
        }
        if (body.error) {
            logger.error(body.error)
            logger.error(body.message)
        } else {
            logger.debug('Txs BTC length:', body.txs.length, 'for address:', address)
            body.txs.forEach(tx => {
                if (tx.block_height > 0) {
                    var outputIndex = tx.outputs.findIndex(x => x.addresses.includes(address))
                    if (outputIndex >= 0) {
                        // get all input addresses - make unique - join to single string
                        var inputAddresses = tx.inputs.map(x => { return x.addresses.join() }).filter((item, i, ar) => ar.indexOf(item) === i).join()
                        logger.info('Got BTC tx from:', inputAddresses, ', amount:', tx.outputs[outputIndex].value, ', hash:', tx.hash)
                        // check transaction hash with db before making callback and save
                        checkTxAndCallback('btc', address, inputAddresses, sb.toBitcoin(tx.outputs[outputIndex].value), tx.confirmed, tx.hash, tx.block_hash, tx.block_height, sb.toBitcoin(tx.fees))
                    }
                }
            })
        }
    })
}

var btcWsSubscribeAddress = function (address) {
    server.btcWebsocket.send(JSON.stringify({ type: 'address', address: address }))
}

var btcWsUnsubscribeAddress = function (address) {
    server.btcWebsocket.send(JSON.stringify({ type: 'address', address: address, unsubscribe: true }))
}

var btcWsOnMessage = function () {
    server.btcWebsocket.on('message', function incoming(data) {
        data = JSON.parse(data)
        if (data.type === 'subscribe-response') {
            logger.trace(data.payload.message)
        } else if (data.type === 'heartbeat') {
            // logger.trace(data)
        } else if (data.type === 'address') {
            logger.debug('BTC ws address method for address:', data.payload.address, ', tx:', data.payload.transaction.txid)
            var outputIndex = data.payload.transaction.outputs.findIndex(x => x.addresses.includes(data.payload.address))
            if (outputIndex >= 0) {
                var inputAddresses = data.payload.transaction.inputs.map(x => { return x.addresses.join() }).filter((item, i, ar) => ar.indexOf(item) === i).join()
                logger.info('Got BTC tx from:', inputAddresses, ', amount:', data.payload.transaction.outputs[outputIndex].value, ', hash:', data.payload.transaction.txid)
                // subscribe to transaction
                server.btcWebsocket.send(JSON.stringify({ type: 'transaction', txid: data.payload.transaction.txid }))
                // send message to frontend
                makeSubmittedCallback('btc', inputAddresses, data.payload.address, data.payload.transaction.txid, data.payload.transaction.outputs[outputIndex].value)
            } else {
                logger.debug('BTC our address was a sender')
            }
        } else if (data.type === 'transaction') {
            logger.debug('BTC confirmed tx:', data.payload.txid)
            getBtcTxRecurrsive(data.payload.txid)
        } else {
            logger.debug('BTC ws unknown type:', data)
        }
    })
}

function getBtcTxRecurrsive(txid) {
    var url = `${server.btcAPI}/txs/${txid}`
    logger.trace('Running Blockcypher API:', url)
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (error) {
            logger.error(error)
            return
        }
        if (body.error) {
            logger.error(body.error)
            logger.error(body.message)
        } else {
            if (body.block_height > 0) {
                var addressFound = false
                body.outputs.forEach((output, outputIndex) => {
                    output.addresses.forEach((address, addressIndex) => {
                        requests.findOne({ address: address }, (err, doc) => {
                            if (err) {
                                logger.error('DB Error:', err)
                            } else {
                                if (doc) {
                                    addressFound = true
                                    var address = body.outputs[outputIndex].addresses[addressIndex]
                                    // unsubscribe to tx and address
                                    server.btcWebsocket.send(JSON.stringify({ type: 'transaction', txid: txid, unsubscribe: true }))
                                    server.btcWebsocket.send(JSON.stringify({ type: 'address', address: address, unsubscribe: true }))
                                    // get unique address inputs
                                    var inputAddresses = body.inputs.map(x => { return x.addresses.join() }).filter((item, i, ar) => ar.indexOf(item) === i).join()
                                    logger.info('Got BTC tx from:', inputAddresses, ', amount:', body.outputs[outputIndex].value, ', hash:', body.hash)
                                    // check transaction hash with db before making callback and save
                                    checkTxAndCallback('btc', address, inputAddresses, sb.toBitcoin(body.outputs[outputIndex].value), body.confirmed, body.hash, body.block_hash, body.block_height, sb.toBitcoin(body.fees))
                                }
                            }
                        })
                    })
                })
            } else {
                setTimeout(() => {
                    logger.debug('Getting BTC tx after 2 sec. Tx is confrimed by ws but not in http. TX:', txid)
                    getBtcTxRecurrsive(txid)
                }, 2000)
            }
        }
    })
}

exports.dbPendingBtcTx = dbPendingBtcTx
exports.btcWsSubscribeAddress = btcWsSubscribeAddress
exports.btcWsUnsubscribeAddress = btcWsUnsubscribeAddress
exports.btcWsOnMessage = btcWsOnMessage