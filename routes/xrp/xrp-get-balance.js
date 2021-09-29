const request = require('request')
const addressCodec = require('ripple-address-codec')
var server = require('../../server')

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var xrpBalance = function (req, res) {
    try {
        logger.debug('xrpBalance params:', req.params)
        var address = req.params.address

        if (!address) {
            logger.error('Address is empty')
            res.json({
                result: 'error',
                message: 'Address is empty',
            })
            return
        }
        if (!addressCodec.isValidClassicAddress(address)) {
            logger.error('Invalid address')
            res.json({
                result: 'error',
                message: 'Invalid address',
            })
            return
        }

        var payload = {
            method: 'account_info',
            params: [
                {
                    account: address,
                    strict: true,
                    ledger_index: 'current',
                    queue: true
                }
            ]
        }
        request({
            url: `${server.rippleRpcUrl}`,
            method: 'POST',
            json: true,
            // headers: { 'Content-type': 'application/json' },
            body: payload
        }, function (error, response, body) {
            if (error) {
                logger.error(error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
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
                var balance = server.rippleApi.dropsToXrp(body.result.account_data.Balance) + ' XRP'
                logger.debug(balance)
                res.json({
                    result: 'success',
                    address: address,
                    balance: balance
                })
            }
        })
    } catch (error) {
        logger.error('xrpBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = xrpBalance