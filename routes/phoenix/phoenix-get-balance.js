var server = require('../../server')
const { logger } = require('../../utils/logger')

var phoenixBalance = function (req, res) {
    try {
        logger.debug('phoenixBalance params:', req.params)
        var phoenixWeb3 = server.phoenixWeb3
        var address = req.params.address

        if (!address) {
            logger.error('Address is empty')
            res.json({
                result: 'error',
                message: 'Address is empty',
            })
            return
        }
        if (!phoenixWeb3.utils.isAddress(address)) {
            logger.error('Invalid address')
            res.json({
                result: 'error',
                message: 'Invalid address',
            })
            return
        }

        phoenixWeb3.eth.getBalance(address, (error, result) => {
            if (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error,
                })
                return
            }
            var balance = phoenixWeb3.utils.fromWei(result ? result.toString() : '', 'ether') + ' PHOENIX'
            //logger.debug(balance)
            res.json({
                result: 'success',
                address: address,
                balance: balance
            })
        })
    } catch (error) {
        logger.error('phoenixBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = phoenixBalance