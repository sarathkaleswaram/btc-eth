const request = require('request')
const sb = require('satoshi-bitcoin')
var server = require('../server')
var { checkTxAndCallback, makeSubmittedCallback } = require('./callback')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'trace'

var dbPendingBtcTx = function (address, blocknumber) {
    var url = `${server.btcAPI}/addrs/${address}/full?after=${blocknumber}`
    logger.debug('Running Blockcypher API: ', url)
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
            logger.debug('Txs length:', body.txs.length)
            if (!body.txs.length) {
                logger.debug('Subscribe addresses:', address)
                btcWsSubscribeAddressOnOpen(address)
            }
            body.txs.forEach(tx => {
                if (tx.block_height > 0) {
                    var outputIndex = tx.outputs.findIndex(x => x.addresses.includes(address))
                    if (outputIndex >= 0) {
                        // get all input addresses - make unique - join to single string
                        var inputAddresses = tx.inputs.map(x => { return x.addresses.join() }).filter((item, i, ar) => ar.indexOf(item) === i).join()
                        logger.debug('Got tx from: ', inputAddresses, ', amount: ', tx.outputs[outputIndex].value, ', hash:', tx.hash)
                        // remove from arrays
                        removeElement(server.btcAccounts, address)
                        // check transaction hash with db before making callback and save
                        checkTxAndCallback('btc', address, inputAddresses, sb.toBitcoin(tx.outputs[outputIndex].value), tx.confirmed, tx.hash, tx.block_hash, tx.block_height, sb.toBitcoin(tx.fees))
                    }
                }
            })
        }
    })
}

function removeElement(array, elem) {
    var index = array.indexOf(elem)
    if (index > -1) {
        array.splice(index, 1)
    }
}

var btcWsSubscribeAddressOnOpen = function (address) {
    server.btcWebsocket.on('open', function open() {
        btcWsSubscribeAddress(address)
    })
}

var btcWsSubscribeAddress = function (address) {
    server.btcWebsocket.send(JSON.stringify({ type: 'address', address: address }))
}

var btcWsUnsubscribeAddress = function (address) {
    server.btcWebsocket.send(JSON.stringify({ type: 'address', address: address, unsubscribe: true }))
}

// var sendBtcWsEvent = function () {
//     server.btcWebsocket.send(JSON.stringify({ type: 'new-transaction' }))
//     server.btcWebsocket.send(JSON.stringify({ type: 'transaction', txid: '62a82a27b7a6329d74c002a4650b43647ae74f320a0a64a4a7919a8c5ecdf10c' }))
//     server.btcWebsocket.send(JSON.stringify({ type: 'address', address: 'muwXiE64xymEQnd389N9V3j4cga3sZWyGP' }))
//     server.btcWebsocket.send(JSON.stringify({ type: 'new-transaction', unsubscribe: true }))
// }

var btcWsOnMessage = function () {
    logger.debug('Subscribed to BTC websocket...')
    server.btcWebsocket.on('message', function incoming(data) {
        data = JSON.parse(data)
        if (data.type === 'subscribe-response') {
            logger.trace(data.payload.message)
        } else if (data.type === 'heartbeat') {
            // logger.trace(data)
        } else if (data.type === 'new-transaction') {
            // logger.trace('BTC getting all new tx:', data.payload.txid, ', Checking with Accounts length:', server.btcAccounts.length, ', Accounts:', server.btcAccounts)
            // var outputIndex = data.payload.outputs.findIndex(x => x.addresses.some(r => server.btcAccounts.includes(r)))
            // if (outputIndex >= 0) {
            //     var inputAddresses = data.payload.inputs.map(x => { return x.addresses.join() }).filter((item, i, ar) => ar.indexOf(item) === i).join()
            //     logger.debug('Got BTC tx from: ', inputAddresses, ', amount: ', data.payload.outputs[outputIndex].value, ', hash:', data.payload.txid)
            //     server.btcTxHashes.push(data.payload.txid)
            //     server.btcWebsocket.send(JSON.stringify({ type: 'transaction', txid: data.payload.txid }))
            //     makeSubmittedCallback(data.payload.outputs[outputIndex].addresses[0], 'btc', 'submitted', data.payload.outputs[outputIndex].value, data.payload.txid)
            // }
        } else if (data.type === 'address') {
            logger.debug('BTC ws address method for address:', data.payload.address, ', tx:', data.payload.transaction.txid)
            var outputIndex = data.payload.transaction.outputs.findIndex(x => x.addresses.includes(data.payload.address))
            if (outputIndex >= 0) {
                var inputAddresses = data.payload.transaction.inputs.map(x => { return x.addresses.join() }).filter((item, i, ar) => ar.indexOf(item) === i).join()
                logger.debug('Got BTC tx from: ', inputAddresses, ', amount: ', data.payload.transaction.outputs[outputIndex].value, ', hash:', data.payload.transaction.txid)
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
    logger.debug('Running Blockcypher API: ', url)
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
                // get output array index
                var outputIndex = body.outputs.findIndex(x => x.addresses.some(r => server.btcAccounts.includes(r)))
                if (outputIndex >= 0) {
                    var address = body.outputs[outputIndex].addresses.find(x => server.btcAccounts.includes(x))
                    // unsubscribe to tx and address
                    server.btcWebsocket.send(JSON.stringify({ type: 'transaction', txid: txid, unsubscribe: true }))
                    server.btcWebsocket.send(JSON.stringify({ type: 'address', address: address, unsubscribe: true }))
                    // get unique address inputs
                    var inputAddresses = body.inputs.map(x => { return x.addresses.join() }).filter((item, i, ar) => ar.indexOf(item) === i).join()
                    // remove from arrays
                    removeElement(server.btcAccounts, address)
                    // check transaction hash with db before making callback and save
                    checkTxAndCallback('btc', address, inputAddresses, sb.toBitcoin(body.outputs[outputIndex].value), body.confirmed, body.hash, body.block_hash, body.block_height, sb.toBitcoin(body.fees))
                } else {
                    logger.warn('BTC tx dont have output address:', body, ', btcAccounts:', server.btcAccounts)
                }
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