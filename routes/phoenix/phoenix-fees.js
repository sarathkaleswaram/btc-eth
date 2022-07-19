const request = require('request')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var phoenixTxFees = function (req, res) {
    try {
        logger.debug('phoenixTxFees')
        var phoenixWeb3 = server.phoenixWeb3

        request({
            url: `${server.phoenixExplorerUrl}/api&module=gastracker&action=gasoracle`,
            json: true
        }, function (error, response, body) {
            try {
                if (error || body.error) {
                    logger.error(body.error || error)
                    res.json({
                        result: 'error',
                        message: body.error || error.toString(),
                    })
                    return
                }
                var fees = {
                    low: phoenixWeb3.utils.fromWei(body.result.SafeGasPrice.split('.')[0], 'gwei'),
                    medium: phoenixWeb3.utils.fromWei(body.result.ProposeGasPrice.split('.')[0], 'gwei'),
                    high: phoenixWeb3.utils.fromWei(body.result.FastGasPrice.split('.')[0], 'gwei'),
                }
                logger.debug('Fees', fees)
                res.json({
                    result: 'success',
                    fees
                })
            } catch (error) {
                logger.error('phoenixTxFees sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('phoenixTxFees catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = phoenixTxFees