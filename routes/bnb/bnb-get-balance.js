var server = require('../../server')
const { logger } = require('../../utils/logger')

var bnbBalance = function (req, res) {
    try {
        logger.debug('bnbBalance params:', req.params)
        var bscWeb3 = server.bscWeb3
        var address = req.params.address

        if (!address) {
            logger.error('Address is empty')
            res.json({
                result: 'error',
                message: 'Address is empty',
            })
            return
        }
        if (!bscWeb3.utils.isAddress(address)) {
            logger.error('Invalid address')
            res.json({
                result: 'error',
                message: 'Invalid address',
            })
            return
        }

        bscWeb3.eth.getBalance(address, (error, result) => {
            if (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error,
                })
                return
            }
            var balance = bscWeb3.utils.fromWei(result ? result.toString() : '', 'ether') + ' BNB'
            //logger.debug(balance)
            res.json({
                result: 'success',
                address: address,
                balance: balance
            })
        })
    } catch (error) {
        logger.error('bnbBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = bnbBalance