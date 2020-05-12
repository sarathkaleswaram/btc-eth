const request = require('request')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var ethExchangeRates = function (req, res) {
    try {
        logger.debug('ethExchangeRates')

        request({
            url: 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=AUD,EUR,GBP,BGN,HRK,CZK,DKK,HUF,INR,LTL,PLN,RON,SEK,USD',
            json: true
        }, function (error, response, body) {
            if (error) {
                logger.error(error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
            }
            if (body.Message) {
                logger.error(body.Message)
                res.json({
                    result: 'error',
                    message: body.Message,
                })
                return
            }
            logger.debug(body)
            res.json({
                result: 'success',
                data: body
            })
        })
    } catch (error) {
        logger.error('ethExchangeRates catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = ethExchangeRates