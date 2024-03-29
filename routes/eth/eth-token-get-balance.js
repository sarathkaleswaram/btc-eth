const request = require('request')
const { logger } = require('../../utils/logger')
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

var ethTokenBalance = function (req, res) {
    try {
        logger.debug('ethTokenBalance params:', req.params)
        var web3 = server.web3
        var address = req.params.address
        var ercToken = req.params.ercToken
        var contractAddress, abi

        if (!address) {
            logger.error('Address is empty')
            res.json({
                result: 'error',
                message: 'Address is empty',
            })
            return
        }
        if (!web3.utils.isAddress(address)) {
            logger.error('Invalid address')
            res.json({
                result: 'error',
                message: 'Invalid address',
            })
            return
        }
        if (!ercToken) {
            logger.error('Token is empty')
            res.json({
                result: 'error',
                message: 'Token is empty',
            })
            return
        }
        var index = server.ercTokens.findIndex(x => x.ercToken === ercToken.toLowerCase())
        if (index >= 0) {
            ercToken = ercToken.toLowerCase()
            contractAddress = server.ercTokens[index].contractAddress
        }
        if (!contractAddress) {
            logger.error('Unknown ERC Token')
            res.json({
                result: 'error',
                message: 'Unknown ERC Token',
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
            abi = maticABI
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

        // Get ercToken balance
        contract.methods.balanceOf(address).call().then(function (amountResult) {
            // get token decimals
            contract.methods.decimals().call().then(function (decimalsResult) {
                // calculate amount for custome token decimals
                var value = parseInt(amountResult), decimals = parseInt(decimalsResult)
                var amount = value / 10 ** decimals
                var balance = amount + ' ' + ercToken.toUpperCase()
                logger.debug('ETH - ERC Token Balance:', balance)
                res.json({
                    result: 'success',
                    address: address,
                    balance: balance
                })
            }, error => {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
            })
        }, error => {
            logger.error('Error: ' + error)
            res.json({
                result: 'error',
                message: error.toString(),
            })
            return
        })
        // request({
        //     url: `${server.etherscanAPI}&module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest`,
        //     json: true
        // }, function (error, response, body) {
        //     if (error) {
        //         logger.error('Error: ' + error)
        //         res.json({
        //             result: 'error',
        //             message: error.toString(),
        //         })
        //         return
        //     }
        //     if (body.status === '0') {
        //         logger.debug(body.message)
        //         res.json({
        //             result: 'error',
        //             message: body.message,
        //         })
        //         return
        //     }
        //     if (body.status === '1') {
        //         var balance = web3.utils.fromWei(body.result, 'ether') + ' ' + server.ercTokens[index].ercToken.toUpperCase()
        //         logger.debug('ETH - ERC Token Balance:', balance)
        //         res.json({
        //             result: 'success',
        //             address: address,
        //             balance: balance
        //         })
        //     }
        // })
    } catch (error) {
        logger.error('ethTokenBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = ethTokenBalance