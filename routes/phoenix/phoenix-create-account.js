var server = require('../../server')
const { logger } = require('../../utils/logger')

var phoenixCreate = function (req, res) {
    try {
        logger.debug('phoenixCreate')
        var phoenixWeb3 = server.phoenixWeb3
        var account = phoenixWeb3.eth.accounts.create()
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

module.exports = phoenixCreate