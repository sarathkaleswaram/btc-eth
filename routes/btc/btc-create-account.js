const bitcore = require('bitcore-lib')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var btcCreate = function (req, res) {
    try {
        logger.debug('btcCreate')
        var privateKey = new bitcore.PrivateKey(server.network)
        // var wif = privateKey.toWIF()
        var address = privateKey.toAddress()
        logger.debug({ address: address.toString() })

        res.json({
            result: 'success',
            address: address.toString(),
            privateKey: privateKey.toString()
        })
    } catch (error) {
        logger.error('btcCreate catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = btcCreate