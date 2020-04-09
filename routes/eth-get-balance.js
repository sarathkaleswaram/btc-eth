var server = require('../server')

var ethBalance = function (req, res) {
    try {
        console.log('\nethBalance params:', req.params)
        var web3 = server.web3
        var address = req.params.address

        if (!address) {
            console.log('Address is empty')
            res.json({
                result: 'error',
                message: 'Address is empty',
            })
            return
        }
        if (!web3.utils.isAddress(address)) {
            console.log('Invalid address')
            res.json({
                result: 'error',
                message: 'Invalid address',
            })
            return
        }

        web3.eth.getBalance(address, (err, result) => {
            if (err) {
                console.error(err)
                res.json({
                    result: 'error',
                    message: error,
                })
            }
            var balance = web3.utils.fromWei(result, 'ether') + ' ETH'
            console.log(balance)
            res.json({
                result: 'success',
                address: address,
                balance: balance
            })
        })
    } catch (error) {
        console.error('ethBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
    }
}

module.exports = ethBalance