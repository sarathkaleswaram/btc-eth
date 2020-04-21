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
var { btcWsOnMessage } = require('./transactions/btc-transaction')

// Logger
var logger = log4js.getLogger('btc-eth')
logger.level = 'trace'

// mainnet or testnet
const isMainnet = false // true, false

// Networks
const network = isMainnet ? 'mainnet' : 'testnet'
const ethNetwork = isMainnet ? 'mainnet' : 'ropsten'
const etherscanAPINetwork = isMainnet ? 'api' : 'api-ropsten'
const etherscanSubdomain = isMainnet ? '' : ethNetwork + '.'
const btcChain = isMainnet ? 'main' : 'test3'
const btcWsNetwork = isMainnet ? 'ws' : 'testnet-ws'
const btcExplorerPath = isMainnet ? 'btc' : 'btc-testnet'

// Bitcoin Blockcypher URL
const btcAPI = `https://api.blockcypher.com/v1/btc/${btcChain}`
const btcWsAPI = `wss://${btcWsNetwork}.smartbit.com.au/v1/blockchain`
const btcExplorerUrl = `https://live.blockcypher.com/${btcExplorerPath}`

// web3 API
const ethInfuraApiKey = '605567f94946494a81e52ac8ca2784de'
const web3HttpUrl = `https://${ethNetwork}.infura.io/v3/${ethInfuraApiKey}`
const web3WsUrl = `wss://${ethNetwork}.infura.io/ws/v3/${ethInfuraApiKey}`

// etherscan API
const etherscanApiKey = '1R2ACZ69YGQQ4DVH8SPUEXAZTWV3G415IM'
const etherscanAPI = `https://${etherscanAPINetwork}.etherscan.io/api?&apikey=${etherscanApiKey}`
const etherscanExplorerUrl = `https://${etherscanSubdomain}etherscan.io`

// A2ZURL
const a2zUrl = 'https://test.a2zbetting.com/api/transactions/crypto'

// Ethereum ws connection
var web3WsProvider = new Web3.providers.WebsocketProvider(web3WsUrl)
web3WsProvider.on('error', e => logger.error('ETH web3 websocket connection error:', e))
web3WsProvider.on('connect', () => {
    logger.debug('ETH Websocket connected')
    subscribeEthPendingTx()
})

// Bitcoin ws connection
var btcWebsocket = new WebSocket(btcWsAPI)
btcWebsocket.on('error', e => logger.error('BTC websocket connection error:', e))
btcWebsocket.on('open', function open() {
    logger.debug('BTC Websocket connected')
    btcWsOnMessage()
})

// Exports
exports.network = network
exports.ethNetwork = ethNetwork
exports.etherscanAPI = etherscanAPI
exports.etherscanExplorerUrl = etherscanExplorerUrl
exports.btcAPI = btcAPI
exports.btcExplorerUrl = btcExplorerUrl
exports.btcWebsocket = btcWebsocket
exports.web3 = new Web3(new Web3.providers.HttpProvider(web3HttpUrl))
exports.web3ws = new Web3(web3WsProvider)
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

// Cron Job runs every 5 secs
var job1 = new CronJob('*/5 * * * * *', function () {
    runCronJob()
})
job1.start()

// Cron Job runs every 10 mins
var job2 = new CronJob('*/10 * * * *', function () {
    checkPendingRequests()
})
job2.start()

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
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        logger.debug(`Address: ${message} is connected through Websocket`)
    })
})
wss.on('listening', function listen() {
    logger.info(`Websocket server running on port ${port}`)
})
// export wss
exports.wss = wss