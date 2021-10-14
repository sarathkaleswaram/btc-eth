var server = require('../../server')

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var bnbCreate = function (req, res) {
    try {
        logger.debug('bnbCreate')
        var bscWeb3 = server.bscWeb3
        var account = bscWeb3.eth.accounts.create()
        logger.debug({ address: account.address, privateKey: account.privateKey })
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