const bitcore = require('bitcore-lib')
const request = require('request')
const sb = require('satoshi-bitcoin')
var balances = require('../../models/balances')
var server = require('../../server')
const { logger } = require('../../utils/logger')
const { saveBalanceToDb } = require('../../utils/balance')

var btcBalance = function (req, res) {
    try {
        logger.debug('btcBalance params:', req.params)
        var address = req.params.address

        if (!address) {
            logger.error('Address is empty')
            res.json({
                result: 'error',
                message: 'Address is empty',
            })
            return
        }
        if (!bitcore.Address.isValid(address, server.network)) {
            logger.error('Invalid address')
            res.json({
                result: 'error',
                message: 'Invalid address',
            })
            return
        }
        request({
            url: `${server.btcAPI}/addrs/${address}/balance`,
            json: true
        }, function (error, response, body) {
            try {
                if (error) {
                    logger.error(error)
                    getBalanceFromDb(address, res, error)
                    return
                }
                if (body.error) {
                    logger.error(body.error)
                    getBalanceFromDb(address, res, body.error)
                    return
                }
                var balance = sb.toBitcoin(body.final_balance) + ' BTC'
                logger.debug(balance)
                res.json({
                    result: 'success',
                    address: address,
                    balance: balance
                })
                saveBalanceToDb('BTC', address, balance.split(' ')[0])
            } catch (error) {
                logger.error('btcBalance sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('btcBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

function getBalanceFromDb(address, res, error) {
    balances.findOne({ address: address }, (error, doc) => {
        if (error) {
            logger.error('DB Error:', error)
        } else {
            if (doc) {
                var balance = doc.balance + ' BTC'
                logger.debug('Got from db balance: ' + balance)
                res.json({
                    result: 'success',
                    address: address,
                    balance: balance
                })
            }
        }
    })
    res.json({
        result: 'error',
        message: error.toString(),
    })
    return
}

module.exports = btcBalance