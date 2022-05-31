const keypairs = require('ripple-keypairs')
const { logger } = require('../../utils/logger')

var xrpPrivateKeyToAddress = function (req, res) {
    try {
        //logger.debug('xrpPrivateKeyToAddress body:', req.body)
        var seed = req.body.privateKey

        if (!seed) {
            logger.error('PrivateKey is empty')
            res.json({
                result: 'error',
                message: 'PrivateKey is empty',
            })
            return
        }

        const keypair = keypairs.deriveKeypair(seed)
        const address = keypairs.deriveAddress(keypair.publicKey)

        logger.debug({ address: address })

        res.json({
            result: 'success',
            address: address,
            privateKey: seed
        })
    } catch (error) {
        logger.error('xrpPrivateKeyToAddress catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = xrpPrivateKeyToAddress