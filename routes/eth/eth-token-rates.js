const request = require('request')
const { logger } = require('../../utils/logger')

var ethTokenExchangeRates = function (req, res) {
    try {
        logger.debug('ethTokenExchangeRates: ', req.params)

        var ercTokenId = getTokenId(req.params.ercToken.toLowerCase())

        if (ercTokenId === 'unknown') {
            logger.error('Unknown ERC Token')
            res.json({
                result: 'error',
                message: 'Unknown ERC Token',
            })
            return
        }

        request({
            url: `https://api.coingecko.com/api/v3/simple/price?ids=${ercTokenId}&vs_currencies=AUD,EUR,GBP,BGN,HRK,CZK,DKK,HUF,INR,LTL,PLN,RON,SEK,USD,CAD`,
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
                if (!body[ercTokenId]) {
                    logger.error('Empty body responded.')
                    res.json({
                        result: 'error',
                        message: 'Empty body responded.',
                    })
                    return
                }
                logger.debug('Rates', body)
                let data = {
                    'AUD': body[ercTokenId].aud,
                    'EUR': body[ercTokenId].eur,
                    'GBP': body[ercTokenId].gbp,
                    'BGN': body[ercTokenId].bgn,
                    'HRK': body[ercTokenId].hrk,
                    'CZK': body[ercTokenId].czk,
                    'DKK': body[ercTokenId].dkk,
                    'HUF': body[ercTokenId].huf,
                    'INR': body[ercTokenId].inr,
                    'LTL': body[ercTokenId].ltl,
                    'PLN': body[ercTokenId].pln,
                    'RON': body[ercTokenId].ron,
                    'SEK': body[ercTokenId].sek,
                    'USD': body[ercTokenId].usd,
                    'CAD': body[ercTokenId].cad
                }
                res.json({
                    result: 'success',
                    data: data
                })
            } catch (error) {
                logger.error('ethTokenExchangeRates sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('ethTokenExchangeRates catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

function getTokenId(ercToken) {
    switch (ercToken) {
        case 'btc':
            return 'bitcoin'
        case 'eth':
            return 'ethereum'
        case 'jan':
            return 'coinjanitor'
        case 'grt':
            return 'golden-ratio-token'
        case 'satx':
            return 'satoexchange-token'
        case 'usdt':
            return 'tether'
        case 'shib':
            return 'shiba-inu'
        case 'matic':
            return 'matic-network'
        case 'dai':
            return 'dai'
        case 'sand':
            return 'the-sandbox'
        case 'link':
            return 'chainlink'
        case 'mkr':
            return 'maker'

        case 'shar':
            return 'kaleswaram-token'
        default:
            return 'unknown'
    }
}

module.exports = ethTokenExchangeRates