var server = require('../../server')
const { logger } = require('../../utils/logger')

var maticPrivateKeyToAddress = function (req, res) {
    try {
        //logger.debug('maticPrivateKeyToAddress body:', req.body)
        var polygonWeb3 = server.polygonWeb3
        var privateKey = req.body.privateKey
        var account

        if (!privateKey) {
            logger.error('PrivateKey is empty')
            res.json({
                result: 'error',
                message: 'PrivateKey is empty',
            })
            return
        }
        try {
            account = polygonWeb3.eth.accounts.privateKeyToAccount(privateKey)
        } catch (error) {
            logger.error('Invalid PrivateKey')
            res.json({
                result: 'error',
                message: 'Invalid PrivateKey',
            })
            return
        }

        res.json({
            result: 'success',
            address: account.address,
            privateKey: account.privateKey
        })
    } catch (error) {
        logger.error('maticPrivateKeyToAddress catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = maticPrivateKeyToAddress