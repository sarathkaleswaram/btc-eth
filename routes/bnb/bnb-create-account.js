var server = require('../../server')
const { logger } = require('../../utils/logger')

var bnbCreate = function (req, res) {
    try {
        logger.debug('bnbCreate')
        var bscWeb3 = server.bscWeb3
        var account = bscWeb3.eth.accounts.create()
        logger.debug('Address', { address: account.address })
        res.json({
            result: 'success',
            address: account.address,
            privateKey: account.privateKey
        })
    } catch (error) {
        logger.error('btcCreate catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = bnbCreate