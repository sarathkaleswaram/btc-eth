var server = require('../../server')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var ethCreate = function (req, res) {
    try {
        logger.debug('ethCreate')
        var web3 = server.web3
        var account = web3.eth.accounts.create()
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

module.exports = ethCreate