const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const compression = require('compression')
const bodyParser = require('body-parser')
const Web3 = require('web3')
const Web31 = require('web3')
var routes = require('./routes')
var QRCode = require('qrcode')
const network = 'testnet' // mainnet, testnet
const ethNetwork = 'ropsten' // mainnet, ropsten, rinkeby
const ethInfuraApiKey = '605567f94946494a81e52ac8ca2784de' // Get API Key from http://infura.io/
const web3Url = `https://${ethNetwork}.infura.io/v3/${ethInfuraApiKey}`;
const webweb3url = `wss://${ethNetwork}.infura.io/ws/v3/${ethInfuraApiKey}`;//wss://${ethNetwork}.infura.io/ws/v3/${ethInfuraApiKey}
const mongo = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017';
var dbs;
mongo.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (err, client) => {
    dbs = client
    exports.dbs = client
    if (err) {
        console.error(err)
        return
    }
    return client
    //...
});
exports.dbs = dbs;
exports.network = network
exports.ethNetwork = ethNetwork
 exports.web3 = new Web3(new Web3.providers.HttpProvider(web3Url))
// const wsURL = 'wss://rinkeby.infura.io/ws/v3/605567f94946494a81e52ac8ca2784de'
exports.web3socket = new Web31(Web31.givenProvider || new Web31.providers.WebsocketProvider(webweb3url));

const provider = new Web31.providers.WebsocketProvider(webweb3url);
provider.on('error', e => console.error('WS Error', e));
provider.on('end', e => console.error('WS End', e));
provider.on('connect', () => {
    console.log('Ethereum Blockchain Connected\n-----------------------------');
});
const app = express()
const port = 3002

app.use(cors())
app.use(compression())
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.set("view engine", "jade")

app.get('/', function (req, res) {
    const db = dbs.db('crypto');
    const collection = db.collection('transactions');
    var address = req.query.address;
    var type = req.query.type;
    var token = req.query.token;
    var timestamp = req.query.timestamp;
    var callback = req.query.callback;
    var status = -1;
    QRCode.toDataURL(address, function (err, url) {
        res.render('gateway', { src: url, account: address });
        collection.findOne({ "address": address, "time_stamp": timestamp }, (err, item) => {
            if (!item) {
                collection.insertOne({ address: address, type: type, token: token, time_stamp: timestamp, call_back: callback, status: status })
            }
        })
        if (type === 'BTC') {
            routes.getBitcoinTransaction(address)
        } if (type === 'ETH') {
            routes.getTransaction(address);

        }
    })

});
// app.get('/', (_, res) => {
//     res.send('BTC-ETH API Running!!!')
// })

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
