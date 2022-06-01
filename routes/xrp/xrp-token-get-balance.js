const request = require('request')
const addressCodec = require('ripple-address-codec')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var xrpTokenBalance = function (req, res) {
    try {
        logger.debug('xrpTokenBalance params:', req.params)
        var address = req.params.address
        var xrpToken = req.params.xrpToken
        var issuerAddress, currency

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
        if (!xrpToken) {
            logger.error('Token is empty')
            res.json({
                result: 'error',
                message: 'Token is empty',
            })
            return
        }
        var index = server.xrpTokens.findIndex(x => x.name === xrpToken.toLowerCase())
        if (index >= 0) {
            xrpToken = xrpToken.toLowerCase()
            issuerAddress = server.xrpTokens[index].issuer
            currency = server.xrpTokens[index].currency
        }
        if (!issuerAddress || !currency) {
            logger.error('Unknown XRP Token')
            res.json({
                result: 'error',
                message: 'Unknown XRP Token',
            })
            return
        }

        var payload = {
            method: 'gateway_balances',
            params: [
                {
                    account: issuerAddress,
                    hotwallet: [address],
                    ledger_index: 'validated',
                    strict: true
                }
            ]
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
                    logger.debug('Token balance response:', JSON.stringify(body, null, 2))
                    if (!body.result.balances) {
                        logger.error('Selected token balance is not available on this address')
                        res.json({
                            result: 'error',
                            message: 'Selected token balance is not available on this address',
                        })
                        return
                    }
                    var balanceIndex = body.result.balances[address].findIndex(x => x.currency === currency)
                    if (balanceIndex < 0) {
                        logger.error('Token is not available on this address')
                        res.json({
                            result: 'error',
                            message: 'Token is not available on this address',
                        })
                        return
                    }
                    var balance = body.result.balances[address][balanceIndex].value + ' ' + xrpToken.toUpperCase()
                    logger.debug('XRP Token Balance:', balance)
                    res.json({
                        result: 'success',
                        address: address,
                        balance: balance
                    })
                }
            } catch (error) {
                logger.error('xrpTokenBalance sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('xrpTokenBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = xrpTokenBalance