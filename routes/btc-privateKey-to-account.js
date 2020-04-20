const bitcore = require('bitcore-lib')
var server = require('../server')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var btcPrivateKeyToAddress = function (req, res) {
    try {
        logger.debug('btcPrivateKeyToAddress body:', req.body)
        var pKey = req.body.privateKey

        if (!pKey) {
            logger.debug('PrivateKey is empty')
            res.json({
                result: 'error',
                message: 'PrivateKey is empty',
            })
            return
        }
        if (!bitcore.PrivateKey.isValid(pKey, server.network)) {
            logger.debug('Invalid PrivateKey')
            res.json({
                result: 'error',
                message: 'Invalid PrivateKey',
            })
            return
        }

        var privateKey = new bitcore.PrivateKey(pKey, server.network)
        var wif = privateKey.toWIF()
        var address = privateKey.toAddress()

        logger.debug({ address: address.toString(), privateKey: privateKey.toString() })

        res.json({
            result: 'success',
            address: address.toString(),
            privateKey: privateKey.toString()
        })
    } catch (error) {
        logger.error('btcPrivateKeyToAddress catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
    }
}

module.exports = btcPrivateKeyToAddress