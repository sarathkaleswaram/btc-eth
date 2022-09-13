
const { logger } = require('../../utils/logger')
var requests = require('../../models/requests')
var transactions = require('../../models/transactions')

var commonTxStatus = function (req, res) {
    try {
        logger.debug('commonTxStatus')
        var address = req.params.address

        requests.findOne({ address: address }, (error, doc) => {
            if (error) {
                logger.error('DB Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
            }
            if (!doc) {
                logger.warn('Address not found')
                res.json({
                    result: 'error',
                    message: 'Address not found',
                })
                return
            }
            var payload = {
                type: doc.type,
                token: doc.token,
                timestamp: doc.timestamp,
                receiver: doc.address,
                sender: undefined,
                amount: undefined,
                tid: undefined,
                status: undefined,
                timeout: 1 // 1 = session expired as per game
            }
            if (doc.status === 'Timeout') {
                res.json({
                    result: 'success',
                    ...payload
                })
                return
            } else {
                transactions.findOne({ address: address }, (error, doc) => {
                    if (error) {
                        logger.error('DB Error: ' + error)
                        res.json({
                            result: 'error',
                            message: error.toString(),
                        })
                        return
                    }
                    if (!doc) {
                        payload.status = 0 // 0 = tx submitted as per game
                        payload.timeout = 0 // 0 = session not expired as per game
                        res.json({
                            result: 'success',
                            ...payload
                        })
                        return
                    }
                    payload.sender = doc.from
                    payload.amount = doc.amount
                    payload.tid = doc.transactionHash
                    payload.status = 1 // 1 = tx confirmed as per game
                    payload.timeout = 0 // 0 = session not expired as per game
                    res.json({
                        result: 'success',
                        ...payload
                    })
                })
            }
        })
    } catch (error) {
        logger.error('btcCreate catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = commonTxStatus