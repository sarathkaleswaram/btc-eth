const bitcore = require('bitcore-lib')
const request = require('request')
const sb = require('satoshi-bitcoin')
var server = require('../server')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var btcBalance = function (req, res) {
    try {
        logger.debug('\nbtcBalance params:', req.params)
        var address = req.params.address
        var chain = server.network === 'testnet' ? 'test3' : 'main'

        if (!address) {
            logger.debug('Address is empty')
            res.json({
                result: 'error',
                message: 'Address is empty',
            })
            return
        }
        if (!bitcore.Address.isValid(address, server.network)) {
            logger.debug('Invalid address')
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
            if (error) {
                logger.error(error)
                res.json({
                    result: 'error',
                    message: error,
                })
                return
            }
            if (body.error) {
                logger.debug(body.error)
                res.json({
                    result: 'error',
                    message: body.error,
                })
                return
            }
            var balance = sb.toBitcoin(body.final_balance) + ' BTC'
            logger.debug(balance)
            res.json({
                result: 'success',
                address: address,
                balance: balance
            })
        })
    } catch (error) {
        logger.error('btcBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
    }
}

module.exports = btcBalance