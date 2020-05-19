var server = require('../server')
var requests = require('../models/requests')
var { dbPendingEthTx, dbPendingEthTokenTx } = require('./eth-transaction')
var { dbPendingBtcTx } = require('./btc-transaction')
var { makeTimeoutCallback } = require('./callback')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var checkPendingRequests = function () {
    logger.trace('Checking transactions at time:', new Date())
    requests.find({ $or: [{ status: 'Pending' }, { status: 'Closed' }] }, (err, docs) => {
        if (err) logger.error(err)
        if (docs.length) {
            logger.debug('Pending requests from DB length:', docs.length)
            docs.forEach(doc => {
                logger.debug('Checking transaction for type:', doc.type, ', address:', doc.address)
                if (doc.type === 'btc') {
                    dbPendingBtcTx(doc.address, doc.blocknumber)
                } else if (doc.type === 'eth') {
                    dbPendingEthTx(doc.address, doc.blocknumber)
                } else if (server.ercToken.some(x => x.ercToken === doc.type)) {
                    dbPendingEthTokenTx(doc.address, doc.blocknumber, doc.contractAddress)
                } else {
                    logger.warn('Unknown type from DB', doc.type)
                }
            })
        }
    })
}

var checkSessionTimeout = function (address) {
    logger.debug(`Address: ${address} session started`)
    setTimeout(() => {
        // update db
        requests.findOneAndUpdate({ address: address, status: 'Pending' }, { status: 'Timeout' }, (err, doc) => {
            if (err) logger.error(err)
            // make timeout callback
            if (doc) {
                logger.warn(`Address: ${address} session timeout`)
                makeTimeoutCallback(address)
            }
        })
    }, 310000) // session expires in 5 mins 10 secs (310000). 10 secs more for page loading and user to read message
}

exports.checkPendingRequests = checkPendingRequests
exports.checkSessionTimeout = checkSessionTimeout