const request = require('request')
const { logger } = require('../../utils/logger')

var maticExchangeRates = function (req, res) {
    try {
        logger.debug('maticExchangeRates')

        request({
            url: 'https://min-api.cryptocompare.com/data/price?fsym=MATIC&tsyms=AUD,EUR,GBP,BGN,HRK,CZK,DKK,HUF,INR,LTL,PLN,RON,SEK,USD,CAD',
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
                logger.error('maticExchangeRates sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('maticExchangeRates catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = maticExchangeRates