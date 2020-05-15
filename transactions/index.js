var server = require('../server')
var requests = require('../models/requests')
var { dbPendingEthTx, dbPendingEthTokenTx, getEthTxByHashes, getEthErcTokenTxByHashes } = require('./eth-transaction')
var { dbPendingBtcTx } = require('./btc-transaction')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var checkPendingRequests = function () {
    requests.find({ status: 'Pending' }, (err, docs) => {
        if (err) logger.error(err)
        if (docs.length) {
            logger.debug('Pending requests from DB length:', docs.length)
            // server.btcAccounts = server.btcAccounts.concat(docs.filter(x => x.type === 'btc').map(x => { return x.address }))
            // server.ethAccounts = server.ethAccounts.concat(docs.filter(x => x.type === 'eth').map(x => { return x.address }))
            // // remove duplicates
            // server.btcAccounts = server.btcAccounts.filter((item, pos) => { return server.btcAccounts.indexOf(item) == pos })
            // server.ethAccounts = server.ethAccounts.filter((item, pos) => { return server.ethAccounts.indexOf(item) == pos })
            // logger.debug('BTC length:', server.btcAccounts.length, 'ETH length:', server.ethAccounts.length)
            docs.forEach(doc => {
                logger.debug('Checking transaction for type:', doc.type, ', address:', doc.address)
                if (doc.type === 'btc') {
                    if (!server.btcAccounts.includes(doc.address)) {
                        server.btcAccounts.push(doc.address)
                        dbPendingBtcTx(doc.address, doc.blocknumber)
                    }
                }
                if (doc.type === 'eth') {
                    if (!server.ethAccounts.includes(doc.address)) {
                        if (doc.ercToken) {
                            var index = server.ercToken.findIndex(x => x.ercToken === doc.ercToken)
                            if (index >= 0) {
                                server.ethAccounts.push(server.ercToken[index].contractAddress)
                                server.ethErcTokenAccounts.push(doc.address)
                            }
                            dbPendingEthTokenTx(doc.address, doc.blocknumber, doc.ercToken)
                        } else {
                            server.ethAccounts.push(doc.address)
                            dbPendingEthTx(doc.address, doc.blocknumber)
                        }
                    }
                }
            })
        }
    })
}

var runCronJob = function () {
    if (server.ethTxHashes.length)
        getEthTxByHashes()
    if (server.ethErcTokenTxHashes.length)
        getEthErcTokenTxByHashes()
}

exports.checkPendingRequests = checkPendingRequests
exports.runCronJob = runCronJob