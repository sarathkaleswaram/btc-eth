const request = require('request')
var server = require('../server')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var ethTokenBalance = function (req, res) {
    try {
        logger.debug('ethTokenBalance params:', req.params)
        var web3 = server.web3
        var address = req.params.address
        var ercToken = req.params.ercToken
        var contractAddress

        if (!address) {
            logger.error('Address is empty')
            res.json({
                result: 'error',
                message: 'Address is empty',
            })
            return
        }
        if (!web3.utils.isAddress(address)) {
            logger.error('Invalid address')
            res.json({
                result: 'error',
                message: 'Invalid address',
            })
            return
        }
        if (!ercToken) {
            logger.error('Token is empty')
            res.json({
                result: 'error',
                message: 'Token is empty',
            })
            return
        }
        var index = server.ercTokens.findIndex(x => x.ercToken === ercToken.toLowerCase())
        if (index >= 0) {
            contractAddress = server.ercTokens[index].contractAddress
        }
        if (!contractAddress) {
            logger.error('Unknown ERC Token')
            res.json({
                result: 'error',
                message: 'Unknown ERC Token',
            })
            return
        }
        // Get ercToken balance
        request({
            url: `${server.etherscanAPI}&module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest`,
            json: true
        }, function (error, response, body) {
            if (error) {
                logger.error(error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
            }
            if (body.status === '0') {
                logger.debug(body.message)
                res.json({
                    result: 'error',
                    message: body.message,
                })
                return
            }
            if (body.status === '1') {
                var balance = web3.utils.fromWei(body.result, 'ether') + ' ' + server.ercTokens[index].ercToken.toUpperCase()
                logger.debug('ETH - ERC Token Balance:', balance)
                res.json({
                    result: 'success',
                    address: address,
                    balance: balance
                })
            }
        })
    } catch (error) {
        logger.error('ethTokenBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = ethTokenBalance