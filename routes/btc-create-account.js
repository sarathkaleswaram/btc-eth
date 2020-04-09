const bitcore = require('bitcore-lib')
var server = require('../server')

var btcCreate = function (req, res) {
    try {
        console.log('\nbtcCreate')
        var privateKey = new bitcore.PrivateKey(server.network)
        // var wif = privateKey.toWIF()
        var address = privateKey.toAddress()
        console.log({ address: address.toString(), privateKey: privateKey.toString() })

        res.json({
            result: 'success',
            address: address.toString(),
            privateKey: privateKey.toString()
        })
    } catch (error) {
        console.error('btcCreate catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
    }
}

module.exports = btcCreate