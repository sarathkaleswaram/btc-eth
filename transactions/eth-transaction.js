const request = require('request')
var requests = require('../models/requests')
var transactions = require('../models/transactions')
var server = require('../server')
var { checkTxAndSave, wsSend } = require('./callback')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'trace'

var dbPendingEthTx = function (address, blocknumber) {
    var web3 = server.web3
    var url = `${server.etherscanAPI}&module=account&action=txlist&address=${address}&startblock=${blocknumber}&sort=asc`
    logger.debug('Running Etherscan API: ', url)
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (error) logger.error(error)
        if (body.status === '0') logger.error(body.message)
        if (body.status === '1') {
            logger.debug('Txs length:', body.result.length)
            body.result.forEach(tx => {
                if (tx.to === address.toLowerCase()) {
                    logger.debug('Got tx from: ', tx.from, ', amount: ', tx.value, ', hash:', tx.hash)
                    // check transaction hash with db before making callback and save
                    checkTxAndSave('eth', tx.to, tx.from, web3.utils.fromWei(tx.value, 'ether'), new Date(tx.timeStamp * 1000), tx.hash, tx.blockHash, tx.blockNumber, web3.utils.fromWei(tx.gas.toString(), 'ether'))
                }
            })
        }
    })
    // var web3 = server.web3
    // web3.eth.getBlockNumber().then(async (end) => {
    //     logger.debug('Get blocks from:', start, '-', end)
    //     for (let i = start; i < end; i++) {
    //         let block = await web3.eth.getBlock(i)
    //         logger.debug(`[*] Searching block ${i}`)
    //         if (block && block.transactions) {
    //             logger.debug(`Checking ${block.transactions.length} transactions of block ${i}`)
    //             for (let txhash of block.transactions) {
    //                 let transaction = await web3.eth.getTransaction(txhash)
    //                 if (address === transaction.to.toLowerCase()) {
    //                     logger.debug(`[+] Transaction found on block ${lastBlockNumber}`)
    //                     logger.debug(transaction)
    //                     logger.debug({ address: transaction.from, value: web3.utils.fromWei(transaction.value, 'ether'), timestamp: new Date() })
    //                 }
    //             }
    //         }
    //     }
    // })
}

var subscribeEthPendingTx = function () {
    const subscription = server.web3ws.eth.subscribe('pendingTransactions', (err, res) => {
        if (err) logger.error(err)
    })
    logger.debug('Subscribed to ETH live pending transactions...')
    subscription.on('data', async (txHash) => {
        if (server.ethAccounts.length) {
            logger.trace('ETH getting all pending tx:', txHash, ', Checking with Accounts length:', server.ethAccounts.length, ', Accounts:', server.ethAccounts)
            try {
                let tx = await server.web3.eth.getTransaction(txHash)
                if (tx.to) {
                    if (server.ethAccounts.includes(tx.to)) {
                        logger.debug('Got ETH tx from: ', tx.from, ', amount: ', tx.value, ', hash:', tx.hash)
                        server.ethTxHashes.push(tx.hash)
                        wsSend(tx.to, 'eth', 'submitted', server.web3.utils.fromWei(tx.value, 'ether'), tx.hash)
                    }
                }
            } catch (err) {
                logger.error(err)
            }
        }
    })
}

var getEthTxByHashes = function () {
    logger.debug('ETH pending hashes length:', server.ethTxHashes.length)
    var web3 = server.web3
    server.ethTxHashes.forEach(async txHash => {
        logger.debug('Getting ETH transaction for hash:', txHash)
        var tx = await web3.eth.getTransaction(txHash)
        logger.debug('ETH pending hash blocknumber:', tx.blockNumber, ', blockHash:', tx.blockHash)
        if (tx.blockNumber !== null) {
            logger.debug('ETH confirmed tx:', tx)
            // remove hash from array
            server.ethTxHashes.splice(server.ethTxHashes.findIndex(x => x === txHash), 1)
            // get block
            var block = await web3.eth.getBlock(tx.blockNumber)
            // check transaction hash with db before making callback and save
            checkTxAndSave('eth', tx.to, tx.from, web3.utils.fromWei(tx.value, 'ether'), new Date(block.timestamp * 1000), tx.hash, tx.blockHash, tx.blockNumber, web3.utils.fromWei(tx.gas.toString(), 'ether'))
        }
    })
}

exports.dbPendingEthTx = dbPendingEthTx
exports.subscribeEthPendingTx = subscribeEthPendingTx
exports.getEthTxByHashes = getEthTxByHashes