const bitcore = require('bitcore-lib')
var server = require('../server')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var btcCreate = function (req, res) {
    try {
        logger.debug('\nbtcCreate')
        var privateKey = new bitcore.PrivateKey(server.network)
        // var wif = privateKey.toWIF()
        var address = privateKey.toAddress()
        logger.debug({ address: address.toString(), privateKey: privateKey.toString() })

        res.json({
            result: 'success',
            address: address.toString(),
            privateKey: privateKey.toString()
        })
    } catch (error) {
        logger.error('btcCreate catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
    }
}

module.exports = btcCreate