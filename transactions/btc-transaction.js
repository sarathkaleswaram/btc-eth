const request = require('request')
const sb = require('satoshi-bitcoin')
var requests = require('../models/requests')
var transactions = require('../models/transactions')
var server = require('../server')
var { makeCallback, wsSend } = require('./callback')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'trace'

var dbPendingBtcTx = function (address, blocknumber) {
    var web3 = server.web3
    var url = `${server.btcAPI}/addrs/${address}/full?before=${blocknumber}`
    logger.debug('Running Blockcypher API: ', url)
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (error) logger.error(error)
        if (body.error) {
            logger.error(body.message)
        } else {
            logger.debug('Txs length:', body.txs.length)
            body.txs.forEach(tx => {
                var outputIndex = tx.outputs.findIndex(x => x.addresses.includes(address))
                if (outputIndex >= 0) {
                    // get all input addresses - make unique - join to single string
                    var inputAddresses = tx.inputs.map(x => { return x.addresses.join() }).filter((item, i, ar) => ar.indexOf(item) === i).join()
                    logger.debug('Got tx from: ', inputAddresses, ', amount: ', tx.outputs[outputIndex].value, ', hash:', tx.hash)
                    // make callback
                    makeCallback('btc', inputAddresses, address, tx.hash, sb.toBitcoin(tx.outputs[outputIndex].value))
                    // save transaction
                    transactions.create({
                        type: 'btc',
                        address: address,
                        from: inputAddresses,
                        amount: sb.toBitcoin(tx.outputs[outputIndex].value),
                        timeStamp: tx.confirmed,
                        transactionHash: tx.hash,
                        blockHash: tx.block_hash,
                        blockNumber: tx.block_height,
                        fee: sb.toBitcoin(tx.fees)
                    }).then(() => logger.debug('BTC Transaction inserted')).catch(error => logger.error(error))
                }
            })
        }
    })
}

var sendBtcWsEvent = function () {
    // if (server.btcAccounts.length)

    // server.btcWebsocket.send(JSON.stringify({ "op": "unconfirmed_sub" }))
    // server.btcWebsocket.send(JSON.stringify({ "event": "unconfirmed-tx" }))
    // server.btcWebsocket.send(JSON.stringify({ type: "new-transaction" }))
    server.btcWebsocket.send(JSON.stringify({ type: "transaction", txid: "bc7d5ac1d795ee783dd37389a99aeb3abd10cd614cea57540656bffc5900c31e" }))
    // server.btcWebsocket.send(JSON.stringify({ type: "new-transaction", unsubscribe: true }))
    // server.btcWebsocket.send(JSON.stringify({ type: "new-block", unsubscribe: true }))
}

var subscribeBtcUnconfirmedTx = function () {
    server.btcWebsocket.on('message', function incoming(data) {
        data = JSON.parse(data)
        // console.log(data)
        if (data.type === 'subscribe-response') {
            logger.trace(data.payload.message)
        } else if (data.type === 'heartbeat') {
            // logger.trace(data)
        } else if (data.type === 'new-transaction') {
            logger.trace(data.payload.txid)
            // server.btcWebsocket.send(JSON.stringify({ type: "transaction", txid: "c2ea1f535b9c5261c9e08605bb298e1ffc374984c3a6ef687eb7fb01bad510ea", unsubscribe: true }))
            server.btcWebsocket.send(JSON.stringify({ type: "new-transaction", unsubscribe: true }))
        } else if (data.type === 'new-block') {
            logger.trace(data)
        } else {
            logger.trace(data)
        }
        // if (data.op === 'utx') {
        //     logger.trace(data.x.hash)            
        // }
    })
}

var getBitcoinTransaction = function (address) {
    var ws = new WebSocket("wss://socket.blockcypher.com/v1/btc/main");
    var count = 0;
    // logger.debug(ws)s
    ws.onmessage = function (event) {
        logger.debug(event)
        // var tx = JSON.parse(event.data);
        // var shortHash = tx.hash.substring(0, 6) + "...";
        // var total = tx.total / 100000000;
        // var addrs = tx.addresses.join(", ");
        // console.loog(addrs,total)
        //   $('#browser-websocket').before("<div>Unconfirmed transaction " + shortHash + " totalling " + total + "BTC involving addresses " + addrs + "</div>");
        //   count++;
        //   if (count > 10) ws.close();
    }
    ws.onopen = function (event) {
        // logger.debug(ws.onopen)
        // ws.send(JSON.stringify({ "event": "ping" }));
        ws.send(JSON.stringify({ event: "unconfirmed-tx" }));
    }
    //   address='1DEP8i3QJCsomS4BSMY2RpU1upv62aGvhD'
    //   logger.debug(address,"=================-")
    //   const  url = 'https://api.blockcypher.com/v1/btc/main/addrs/'+address+'/full';
    //   logger.debug(url,"=================")
    //   request({
    //     url: url,
    //     json: true
    // }, function (error, response, body) {
    //   logger.debug(body,"----");
    //   logger.debug(error,"+++++++++=");

    //   })
}

exports.dbPendingBtcTx = dbPendingBtcTx
exports.sendBtcWsEvent = sendBtcWsEvent
exports.subscribeBtcUnconfirmedTx = subscribeBtcUnconfirmedTx