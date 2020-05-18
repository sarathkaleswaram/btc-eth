const request = require('request')
const WebSocket = require('ws')
var server = require('../server')
var requests = require('../models/requests')
var transactions = require('../models/transactions')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var checkTxAndCallback = function (type, address, from, amount, timeStamp, transactionHash, blockHash, blockNumber, fee, ercToken) {
    // check tx hash in db
    transactions.findOne({ transactionHash: transactionHash }, (err, doc) => {
        if (err) {
            logger.error('DB Error:', err)
        } else {
            if (!doc) {
                // make callback
                makeConfirmedCallback(type, from, address, transactionHash, amount, ercToken)
                // save transaction
                var saveTx = {
                    type: type,
                    address: address,
                    from: from,
                    amount: amount,
                    timeStamp: timeStamp,
                    transactionHash: transactionHash,
                    blockHash: blockHash,
                    blockNumber: blockNumber,
                    fee: fee,
                    createdDate: new Date()
                }
                if (ercToken)
                    saveTx.ercToken = ercToken
                transactions.create(saveTx).then(() => logger.debug(`${type === 'btc' ? 'BTC' : 'ETH'} ${ercToken ? ercToken : ''} Transaction inserted`)).catch(error => logger.error(error))
            } else {
                logger.warn('Transaction hash already present in db. Got same tx again. Tx:', transactionHash)
                requests.findOneAndUpdate({ address: address }, { status: 'Completed' }, (err, doc) => { })
            }
        }
    })
}

var makeConfirmedCallback = function (type, sender, receiver, tid, amount, ercToken) {
    logger.debug('Making callback:', type, sender, receiver, tid, amount, ercToken)
    requests.findOneAndUpdate({ address: receiver }, { status: 'Completed' }, (err, doc) => {
        if (err) logger.error(err)
        if (doc) {
            wsSend(receiver, type, 'confirmed', amount, tid, ercToken, doc.callback, doc.token, doc.timestamp, sender, 1, 0)
            var payload = {
                type: type,
                token: doc.token,
                timestamp: doc.timestamp,
                receiver: receiver,
                sender: sender,
                amount: amount,
                tid: tid,
                status: 1, // 1 = tx confirmed as per game
                timeout: 0 // 0 = session not expired as per game
            }
            if (ercToken)
                payload.ercToken = ercToken
            request({
                url: server.a2zUrl,
                method: 'POST',
                json: true,
                headers: { 'content-type': 'application/json' },
                body: payload
            }, function (err, response, body) {
                if (err) {
                    logger.error(err)
                } else {
                    logger.debug('A2Z Callback response:', body)
                }
            })
        }
    })
}

var makeSubmittedCallback = function (type, sender, receiver, tid, amount, ercToken) {
    logger.debug('Making callback:', type, sender, receiver, tid, amount, ercToken)
    requests.findOne({ address: receiver }, (err, doc) => {
        if (err) logger.error(err)
        if (doc) {
            wsSend(receiver, type, 'submitted', amount, tid, ercToken, doc.callback, doc.token, doc.timestamp, sender, 0, 0)
            var payload = {
                type: type,
                token: doc.token,
                timestamp: doc.timestamp,
                receiver: receiver,
                sender: sender,
                amount: amount,
                tid: tid,
                status: 0, // 0 = tx submitted as per game
                timeout: 0 // 0 = session not expired as per game
            }
            if (ercToken)
                payload.ercToken = ercToken
            request({
                url: server.a2zUrl,
                method: 'POST',
                json: true,
                headers: { 'content-type': 'application/json' },
                body: payload
            }, function (err, response, body) {
                if (err) {
                    logger.error(err)
                } else {
                    logger.debug('A2Z Callback response:', body)
                }
            })
        }
    })
}

var makeTimeoutCallback = function (type, address, ercToken) {
    logger.debug('Making Timeout callback:', type, address, ercToken)
    requests.findOne({ address: address }, (err, doc) => {
        if (err) logger.error(err)
        if (doc) {
            wsSend(address, type, 'timeout', undefined, undefined, ercToken, doc.callback, doc.token, doc.timestamp, undefined, 0, 1)
            var payload = {
                type: type,
                token: doc.token,
                timestamp: doc.timestamp,
                receiver: address,
                sender: undefined,
                amount: undefined,
                tid: undefined,
                status: 0, // 0 = tx submitted as per game
                timeout: 1 // 1 = session expired as per game
            }
            if (ercToken)
                payload.ercToken = ercToken
            request({
                url: server.a2zUrl,
                method: 'POST',
                json: true,
                headers: { 'content-type': 'application/json' },
                body: payload
            }, function (err, response, body) {
                if (err) {
                    logger.error(err)
                } else {
                    logger.debug('A2Z Callback response:', body)
                }
            })
        }
    })
}

var wsSend = function (address, type, wsType, amount, txHash, ercToken, callback, token, timestamp, sender, status, timeout) {
    logger.debug('WS send:', address, type, wsType, amount, txHash, ercToken, callback, token, timestamp, sender, status, timeout)
    server.wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            var url, title, wsMessage, currency
            var callbackUrl = callback + `?type=${type}&token=${token}&timestamp=${timestamp}&receiver=${address}&sender=${sender}&amount=${amount}&tid=${txHash}&status=${status}&timeout=${timeout}`
            if (ercToken) {
                callbackUrl += `&ercToken=${ercToken}`
            }
            if (type === 'btc') {
                url = `${server.btcExplorerUrl}/tx/${txHash}`
                currency = 'BTC'
            }
            if (type === 'eth') {
                url = `${server.etherscanExplorerUrl}/tx/${txHash}`
                currency = ercToken ? ercToken : 'ETH'
            }
            if (wsType === 'submitted') {
                title = 'Your transaction is submitted and pending.'
                wsMessage = 'Once transaction is confirmed, we will credit the amount. <br><br> You will be redirected back.'
            }
            if (wsType === 'confirmed') {
                title = 'Your transaction is confirmed.'
                wsMessage = 'You will be redirected back.'
            }
            var message = {
                address: address,
                type: wsType,
                title: title,
                template: `With amount ${amount} ${currency}. Transaction hash <a href='${url}' target='_blank'>${txHash}</a>`,
                message: wsMessage,
                callbackUrl: callbackUrl
            }
            client.send(JSON.stringify(message))
        }
    })
}

exports.makeSubmittedCallback = makeSubmittedCallback
exports.checkTxAndCallback = checkTxAndCallback
exports.makeTimeoutCallback = makeTimeoutCallback