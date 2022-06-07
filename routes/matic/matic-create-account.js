var server = require('../../server')
const { logger } = require('../../utils/logger')

var maticCreate = function (req, res) {
    try {
        logger.debug('maticCreate')
        var polygonWeb3 = server.polygonWeb3
        var account = polygonWeb3.eth.accounts.create()
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

module.exports = maticCreate