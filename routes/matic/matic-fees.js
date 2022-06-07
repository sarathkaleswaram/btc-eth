const request = require('request')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var maticTxFees = function (req, res) {
    try {
        logger.debug('maticTxFees')
        var polygonWeb3 = server.polygonWeb3

        request({
            url: `${server.polygonscanAPI.replace('-testnet', '')}&module=gastracker&action=gasoracle`,
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
                    low: polygonWeb3.utils.fromWei(body.result.SafeGasPrice.split('.')[0], 'gwei'),
                    medium: polygonWeb3.utils.fromWei(body.result.ProposeGasPrice.split('.')[0], 'gwei'),
                    high: polygonWeb3.utils.fromWei(body.result.FastGasPrice.split('.')[0], 'gwei'),
                }
                logger.debug('Fees', fees)
                res.json({
                    result: 'success',
                    fees
                })
            } catch (error) {
                logger.error('maticTxFees sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('maticTxFees catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = maticTxFees