var server = require('../server')
var requests = require('../models/requests')
var { dbPendingEthTx, dbPendingEthTokenTx, getEthTxByHashes, getEthErcTokenTxByHashes } = require('./eth-transaction')
var { dbPendingBtcTx } = require('./btc-transaction')
var { makeTimeoutCallback } = require('./callback')

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

var checkSessionTimeout = function (address, ercToken) {
    logger.debug(`Address: ${address} session started`)
    setTimeout(() => {
        // BTC
        if (server.btcAccounts.includes(address)) {
            logger.warn(`Address: ${address} session timeout`)
            // update db
            requests.findOneAndUpdate({ address: address, status: 'Pending' }, { status: 'Timeout' }, (err, doc) => {
                if (err) logger.error(err)
            })
            removeElement(server.btcAccounts, address)
            // make timeout callback
            makeTimeoutCallback('btc', address)
        }
        // ETH
        if (server.ethAccounts.includes(address) || server.ethErcTokenAccounts.includes(address)) {
            logger.warn(`Address: ${address} session timeout`)
            // update db
            requests.findOneAndUpdate({ address: address, status: 'Pending' }, { status: 'Timeout' }, (err, doc) => {
                if (err) logger.error(err)
            })
            // remove from array
            if (ercToken) {
                var index = server.ercToken.findIndex(x => x.ercToken === ercToken.toUpperCase())
                if (index >= 0) {
                    var contractAddress = server.ercToken[index].contractAddress
                    removeElement(server.ethAccounts, contractAddress)
                    removeElement(server.ethErcTokenAccounts, address)
                    // make timeout callback
                    makeTimeoutCallback('eth', address, ercToken)
                }
            } else {
                removeElement(server.ethAccounts, address)
                // make timeout callback
                makeTimeoutCallback('eth', address)
            }
        }
    }, 310000) // session expires in 5 mins 10 secs (310000). 10 secs more for page loading and user to read message
}

var runCronJob = function () {
    if (server.ethTxHashes.length)
        getEthTxByHashes()
    if (server.ethErcTokenTxHashes.length)
        getEthErcTokenTxByHashes()
}

function removeElement(array, elem) {
    var index = array.indexOf(elem)
    if (index > -1) {
        array.splice(index, 1)
    }
}

exports.checkPendingRequests = checkPendingRequests
exports.checkSessionTimeout = checkSessionTimeout
exports.runCronJob = runCronJob