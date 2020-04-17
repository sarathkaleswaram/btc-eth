const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const compression = require('compression')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const Web3 = require('web3')
const Web31 = require('web3')
const path = require('path')
var routes = require('./routes')

const network = 'testnet' // mainnet, testnet
const ethNetwork = 'ropsten' // mainnet, ropsten, rinkeby
const ethInfuraApiKey = '605567f94946494a81e52ac8ca2784de' // Get API Key from http://infura.io/
const web3Url = `https://${ethNetwork}.infura.io/v3/${ethInfuraApiKey}`
const webweb3url = `wss://${ethNetwork}.infura.io/ws/v3/${ethInfuraApiKey}`

// Mongodb
var mongoUrl = 'mongodb://127.0.0.1:27017/btc_eth'
mongoose.connect(mongoUrl, { useCreateIndex: true, useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true })
    .then(() => console.log('Mongodb Connected!'))
    .catch(err => console.log(err))

exports.network = network
exports.ethNetwork = ethNetwork
exports.web3 = new Web3(new Web3.providers.HttpProvider(web3Url))
exports.web3socket = new Web31(Web31.givenProvider || new Web31.providers.WebsocketProvider(webweb3url))

// const provider = new Web31.providers.WebsocketProvider(webweb3url)
// provider.on('error', e => console.error('WS Error', e))
// provider.on('end', e => console.error('WS End', e))
// provider.on('connect', () => {
//     console.log('Ethereum Blockchain Connected\n-----------------------------')
// })

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

// Listen
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
