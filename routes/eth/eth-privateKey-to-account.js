var server = require('../../server')

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var ethPrivateKeyToAddress = function (req, res) {
    try {
        //logger.debug('ethPrivateKeyToAddress body:', req.body)
        var web3 = server.web3
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
            account = web3.eth.accounts.privateKeyToAccount(privateKey)
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
        logger.error('ethPrivateKeyToAddress catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = ethPrivateKeyToAddress