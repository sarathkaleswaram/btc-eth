const keypairs = require('ripple-keypairs')
const { logger } = require('../../utils/logger')

var xrpCreate = function (req, res) {
    try {
        logger.debug('xrpCreate')
        const seed = keypairs.generateSeed()
        const keypair = keypairs.deriveKeypair(seed)
        const address = keypairs.deriveAddress(keypair.publicKey)
        logger.debug('Address', { address: address, privateKey: seed })

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