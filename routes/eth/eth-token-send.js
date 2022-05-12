const request = require('request')
const EthereumTx = require('ethereumjs-tx').Transaction
var server = require('../../server')
var sharABI = require('../../erc20-abi/shar')
var janABI = require('../../erc20-abi/jan')
var grtABI = require('../../erc20-abi/grt')
var satxABI = require('../../erc20-abi/satx')
var usdtABI = require('../../erc20-abi/usdt')
var shibABI = require('../../erc20-abi/shib')
var maticABI = require('../../erc20-abi/matic')
var daiABI = require('../../erc20-abi/dai')
var sandABI = require('../../erc20-abi/sand')
var linkABI = require('../../erc20-abi/link')
var mkrABI = require('../../erc20-abi/mkr')

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var ethTokenSend = async function (req, res) {
    try {
        //logger.debug('ethTokenSend params:', req.params, 'body:', req.body)
        var web3 = server.web3
        var ercToken = req.params.ercToken
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var account, contractAddress, abi
        
        logger.debug('ethTokenSend ercToken: ' + ercToken + " sourceAddress: " + sourceAddress + " destinationAddress: " + destinationAddress + " amount: " + amount)
        
        if (!sourceAddress || !privateKey || !destinationAddress || !amount || !ercToken) {
            logger.error('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }

        var index = server.ercTokens.findIndex(x => x.ercToken === ercToken.toLowerCase())
        if (index >= 0) {
            ercToken = server.ercTokens[index].ercToken.toLowerCase()
            contractAddress = server.ercTokens[index].contractAddress
        }
        if (!contractAddress) {
            logger.error('Unknown ERC Token.')
            res.json({
                result: 'error',
                message: 'Unknown ERC Token.',
            })
            return
        }
        if (!web3.utils.isAddress(sourceAddress)) {
            logger.error('Invalid sourceAddress')
            res.json({
                result: 'error',
                message: 'Invalid sourceAddress',
            })
            return
        }
        if (!web3.utils.isAddress(destinationAddress)) {
            logger.error('Invalid destinationAddress')
            res.json({
                result: 'error',
                message: 'Invalid destinationAddress',
            })
            return
        }
        try {
            account = web3.eth.accounts.privateKeyToAccount(privateKey)
        } catch (error) {
            logger.error('Invalid PrivateKey')
            res.json({
                result: 'error',
                message: 'Invalid PrivateKey',
            })
            return
        }
        try {
            amount = parseFloat(amount)
        } catch (error) {
            logger.error('Invalid amount')
            res.json({
                result: 'error',
                message: 'Invalid amount',
            })
            return
        }

        if (ercToken === 'shar') {
            abi = sharABI
        } else if (ercToken === 'jan') {
            abi = janABI
        } else if (ercToken === 'grt') {
            abi = grtABI
        } else if (ercToken === 'satx') {
            abi = satxABI
        } else if (ercToken === 'usdt') {
            abi = usdtABI
        } else if (ercToken === 'shib') {
            abi = shibABI
        } else if (ercToken === 'matic') {
            abi = shibABI
        } else if (ercToken === 'dai') {
            abi = daiABI
        } else if (ercToken === 'sand') {
            abi = sandABI
        } else if (ercToken === 'link') {
            abi = linkABI
        } else if (ercToken === 'mkr') {
            abi = mkrABI
        }

        var contract = new web3.eth.Contract(abi, contractAddress)
        // Get nonce
        var nonce = await web3.eth.getTransactionCount(sourceAddress)
        // Get ercToken balance
        contract.methods.balanceOf(sourceAddress).call().then(function (amountResult) {
            // get token decimals
            contract.methods.decimals().call().then(function (decimalsResult) {
                // calculate amount for custome token decimals
                var value = parseInt(amountResult), decimals = parseInt(decimalsResult)
                var balance = value / 10 ** decimals
                logger.debug('Source Account Balance: ', balance + ' ' + ercToken.toUpperCase())
                logger.debug(balance, ' < ', amount)
                if (parseFloat(balance) < amount) {
                    logger.error('Insufficient funds')
                    res.json({
                        result: 'error',
                        message: 'Insufficient funds',
                    })
                    return
                }
                // convert amount
                var sendingAmount = (amount * (10 ** decimals)).toString()
                logger.debug('Sending Amount in Wei: ', sendingAmount)
                // tx
                var rawTransaction = {
                    'from': sourceAddress,
                    'gasPrice': web3.utils.toHex(2 * 1e9),
                    'gasLimit': web3.utils.toHex(210000),
                    'to': contractAddress,
                    'value': '0x0',
                    'data': contract.methods.transfer(destinationAddress, sendingAmount).encodeABI(),
                    'nonce': nonce,
                    'chainId': getChainId()
                }

                const transaction = new EthereumTx(rawTransaction, { chain: server.ethNetwork })
                var privateKeySplit = privateKey.split('0x')
                try {
                    var privateKeyHex = Buffer.from(privateKeySplit[1], 'hex')
                    transaction.sign(privateKeyHex)
                } catch (error) {
                    logger.error('Failed to sign Transaction')
                    logger.error(error)
                    res.json({
                        result: 'error',
                        message: 'Failed to sign Transaction',
                    })
                    return
                }

                const serializedTransaction = transaction.serialize()
                web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (error, id) => {
                    if (error) {
                        logger.error(error)
                        res.json({
                            result: 'error',
                            message: error.toString(),
                        })
                        return
                    }
                    const url = `${server.etherscanExplorerUrl}/tx/${id}`
                    logger.debug({ transactionHash: id, link: url })
                    res.json({
                        result: 'success',
                        transactionHash: id,
                        link: url
                    })
                })
            }, error => {
                logger.error(error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
            })
        }, error => {
            logger.error(error)
            res.json({
                result: 'error',
                message: error.toString(),
            })
            return
        })

        // contract.methods.balanceOf(sourceAddress).call().then(function (result) {
        //     var balance = web3.utils.fromWei(result, 'ether')
        //     logger.debug('Source Account Balance: ', balance + ' ' + ercToken)
        //     logger.debug(balance, ' < ', amount)
        //     if (parseFloat(balance) < amount) {
        //         logger.error('Insufficient funds')
        //         res.json({
        //             result: 'error',
        //             message: 'Insufficient funds',
        //         })
        //         return
        //     }
        //     // convert amount
        //     var sendingAmount = web3.utils.toWei(amount.toString(), 'ether')
        //     // tx
        //     var rawTransaction = {
        //         'from': sourceAddress,
        //         'gasPrice': web3.utils.toHex(2 * 1e9),
        //         'gasLimit': web3.utils.toHex(210000),
        //         'to': contractAddress,
        //         'value': '0x0',
        //         'data': contract.methods.transfer(destinationAddress, sendingAmount).encodeABI(),
        //         'nonce': nonce,
        //         'chainId': getChainId()
        //     }

        //     const transaction = new EthereumTx(rawTransaction, { chain: server.ethNetwork })
        //     var privateKeySplit = privateKey.split('0x')
        //     try {
        //         var privateKeyHex = Buffer.from(privateKeySplit[1], 'hex')
        //         transaction.sign(privateKeyHex)
        //     } catch (error) {
        //         logger.error('Failed to sign Transaction')
        //         logger.error(error)
        //         res.json({
        //             result: 'error',
        //             message: 'Failed to sign Transaction',
        //         })
        //         return
        //     }

        //     const serializedTransaction = transaction.serialize()
        //     web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (error, id) => {
        //         if (error) {
        //             logger.error(error)
        //             res.json({
        //                 result: 'error',
        //                 message: error.toString(),
        //             })
        //             return
        //         }
        //         const url = `${server.etherscanExplorerUrl}/tx/${id}`
        //         logger.debug({ transactionHash: id, link: url })
        //         res.json({
        //             result: 'success',
        //             transactionHash: id,
        //             link: url
        //         })
        //     })
        // })
    } catch (error) {
        logger.error('ethTokenSend catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

function getChainId() {
    switch (server.network) {
        case 'mainnet':
            return 1
        case 'kovan':
            return 2
        case 'ropsten':
            return 3
        case 'rinkeby':
            return 4
        case 'goerli':
            return 5
        default:
            return 3
    }
}

module.exports = ethTokenSend
