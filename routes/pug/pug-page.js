const bitcore = require('bitcore-lib')
const QRCode = require('qrcode')
const request = require('request')
var server = require('../../server')
var requests = require('../../models/requests')
var { btcWsSubscribeAddress } = require('../../transactions/btc-transaction')
const { logger } = require('../../utils/logger')

var pugPage = function (req, res) {
    logger.debug('pugPage query params:', req.query)
    var error = false, message = '', contractAddress
    var params = {
        type: req.query.type,
        address: req.query.address,
        token: req.query.token,
        timestamp: req.query.timestamp,
        callback: req.query.callback,
        postCallback: req.query.postCallback,
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
            } else if (params.type === 'eth' || server.ercTokens.some(x => x.ercToken === params.type)) {
                if (!server.web3.utils.isAddress(params.address)) {
                    error = true
                    message += 'Invalid address. '
                }
                // Check ERC Token
                if (server.ercTokens.some(x => x.ercToken === params.type)) {
                    var index = server.ercTokens.findIndex(x => x.ercToken === params.type)
                    if (index >= 0) {
                        contractAddress = server.ercTokens[index].contractAddress
                    }
                    if (!contractAddress) {
                        error = true
                        message += 'Invalid type. '
                    }
                }
            } else if (params.type === 'phoenix') {
                if (!server.phoenixWeb3.utils.isAddress(params.address)) {
                    error = true
                    message += 'Invalid address. '
                }
            } else {
                error = true
                message += 'Invalid type. '
            }
        }
    }

    if (error) {
        logger.error('Error message: ' + message)
        res.render('index', { error: error, message: message })
    } else {
        try {
            QRCode.toDataURL(params.address, function (error, url) {
                if (error) {
                    res.render('index', { error: true, message: error.toString() })
                }
                requests.findOne({ address: params.address }, (error, doc) => {
                    if (error) {
                        res.render('index', { error: true, message: error.toString() })
                    } else {
                        if (!doc) {
                            // BTC
                            if (params.type === 'btc') {
                                request({
                                    url: `${server.btcAPI}`,
                                    json: true
                                }, function (error, response, body) {
                                    try {
                                        if (error) {
                                            logger.error('Error: ' + error)
                                            res.render('index', { error: true, message: error.toString() })
                                            return
                                        }
                                        logger.debug('BTC current blocknumber: ' + body.height)
                                        // subscibe address
                                        btcWsSubscribeAddress(params.address)
                                        // Save request
                                        requests.create({
                                            type: params.type,
                                            address: params.address,
                                            token: params.token,
                                            timestamp: params.timestamp,
                                            callback: params.callback,
                                            postCallback: params.postCallback,
                                            blocknumber: body.height,
                                            status: 'Pending',
                                            apiCallCount: 0,
                                            createdDate: new Date()
                                        }).then(() => {
                                            logger.info('DB Request inserted')
                                            res.render('index', { src: url, account: params.address })
                                        }, error => {
                                            logger.error('Error: ' + error)
                                            res.render('index', { error: true, message: error.toString() })
                                        })
                                    } catch (error) {
                                        logger.error('Error: ' + error)
                                        res.render('index', { error: true, message: error.toString() })
                                    }
                                })
                            }
                            // ETH or ERC tokens
                            if (params.type === 'eth' || server.ercTokens.some(x => x.ercToken === params.type)) {
                                server.web3.eth.getBlockNumber().then((blocknumber) => {
                                    logger.debug('ETH current blocknumber: ' + blocknumber)
                                    // Save request
                                    var ethRequest = {
                                        type: params.type,
                                        address: params.address,
                                        token: params.token,
                                        timestamp: params.timestamp,
                                        callback: params.callback,
                                        postCallback: params.postCallback,
                                        blocknumber: blocknumber,
                                        status: 'Pending',
                                        apiCallCount: 0,
                                        createdDate: new Date()
                                    }
                                    if (contractAddress)
                                        ethRequest.contractAddress = contractAddress
                                    requests.create(ethRequest).then(() => {
                                        logger.info('DB Request inserted')
                                        res.render('index', { src: url, account: params.address })
                                    }, error => {
                                        logger.error('Error: ' + error)
                                        res.render('index', { error: true, message: error.toString() })
                                    })
                                }, error => {
                                    logger.error('Error: ' + error)
                                    res.render('index', { error: true, message: error.toString() })
                                })
                            }
                            // Phoenix
                            if (params.type === 'phoenix') {
                                server.phoenixWeb3.eth.getBlockNumber().then((blocknumber) => {
                                    logger.debug('Phoenix current blocknumber: ' + blocknumber)
                                    // Save request
                                    var phoenixRequest = {
                                        type: params.type,
                                        address: params.address,
                                        token: params.token,
                                        timestamp: params.timestamp,
                                        callback: params.callback,
                                        postCallback: params.postCallback,
                                        blocknumber: blocknumber,
                                        status: 'Pending',
                                        apiCallCount: 0,
                                        createdDate: new Date()
                                    }
                                    requests.create(phoenixRequest).then(() => {
                                        logger.info('DB Request inserted')
                                        res.render('index', { src: url, account: params.address })
                                    }, error => {
                                        logger.error('Error: ' + error)
                                        res.render('index', { error: true, message: error.toString() })
                                    })
                                }, error => {
                                    logger.error('Error: ' + error)
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
            logger.error('Error: ' + error)
            res.render('index', { error: true, message: error.toString() })
        }
    }

}

module.exports = pugPage