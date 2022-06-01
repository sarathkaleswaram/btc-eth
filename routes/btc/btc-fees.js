const request = require('request')
const sb = require('satoshi-bitcoin')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var btcTxFees = function (req, res) {
    try {
        logger.debug('btcTxFees')
        request({
            url: `${server.btcAPI}`,
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
                console.log(server.btcAPI)
                console.dir(body, { depth: null })
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
                logger.error('btcTxFees sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('btcTxFees catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = btcTxFees