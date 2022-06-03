const request = require('request')
const sb = require('satoshi-bitcoin')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var ltcTxFees = function (req, res) {
    try {
        logger.debug('ltcTxFees')
        request({
            url: `${server.ltcAPI}`,
            json: true
        }, function (error, response, body) {
            try {
                if (error) {
                    logger.error('Error: ' + error)
                    res.json({
                        result: 'error',
                        message: error.toString(),
                    })
                    return
                }
                if (body.error) {
                    logger.error(body.error)
                    res.json({
                        result: 'error',
                        message: body.error,
                    })
                    return
                }
                var fees = {
                    low: sb.toBitcoin(body.low_fee_per_kb).toString(),
                    medium: sb.toBitcoin(body.medium_fee_per_kb).toString(),
                    high: sb.toBitcoin(body.high_fee_per_kb).toString(),
                }
                logger.debug('Fees', fees)
                res.json({
                    result: 'success',
                    fees
                })
            } catch (error) {
                logger.error('ltcTxFees sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('ltcTxFees catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = ltcTxFees