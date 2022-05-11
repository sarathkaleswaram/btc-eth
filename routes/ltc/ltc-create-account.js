const litecore = require('bitcore-lib-ltc')
const bitcore = require('bitcore-lib')
var server = require('../../server')

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var ltcCreate = function (req, res) {
    try {
        logger.debug('ltcCreate')

        var privateKey = ''
        var address = ''

        if (server.isMainnet) {
            privateKey = new litecore.PrivateKey()
            address = privateKey.toAddress()
        } else {
            privateKey = new bitcore.PrivateKey(server.network)
            address = privateKey.toAddress()
        }
        logger.debug({ address: address.toString() })

        res.json({
            result: 'success',
            address: address.toString(),
            privateKey: privateKey.toString()
        })
    } catch (error) {
        logger.error('ltcCreate catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = ltcCreate