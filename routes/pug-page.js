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
        if (params.address) {
            if (params.type === 'btc') {
                if (!bitcore.Address.isValid(params.address, server.network)) {
                    error = true
                    message += 'Invalid address. '
                }
            } else if (params.type === 'eth' || server.ercToken.some(x => x.ercToken === params.type)) {
                if (!server.web3.utils.isAddress(params.address)) {
                    error = true
                    message += 'Invalid address. '
                }
                // Check ERC Token
                if (server.ercToken.some(x => x.ercToken === params.type)) {
                    var index = server.ercToken.findIndex(x => x.ercToken === params.type)
                    if (index >= 0) {
                        contractAddress = server.ercToken[index].contractAddress
                    }
                    if (!contractAddress) {
                        error = true
                        message += 'Invalid type. '
                    }
                }
            } else {
                error = true
                message += 'Invalid type. '
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
                            checkSessionTimeout(params.address)
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
                                    // subscibe address
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
                                        logger.info('DB Request inserted')
                                        res.render('index', { src: url, account: params.address })
                                    }, error => {
                                        logger.error(error)
                                        res.render('index', { error: true, message: error.toString() })
                                    })
                                })
                            }
                            // ETH or ERC tokens
                            if (params.type === 'eth' || server.ercToken.some(x => x.ercToken === params.type)) {
                                server.web3.eth.getBlockNumber().then((blocknumber) => {
                                    logger.debug('ETH current blocknumber:', blocknumber)
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
                                    if (contractAddress)
                                        ethRequest.contractAddress = contractAddress
                                    requests.create(ethRequest).then(() => {
                                        logger.info('DB Request inserted')
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
                            logger.warn('Address already used.')
                            res.render('index', { error: true, message: 'Address already used.' })
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