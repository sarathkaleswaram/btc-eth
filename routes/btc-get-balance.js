const bitcore = require('bitcore-lib')
const request = require('request')
const sb = require('satoshi-bitcoin')
var server = require('../server')

var btcBalance = function (req, res) {
    try {
        console.log('\nbtcBalance params:', req.params)
        var address = req.params.address
        var chain = server.network === 'testnet' ? 'test3' : 'main'

        if (!address) {
            console.log('Address is empty')
            res.json({
                result: 'error',
                message: 'Address is empty',
            })
            return
        }
        if (!bitcore.Address.isValid(address, server.network)) {
            console.log('Invalid address')
            res.json({
                result: 'error',
                message: 'Invalid address',
            })
            return
        }
        request({
            url: `https://api.blockcypher.com/v1/btc/${chain}/addrs/${address}/balance`,
            json: true
        }, function (error, response, body) {
            if (error) {
                console.error(error)
                res.json({
                    result: 'error',
                    message: error,
                })
                return
            }
            if (body.error) {
                console.log(body.error)
                res.json({
                    result: 'error',
                    message: body.error,
                })
                return
            }
            var balance = sb.toBitcoin(body.final_balance) + ' BTC'
            console.log(balance)
            res.json({
                result: 'success',
                address: address,
                balance: balance
            })
        })
    } catch (error) {
        console.error('btcBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
    }
}

module.exports = btcBalance