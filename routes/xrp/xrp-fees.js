const request = require('request')
const sb = require('satoshi-bitcoin')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var xrpTxFees = function (req, res) {
    try {
        logger.debug('xrpTxFees')

        var payload = {
            method: 'server_info',
        }
        request({
            url: `${server.rippleRpcUrl}`,
            method: 'POST',
            json: true,
            body: payload
        }, function (error, response, body) {
            try {
                if (error) {
                    logger.error('Error: ' + error)
                    res.json({
                        result: 'error',
                        message: error.toString(),
                    })
                    return
                } else {
                    if (body.error) {
                        logger.error(body.error)
                        res.json({
                            result: 'error',
                            message: body.error,
                        })
                        return
                    }
                    if (body.result.status !== 'success') {
                        logger.error(body.result)
                        res.json({
                            result: 'error',
                            message: body.result.error_message || body.result,
                        })
                        return
                    }
                    var fees = {
                        low: body.result.info.validated_ledger.base_fee_xrp.toString(),
                        medium: body.result.info.validated_ledger.base_fee_xrp.toString(),
                        high: body.result.info.validated_ledger.base_fee_xrp.toString(),
                    }
                    logger.debug('Fees', fees)
                    res.json({
                        result: 'success',
                        fees
                    })
                }
            } catch (error) {
                logger.error('xrpTxFees sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('xrpTxFees catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = xrpTxFees