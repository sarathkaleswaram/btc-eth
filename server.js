const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const compression = require('compression')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const Web3 = require('web3')
const path = require('path')
const log4js = require('log4js')
const WebSocket = require('ws')
const CronJob = require('cron').CronJob
var routes = require('./routes')
var { runCronJob, checkPendingRequests } = require('./transactions')
var { subscribeEthPendingTx } = require('./transactions/eth-transaction')

// Logger
var logger = log4js.getLogger('btc-eth')
logger.level = 'trace'

// Networks
const network = 'testnet' // mainnet, testnet
const ethNetwork = 'ropsten' // mainnet, ropsten, rinkeby

// web3 API Key
const ethInfuraApiKey = '605567f94946494a81e52ac8ca2784de'
const web3Url = `https://${ethNetwork}.infura.io/v3/${ethInfuraApiKey}`
const web3WsUrl = `wss://${ethNetwork}.infura.io/ws/v3/${ethInfuraApiKey}`

// etherscan.io API Key
const etherscanNetwork = 'api-ropsten' // api, api-ropsten, api-rinkeby
const etherscanApiKey = '1R2ACZ69YGQQ4DVH8SPUEXAZTWV3G415IM'
const etherscan = `https://${etherscanNetwork}.etherscan.io/api?&apikey=${etherscanApiKey}`

// A2ZURL
const a2zUrl = 'https://test.a2zbetting.com/api/transactions/crypto'

// Exports
exports.network = network
exports.ethNetwork = ethNetwork
exports.etherscan = etherscan
exports.web3 = new Web3(new Web3.providers.HttpProvider(web3Url))
exports.web3ws = new Web3(new Web3.providers.WebsocketProvider(web3WsUrl))
exports.a2zUrl = a2zUrl

// BTC-ETH accounts & transactions
exports.btcAccounts = []
exports.btcTxHashes = []
exports.ethAccounts = []
exports.ethTxHashes = []

// Mongodb
var mongoUrl = 'mongodb://127.0.0.1:27017/btc_eth'
mongoose.connect(mongoUrl, { useCreateIndex: true, useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true })
    .then(() => {
        logger.info('Mongodb Connected!')
        checkPendingRequests()
    })
    .catch(err => logger.error(err))

// Cron Job
var job = new CronJob('*/5 * * * * *', function () {
    runCronJob()
})
job.start()

// Get incomming transactions
subscribeEthPendingTx()

// Express
const app = express()
const port = 3002

app.use(cors())
app.use(compression())
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
// Public files
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// Pug Page
app.get('/', routes.pugPage)

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

// Http
var server = app.listen(port, () => {
    logger.info(`Http Server running on port ${port}`)
})
// Websocket
var wss = new WebSocket.Server({ server })
exports.wss = wss
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        logger.debug(`Address: ${message} is connected through Websocket`)
    })
})
wss.on('listening', function listen() {
    logger.info(`Websocket server running on port ${port}`)
})
