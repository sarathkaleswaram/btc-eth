const bitcore = require('bitcore-lib')
const QRCode = require('qrcode')
var server = require('../server')
var request = require('../models/request')

var pugPage = function (req, res) {
    console.log('\npugPage query params:', req.query)
    var params = {
        type: req.query.type,
        address: req.query.address,
        token: req.query.token,
        timestamp: req.query.timestamp,
        callback: req.query.callback
    }

    var status = -1
    var error = false, message = ''

    if (!params.type) {
        error = true
        message += 'Type is empty. '
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

    if (params.type.toLowerCase() !== 'btc' && params.type.toLowerCase() !== 'eth') {
        error = true
        message += 'Invalid type. '
    } else {
        if (params.address) {
            if (params.type.toLowerCase() === 'btc') {
                if (!bitcore.Address.isValid(params.address, server.network)) {
                    error = true
                    message += 'Invalid address. '
                }
            }
            if (params.type.toLowerCase() === 'eth') {
                if (!server.web3.utils.isAddress(params.address)) {
                    error = true
                    message += 'Invalid address. '
                }
            }
        }
    }

    if (error) {
        console.log('Error message:', message)
        res.render('index', { error: error, message: message })
    } else {
        QRCode.toDataURL(params.address, function (err, url) {
            request.findOne({ address: params.address, timestamp: params.timestamp }, (err, doc) => {
                if (err) res.render('index', { error: true, message: err.toString() })
                if (!doc) {
                    request.create({
                        type: params.type,
                        address: params.address,
                        token: params.token,
                        timestamp: params.timestamp,
                        callback: params.callback,
                        status: 'Pending'
                    }).then(() => {
                        console.log('Request inserted')
                    }).catch(error => res.render('index', { error: true, message: error.toString() }))
                } else {
                    console.log('Request already exists.')
                }
                res.render('index', { src: url, account: params.address })
            })
            // collection.findOne({ 'address': address, 'time_stamp': timestamp }, (err, item) => {
            //     if (!item) {
            //         collection.insertOne({ address: address, type: type, token: token, time_stamp: timestamp, call_back: callback, status: status })
            //     }
            // })
            // if (type === 'BTC') {
            //     routes.getBitcoinTransaction(address)
            // } if (type === 'ETH') {
            //     routes.getTransaction(address)

            // }
        })
    }

}

module.exports = pugPage