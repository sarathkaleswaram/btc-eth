const request = require('request')
const WebSocket = require('ws')
var server = require('../server')
var requests = require('../models/requests')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var makeCallback = function (type, sender, receiver, tid, amount) {
    logger.debug('Making callback:', type, sender, receiver, tid, amount)
    if (type === 'btc') {
        server.btcAccounts.splice(server.btcAccounts.findIndex(x => x === receiver), 1)
    } else {
        server.ethAccounts.splice(server.ethAccounts.findIndex(x => x === receiver), 1)
    }
    requests.findOneAndUpdate({ address: receiver }, { status: 'Completed' }, (err, doc) => {
        if (err) logger.error(err)
        if (doc) {
            wsSend(receiver, 'eth', 'confirmed', amount, tid, doc.callback)
            var payload = {
                type: type,
                token: doc.token,
                timestamp: doc.timestamp,
                receiver: receiver,
                sender: sender,
                amount: amount,
                tid: tid
            }
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

var wsSend = function (address, type, wsType, amount, txHash, callbackUrl) {
    server.wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            var url, title, wsMessage, currency
            if (type === 'btc') {
                var path = server.network === 'mainnet' ? 'btc' : 'btc-testnet'
                url = `https://live.blockcypher.com/${path}/tx/${txHash}`
                currency = 'BTC'
            }
            if (type === 'eth') {
                var subdomain = server.ethNetwork === 'mainnet' ? '' : server.ethNetwork + '.'
                url = `https://${subdomain}etherscan.io/tx/${txHash}`
                currency = 'ETH'
            }
            if (wsType === 'submitted') {
                title = 'Your transaction is submitted and pending.'
                wsMessage = 'Once transaction is confirmed, we will credit the amount.'
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
            logger.debug('WS send:', message)
            client.send(JSON.stringify(message))
        }
    })
}

exports.wsSend = wsSend
exports.makeCallback = makeCallback