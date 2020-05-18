const bitcore = require('bitcore-lib')
const QRCode = require('qrcode')
const request = require('request')
var server = require('../server')
var requests = require('../models/requests')
var { checkSessionTimeout } = require('../transactions')
var { btcWsSubscribeAddress } = require('../transactions/btc-transaction')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var pugPage = function (req, res) {
    logger.debug('pugPage query params:', req.query)
    var error = false, message = '', contractAddress
    var params = {
        type: req.query.type,
        ercToken: req.query.ercToken,
        address: req.query.address,
        token: req.query.token,
        timestamp: req.query.timestamp,
        callback: req.query.callback
    }

    if (!params.address) {
        error = true
        message += 'Address is empty. '
    }
    if (!params.token) {
        error = true
        message += 'Token is empty. '
    }
    if (!params.timestamp) {
        error = true
        message += 'Timestamp is empty. '
    }
    if (!params.callback) {
        error = true
        message += 'Callback is empty. '
    }
    if (!params.type) {
        error = true
        message += 'Type is empty. '
    } else {
        params.type = params.type.toLowerCase()
        if (params.type !== 'btc' && params.type !== 'eth') {
            error = true
            message += 'Invalid type. '
        } else {
            if (params.address) {
                if (params.type === 'btc') {
                    if (!bitcore.Address.isValid(params.address, server.network)) {
                        error = true
                        message += 'Invalid address. '
                    }
                }
                if (params.type === 'eth') {
                    if (!server.web3.utils.isAddress(params.address)) {
                        error = true
                        message += 'Invalid address. '
                    }
                    // Check ERC Token
                    if (params.ercToken) {
                        var index = server.ercToken.findIndex(x => x.ercToken === params.ercToken.toUpperCase())
                        if (index >= 0) {
                            contractAddress = server.ercToken[index].contractAddress
                        }
                        if (!contractAddress) {
                            error = true
                            message += 'Unknown ERC Token. '
                        }
                    }
                }
            }
        }
    }

    if (error) {
        logger.error('Error message:', message)
        res.render('index', { error: error, message: message })
    } else {
        try {
            QRCode.toDataURL(params.address, function (err, url) {
                requests.findOne({ address: params.address }, (err, doc) => {
                    if (err) {
                        res.render('index', { error: true, message: err.toString() })
                    } else {
                        if (!doc) {
                            // session expires in 5 mins
                            checkSessionTimeout(params.address, params.ercToken)
                            // BTC
                            if (params.type === 'btc') {
                                request({
                                    url: `${server.btcAPI}`,
                                    json: true
                                }, function (error, response, body) {
                                    if (error) {
                                        logger.error(error)
                                        res.render('index', { error: true, message: error.toString() })
                                        return
                                    }
                                    logger.debug('BTC current blocknumber:', body.height)
                                    // add to btc accounts array
                                    server.btcAccounts.push(params.address)
                                    btcWsSubscribeAddress(params.address)
                                    // Save request
                                    requests.create({
                                        type: params.type,
                                        address: params.address,
                                        token: params.token,
                                        timestamp: params.timestamp,
                                        callback: params.callback,
                                        blocknumber: body.height,
                                        status: 'Pending',
                                        createdDate: new Date()
                                    }).then(() => {
                                        logger.debug('Request inserted')
                                        res.render('index', { src: url, account: params.address })
                                    }, error => {
                                        logger.error(error)
                                        res.render('index', { error: true, message: error.toString() })
                                    })
                                })
                            }
                            // ETH
                            if (params.type === 'eth') {
                                server.web3.eth.getBlockNumber().then((blocknumber) => {
                                    logger.debug('ETH current blocknumber:', blocknumber)
                                    // add to eth accounts array
                                    if (params.ercToken) {
                                        server.ethAccounts.push(contractAddress)
                                        server.ethErcTokenAccounts.push(params.address)
                                    } else {
                                        server.ethAccounts.push(params.address)
                                    }
                                    // Save request
                                    var ethRequest = {
                                        type: params.type,
                                        address: params.address,
                                        token: params.token,
                                        timestamp: params.timestamp,
                                        callback: params.callback,
                                        blocknumber: blocknumber,
                                        status: 'Pending',
                                        createdDate: new Date()
                                    }
                                    if (params.ercToken)
                                        ethRequest.ercToken = params.ercToken.toUpperCase()
                                    requests.create(ethRequest).then(() => {
                                        logger.debug('Request inserted')
                                        res.render('index', { src: url, account: params.address })
                                    }, error => {
                                        logger.error(error)
                                        res.render('index', { error: true, message: error.toString() })
                                    })
                                }, error => {
                                    logger.error(error)
                                    res.render('index', { error: true, message: error.toString() })
                                })
                            }
                        } else {
                            logger.error('Request already exists. Account already used.')
                            res.render('index', { error: true, message: 'Account address already used.' })
                            // if (doc.status === 'Completed') {
                            //     logger.error('Request already exists. Account already used.')
                            //     res.render('index', { error: true, message: 'Account address already used.' })
                            // } else {
                            //     logger.debug('Request already exists. Account not used.')
                            //     res.render('index', { src: url, account: params.address })
                            // }
                        }
                    }
                })
            })
        } catch (error) {
            logger.error(error)
            res.render('index', { error: true, message: error.toString() })
        }
    }

}

module.exports = pugPage