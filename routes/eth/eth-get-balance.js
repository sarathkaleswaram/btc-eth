var server = require('../../server')
const { logger } = require('../../utils/logger')

var ethBalance = function (req, res) {
    try {
        logger.debug('ethBalance params:', req.params)
        var web3 = server.web3
        var address = req.params.address

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

        web3.eth.getBalance(address, (error, result) => {
            if (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error,
                })
                return
            }
            var balance = web3.utils.fromWei(result ? result.toString() : '', 'ether') + ' ETH'
            logger.debug(balance)
            res.json({
                result: 'success',
                address: address,
                balance: balance
            })
        })
    } catch (error) {
        logger.error('ethBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = ethBalance