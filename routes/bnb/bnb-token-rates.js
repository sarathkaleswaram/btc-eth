const request = require('request')

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var bnbTokenExchangeRates = function (req, res) {
    try {
        logger.debug('bnbTokenExchangeRates: ', req.params)

        var bepTokenId = getTokenId(req.params.bepToken.toLowerCase())

        if (bepTokenId === 'unknown') {
            logger.error('Unknown BEP Token')
            res.json({
                result: 'error',
                message: 'Unknown BEP Token',
            })
            return
        }

        request({
            url: `https://api.coingecko.com/api/v3/simple/price?ids=${bepTokenId}&vs_currencies=AUD,EUR,GBP,BGN,HRK,CZK,DKK,HUF,INR,LTL,PLN,RON,SEK,USD,CAD`,
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
                if (!body[bepTokenId]) {
                    logger.error('Empty body responded.')
                    res.json({
                        result: 'error',
                        message: 'Empty body responded.',
                    })
                    return
                }
                logger.debug(body)
                let data = {
                    'AUD': body[bepTokenId].aud,
                    'EUR': body[bepTokenId].eur,
                    'GBP': body[bepTokenId].gbp,
                    'BGN': body[bepTokenId].bgn,
                    'HRK': body[bepTokenId].hrk,
                    'CZK': body[bepTokenId].czk,
                    'DKK': body[bepTokenId].dkk,
                    'HUF': body[bepTokenId].huf,
                    'INR': body[bepTokenId].inr,
                    'LTL': body[bepTokenId].ltl,
                    'PLN': body[bepTokenId].pln,
                    'RON': body[bepTokenId].ron,
                    'SEK': body[bepTokenId].sek,
                    'USD': body[bepTokenId].usd,
                    'CAD': body[bepTokenId].cad
                }
                res.json({
                    result: 'success',
                    data: data
                })
            } catch (error) {
                logger.error('bnbTokenExchangeRates sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('bnbTokenExchangeRates catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

function getTokenId(bepToken) {
    switch (bepToken) {
        case 'busd':
            return 'binance-usd'
        case 'ada':
            return 'binance-peg-cardano'
        case 'doge':
            return 'binance-peg-dogecoin'
        case 'zinr':
            return 'zinr'
        case 'shar':
            return 'shar token'
        default:
            return 'unknown'
    }
}

module.exports = bnbTokenExchangeRates