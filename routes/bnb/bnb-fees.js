const request = require('request')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var bnbTxFees = function (req, res) {
    try {
        logger.debug('bnbTxFees')
        var bscWeb3 = server.bscWeb3

        request({
            url: `${server.bscscanAPI.replace('-testnet', '')}&module=gastracker&action=gasoracle`,
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
                    low: bscWeb3.utils.fromWei(body.result.SafeGasPrice, 'gwei'),
                    medium: bscWeb3.utils.fromWei(body.result.ProposeGasPrice, 'gwei'),
                    high: bscWeb3.utils.fromWei(body.result.FastGasPrice, 'gwei'),
                }
                logger.debug('Fees', fees)
                res.json({
                    result: 'success',
                    fees
                })
            } catch (error) {
                logger.error('bnbTxFees sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('bnbTxFees catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = bnbTxFees