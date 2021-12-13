const request = require('request')

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var bnbExchangeRates = function (req, res) {
    try {
        logger.debug('bnbExchangeRates')

        request({
            url: 'https://min-api.cryptocompare.com/data/price?fsym=BNB&tsyms=AUD,EUR,GBP,BGN,HRK,CZK,DKK,HUF,INR,LTL,PLN,RON,SEK,USD,CAD',
            json: true
        }, function (error, response, body) {
            try {
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
            } catch (error) {
                logger.error('bnbExchangeRates sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('bnbExchangeRates catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = bnbExchangeRates