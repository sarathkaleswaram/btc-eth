var server = require('../../server')
const { logger } = require('../../utils/logger')

var maticBalance = function (req, res) {
    try {
        logger.debug('maticBalance params:', req.params)
        var polygonWeb3 = server.polygonWeb3
        var address = req.params.address

        if (!address) {
            logger.error('Address is empty')
            res.json({
                result: 'error',
                message: 'Address is empty',
            })
            return
        }
        if (!polygonWeb3.utils.isAddress(address)) {
            logger.error('Invalid address')
            res.json({
                result: 'error',
                message: 'Invalid address',
            })
            return
        }

        polygonWeb3.eth.getBalance(address, (error, result) => {
            if (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error,
                })
                return
            }
            var balance = polygonWeb3.utils.fromWei(result ? result.toString() : '', 'ether') + ' MATIC'
            //logger.debug(balance)
            res.json({
                result: 'success',
                address: address,
                balance: balance
            })
        })
    } catch (error) {
        logger.error('maticBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = maticBalance