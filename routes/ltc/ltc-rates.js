const request = require('request')
const { logger } = require('../../utils/logger')

var ltcExchangeRates = function (req, res) {
    try {
        logger.debug('ltcExchangeRates')

        request({
            url: 'https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=AUD,EUR,GBP,BGN,HRK,CZK,DKK,HUF,INR,LTL,PLN,RON,SEK,USD,CAD',
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
                logger.debug('Rates', body)
                res.json({
                    result: 'success',
                    data: body
                })
            } catch (error) {
                logger.error('ltcExchangeRates sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('ltcExchangeRates catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = ltcExchangeRates