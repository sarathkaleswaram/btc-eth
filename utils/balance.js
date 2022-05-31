
var balances = require('../models/balances')
const { logger } = require('../utils/logger')

function saveBalanceToDb(currency, address, balance, platform, contractAddress) {
    balances.findOne({ address: address }, (error, doc) => {
        if (error) {
            logger.error('DB Error:', error)
        } else {
            if (doc) {
                balances.findOneAndUpdate(
                    { address: address },
                    { balance: balance, updatedDate: new Date() })
                    .then(() => {
                        logger.verbose('DB Balances updated')
                    }, error => {
                        logger.error(error)
                    })
            } else {
                balances.create({
                    currency: currency,
                    address: address,
                    platform: platform,
                    contractAddress: contractAddress,
                    balance: balance,
                    updatedDate: new Date()
                }).then(() => {
                    logger.verbose('DB Balances inserted')
                }, error => {
                    logger.error(error)
                })
            }
        }
    })
}

exports.saveBalanceToDb = saveBalanceToDb