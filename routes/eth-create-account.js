var server = require('../server')

var ethCreate = function (req, res) {
    try {
        console.log('\nethCreate')
        var web3 = server.web3
        var account = web3.eth.accounts.create()
        console.log({ address: account.address, privateKey: account.privateKey })
        res.json({
            result: 'success',
            address: account.address,
            privateKey: account.privateKey
        })
    } catch (error) {
        console.error('btcCreate catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
    }
}

module.exports = ethCreate