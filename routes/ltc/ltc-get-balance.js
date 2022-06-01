const litecore = require('bitcore-lib-ltc')
const bitcore = require('bitcore-lib')
const request = require('request')
const sb = require('satoshi-bitcoin')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var ltcBalance = function (req, res) {
    try {
        logger.debug('ltcBalance params:', req.params)
        var address = req.params.address

        if (!address) {
            logger.error('Address is empty')
            res.json({
                result: 'error',
                message: 'Address is empty',
            })
            return
        }

        let isInvalid = server.isMainnet ? !litecore.Address.isValid(address) : !bitcore.Address.isValid(address, server.network)

        if (isInvalid) {
            logger.error('Invalid address')
            res.json({
                result: 'error',
                message: 'Invalid address',
            })
            return
        }

        let reqData = {}
        if (server.isMainnet) {
            reqData = {
                url: `${server.ltcAPI}/addrs/${address}/balance`,
                json: true
            }
        } else {
            reqData = {
                url: `${server.ltcTestAPI}/addresses/${address}`,
                headers: {
                    'X-API-Key': server.ltcTestApiKey,
                    'Content-Type': 'application/json'
                },
                json: true
            }
        }
        request(reqData, function (error, response, body) {
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

                var balance = '0 LTC'

                if (server.isMainnet) {
                    balance = sb.toBitcoin(body.final_balance) + ' LTC'
                } else {
                    if (body && body.data && body.data.item && body.data.item.confirmedBalance && body.data.item.confirmedBalance.amount)
                        balance = body.data.item.confirmedBalance.amount + ' LTC'
                }

                logger.debug(balance)
                res.json({
                    result: 'success',
                    address: address,
                    balance: balance
                })
            } catch (error) {
                logger.error('ltcBalance sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('ltcBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = ltcBalance