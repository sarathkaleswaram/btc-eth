const request = require('request')
const WebSocket = require('ws')
var server = require('../server')
var requests = require('../models/requests')
var transactions = require('../models/transactions')

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var getPostCallbackUrl = function (postCallback, callback) {
    if (postCallback) {
        return postCallback
    } else {
        if (callback.includes('jackpotvilla'))
            return server.jackpotCallbackURL
        else if (callback.includes('slotstitan'))
            return server.slotstitanCallbackURL
        else
            return server.jackpotCallbackURL
    }
}

var checkTxAndCallback = function (type, address, from, amount, timeStamp, transactionHash, blockHash, blockNumber, fee) {
    // check tx hash in db
    transactions.findOne({ transactionHash: transactionHash }, (error, doc) => {
        if (error) {
            logger.error('DB Error:', error)
        } else {
            if (!doc) {
                // make callback
                makeConfirmedCallback(type, from, address, transactionHash, amount)
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
                transactions.create(saveTx).then(() => logger.info(`${type.toUpperCase()} Transaction inserted`)).catch(error => logger.error(error))
            } else {
                logger.warn('Transaction hash already present in db. Got same tx again. Tx:', transactionHash)
                requests.findOneAndUpdate({ address: address }, { status: 'Completed' }, (error, doc) => { })
            }
        }
    })
}

var makeConfirmedCallback = function (type, sender, receiver, tid, amount) {
    logger.debug('Making Confirm callback:', type, sender, receiver, tid, amount)
    requests.findOneAndUpdate({ address: receiver }, { status: 'Completed' }, (error, doc) => {
        if (error) logger.error(error)
        if (doc) {
            wsSend(receiver, type, 'confirmed', amount, tid, doc.callback, doc.token, doc.timestamp, sender, 1, 0)
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
            request({
                url: getPostCallbackUrl(doc.postCallback, doc.callback),
                method: 'POST',
                json: true,
                headers: { 'content-type': 'application/json' },
                body: payload
            }, function (error, response, body) {
                if (error) {
                    logger.error(error)
                } else {
                    logger.debug('Game Callback response:', body)
                }
            })
        }
    })
}

var makeSubmittedCallback = function (type, sender, receiver, tid, amount) {
    logger.debug('Making Submit callback:', type, sender, receiver, tid, amount)
    requests.findOne({ address: receiver }, (error, doc) => {
        if (error) logger.error(error)
        if (doc) {
            wsSend(receiver, type, 'submitted', amount, tid, doc.callback, doc.token, doc.timestamp, sender, 0, 0)
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
            request({
                url: getPostCallbackUrl(doc.postCallback, doc.callback),
                method: 'POST',
                json: true,
                headers: { 'content-type': 'application/json' },
                body: payload
            }, function (error, response, body) {
                if (error) {
                    logger.error(error)
                } else {
                    logger.debug('Game Callback response:', body)
                }
            })
        }
    })
}

var makeTimeoutCallback = function (address) {
    logger.debug('Making Timeout callback:', address)
    requests.findOne({ address: address }, (error, doc) => {
        if (error) logger.error(error)
        if (doc) {
            wsSend(doc.address, doc.type, 'timeout', undefined, undefined, doc.callback, doc.token, doc.timestamp, undefined, 0, 1)
            var payload = {
                type: doc.type,
                token: doc.token,
                timestamp: doc.timestamp,
                receiver: doc.address,
                sender: undefined,
                amount: undefined,
                tid: undefined,
                status: undefined,
                timeout: 1 // 1 = session expired as per game
            }
            request({
                url: getPostCallbackUrl(doc.postCallback, doc.callback),
                method: 'POST',
                json: true,
                headers: { 'content-type': 'application/json' },
                body: payload
            }, function (error, response, body) {
                if (error) {
                    logger.error(error)
                } else {
                    logger.debug('Game Callback response:', body)
                }
            })
        }
    })
}

var wsSend = function (address, type, wsType, amount, txHash, callback, token, timestamp, sender, status, timeout) {
    logger.debug('WS send:', address, type, wsType, amount, txHash, callback, token, timestamp, sender, status, timeout)
    server.wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            var url, title, wsMessage
            var callbackUrl = callback + `?type=${type}&token=${token}&timestamp=${timestamp}&receiver=${address}&sender=${sender}&amount=${amount}&tid=${txHash}&status=${status}&timeout=${timeout}`
            if (type === 'btc') {
                url = `${server.btcExplorerUrl}/tx/${txHash}`
            }
            if (type === 'eth' || server.ercTokens.some(x => x.ercToken === type)) {
                url = `${server.etherscanExplorerUrl}/tx/${txHash}`
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
                template: `With amount ${amount} ${type.toUpperCase()}. Transaction hash <a href='${url}' target='_blank'>${txHash}</a>`,
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