var server = require('../server')
var requests = require('../models/requests')
var { dbPendingEthTx, dbPendingEthTokenTx } = require('./eth-transaction')
var { dbPendingBtcTx } = require('./btc-transaction')
var { dbPendingPhoenixTx } = require('./phoenix-transaction')
var { makeTimeoutCallback } = require('./callback')
const { logger } = require('../utils/logger')

var checkPendingRequests = function () {
    logger.verbose('Checking transactions at time: ' + new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    requests.find({ status: 'Pending' }, (error, docs) => {
        if (error) logger.error('Error: ' + error)
        if (docs.length) {
            logger.debug('Pending requests from DB length: ' + docs.length)
            logger.verbose('Pending requests for BTC from DB length: ' + docs.filter(x => x.type === 'btc').length)
            logger.verbose('Pending requests for ETH from DB length: ' + docs.filter(x => x.type === 'eth').length)
            logger.verbose('Pending requests for ERC from DB length: ' + docs.filter(x => x.type !== 'btc' && x.type !== 'eth' && x.type !== 'phoenix').length)
            logger.verbose('Pending requests for PHOENIX from DB length: ' + docs.filter(x => x.type === 'phoenix').length)
            var offset = 0
            docs.forEach(doc => {
                // 1 sec gap between api calls, to reduce limit
                setTimeout(() => {
                    logger.debug(`Checking transaction for type: ${doc.type}, address: ${doc.address}, api call count: ${doc.apiCallCount}`)
                    // increase api's call count
                    requests.updateOne({ address: doc.address }, { $inc: { apiCallCount: 1 } }, (error, doc) => {
                        if (error) logger.error('Error: ' + error)
                    })
                    if (doc.type === 'btc') {
                        dbPendingBtcTx(doc.address, doc.blocknumber)
                    } else if (doc.type === 'eth') {
                        dbPendingEthTx(doc.address, doc.blocknumber)
                    } else if (doc.type === 'phoenix') {
                        dbPendingPhoenixTx(doc.address, doc.blocknumber)
                    } else if (server.ercTokens.some(x => x.ercToken === doc.type)) {
                        dbPendingEthTokenTx(doc.address, doc.blocknumber, doc.contractAddress)
                    } else {
                        logger.warn('Unknown type from DB' + doc.type)
                    }
                    // 1151 calls ie., 4 days after if no transaction found for address will be timeout
                    if (doc.apiCallCount >= 1151) {
                        requests.findOneAndUpdate({ address: doc.address }, { status: 'Timeout' }, (error, doc) => {
                            if (error) logger.error('Error: ' + error)
                            if (doc) {
                                logger.info('DB request status updated as Timeout')
                                // make timeout callback
                                makeTimeoutCallback(doc.address)
                            }
                        })
                    }
                }, 500 + offset)
                offset += 500
            })
        }
    })
}

// var checkSessionTimeout = function (address) {
//     logger.debug(`Address: ${address} session started`)
//     setTimeout(() => {
//         // update db
//         requests.findOneAndUpdate({ address: address, status: 'Pending' }, { status: 'Timeout' }, (error, doc) => {
//             if (error) logger.error('Error: ' + error)
//             // make timeout callback
//             if (doc) {
//                 logger.warn(`Address: ${address} session timeout`)
//                 logger.info('DB request status updated as Timeout')
//                 makeTimeoutCallback(address)
//             }
//         })
//     }, 310000) // session expires in 5 mins 10 secs (310000). 10 secs more for page loading and user to read message
// }

exports.checkPendingRequests = checkPendingRequests