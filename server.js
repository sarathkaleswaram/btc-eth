const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const compression = require('compression')
const bodyParser = require('body-parser')
const Web3 = require('web3')
var routes = require('./routes')

const network = 'testnet' // mainnet, testnet
const ethNetwork = 'ropsten' // mainnet, ropsten, rinkeby
const ethInfuraApiKey = '605567f94946494a81e52ac8ca2784de' // Get API Key from http://infura.io/
const web3Url = `https://${ethNetwork}.infura.io/v3/${ethInfuraApiKey}`

exports.network = network
exports.ethNetwork = ethNetwork
exports.web3 = new Web3(new Web3.providers.HttpProvider(web3Url))

const app = express()
const port = 3002

app.use(cors())
app.use(compression())
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (_, res) => {
    res.send('BTC-ETH API Running!!!')
})

// Bitcoin
app.get('/btc/create', routes.btcCreate)
app.get('/btc/balance/:address', routes.btcBalance)
app.post('/btc/privatekey-to-address', routes.btcPrivateKeyToAddress)
app.post('/btc/send', routes.btcSend)

// Ethereum
app.get('/eth/create', routes.ethCreate)
app.get('/eth/balance/:address', routes.ethBalance)
app.post('/eth/privatekey-to-address', routes.ethPrivateKeyToAddress)
app.post('/eth/send', routes.ethSend)

// 404
app.get('/*', (_, res) => {
    res.json({ result: 'error', message: 'Invalid Request' })
})
app.post('/*', (_, res) => {
    res.json({ result: 'error', message: 'Invalid Request' })
})


app.listen(port, () => {
    console.log(`Server running on port ${port}\n`)
})
