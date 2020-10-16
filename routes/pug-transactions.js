var transactions = require('../models/transactions')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var pugTransactions = function (req, res) {
    logger.debug('pugTransactions')

    transactions.find({}).sort({ timeStamp: -1 }).then((transactions) => {
        logger.debug('Transactions length:', transactions.length)
        res.render('transactions', { transactions: transactions, moment: require('moment') })
    }, error => {
        logger.error(error)
        res.render('transactions', { error: true, message: error.toString() })
    })

}

module.exports = pugTransactions