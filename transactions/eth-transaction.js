const request = require('request')
var transactions = require('../models/transactions')
var server = require('../server')
var { checkTxAndCallback } = require('./callback')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'trace'

var dbPendingEthTx = function (address, blocknumber) {
    var web3 = server.web3
    var url = `${server.etherscanAPI}&module=account&action=txlist&address=${address}&startblock=${blocknumber}&sort=asc`
    logger.trace('Running Etherscan API:', url)
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (error) {
            logger.error(error)
            return
        }
        if (body.status === '0') logger.error(body.message)
        if (body.status === '1') {
            logger.debug('Txs ETH length:', body.result.length, ', for address:', address)
            body.result.forEach(tx => {
                if (tx.to === address.toLowerCase()) {
                    logger.info('Got ETH tx from:', tx.from, ', amount:', tx.value, ', hash:', tx.hash)
                    // calculate transaction fees = gas used * gas price
                    var gasUsed = parseInt(tx.gasUsed), gasPrice = parseInt(tx.gasPrice)
                    var fees = gasUsed * gasPrice
                    // check transaction hash with db before making callback and save
                    checkTxAndCallback('eth', address, tx.from, web3.utils.fromWei(tx.value.toString(), 'ether'), new Date(tx.timeStamp * 1000), tx.hash, tx.blockHash, tx.blockNumber, web3.utils.fromWei(fees.toString(), 'ether'))
                }
            })
        }
    })
}

var dbPendingEthTokenTx = function (address, blocknumber, contractAddress) {
    var web3 = server.web3
    var url = `${server.etherscanAPI}&module=account&action=tokentx&address=${address}&startblock=${blocknumber}&sort=asc`
    logger.trace('Running Etherscan API: ', url)
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (error) {
            logger.error(error)
            return
        }
        if (body.status === '0') logger.error(body.message)
        if (body.status === '1') {
            logger.debug('Txs ERC length:', body.result.length, ' for address:', address)
            body.result.forEach(tx => {
                if (tx.contractAddress === contractAddress.toLowerCase()) {
                    if (tx.to.toLowerCase() === address.toLowerCase()) {
                        logger.info('Got ERC token tx type:', tx.tokenSymbol.toLowerCase(), ', from:', tx.from, ', amount:', tx.value, ', hash:', tx.hash)
                        // calculate amount for custome token decimals
                        var value = parseInt(tx.value), decimals = parseInt(tx.tokenDecimal)
                        var amount = value / 10 ** decimals
                        // calculate transaction fees = gas used * gas price
                        var gasUsed = parseInt(tx.gasUsed), gasPrice = parseInt(tx.gasPrice)
                        var fees = gasUsed * gasPrice
                        // check transaction hash with db before making callback and save
                        checkTxAndCallback(tx.tokenSymbol.toLowerCase(), address, tx.from, amount, new Date(tx.timeStamp * 1000), tx.hash, tx.blockHash, tx.blockNumber, web3.utils.fromWei(fees.toString(), 'ether'))
                    }
                }
            })
        }
    })
}

exports.dbPendingEthTx = dbPendingEthTx
exports.dbPendingEthTokenTx = dbPendingEthTokenTx