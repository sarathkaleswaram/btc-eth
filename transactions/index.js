var server = require('../server')
var requests = require('../models/requests')
var { dbPendingEthTx, getEthTxByHashes } = require('./eth-transaction')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var checkPendingRequests = function () {
    requests.find({ status: 'Pending' }, (err, doc) => {
        if (err) logger.error(err)
        if (doc) {
            logger.debug('Pending requests from DB length:', doc.length)
            if (doc.length) {
                server.btcAccounts = server.btcAccounts.concat(doc.filter(x => x.type === 'btc').map(x => { return x.address }))
                server.ethAccounts = server.ethAccounts.concat(doc.filter(x => x.type === 'eth').map(x => { return x.address }))
                logger.debug('BTC length:', server.btcAccounts.length, 'ETH length:', server.ethAccounts.length)
                doc.forEach(req => {
                    logger.debug('Checking transaction for type:', req.type, ', address:', req.address)
                    if (req.type === 'btc') {
                        // TODO:
                    }
                    if (req.type === 'eth') {
                        dbPendingEthTx(req.address, req.blocknumber)
                    }
                })
            }
        }
    })
}

var runCronJob = function () {
    if (server.ethTxHashes.length)
        getEthTxByHashes()
}

exports.checkPendingRequests = checkPendingRequests
exports.runCronJob = runCronJob