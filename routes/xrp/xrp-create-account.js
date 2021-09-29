const keypairs = require('ripple-keypairs')

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var xrpCreate = function (req, res) {
    try {
        logger.debug('xrpCreate')
        const seed = keypairs.generateSeed()
        const keypair = keypairs.deriveKeypair(seed)
        const address = keypairs.deriveAddress(keypair.publicKey)
        logger.debug({ address: address, privateKey: seed })

        res.json({
            result: 'success',
            address: address,
            privateKey: seed
        })
    } catch (error) {
        logger.error('xrpCreate catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = xrpCreate