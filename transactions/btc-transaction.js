var server = require('../server');
const WebSocket = require('ws');
const request = require('request')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var getBitcoinTransaction = function (address) {
  var ws = new WebSocket("wss://socket.blockcypher.com/v1/btc/main");
  var count = 0;
  // logger.debug(ws)
  ws.onmessage = function (event) {
    logger.debug(event)
    // var tx = JSON.parse(event.data);
    // var shortHash = tx.hash.substring(0, 6) + "...";
    // var total = tx.total / 100000000;
    // var addrs = tx.addresses.join(", ");
    // console.loog(addrs,total)
    //   $('#browser-websocket').before("<div>Unconfirmed transaction " + shortHash + " totalling " + total + "BTC involving addresses " + addrs + "</div>");
    //   count++;
    //   if (count > 10) ws.close();
  }
  ws.onopen = function (event) {
    // logger.debug(ws.onopen)
    // ws.send(JSON.stringify({ "event": "ping" }));
    ws.send(JSON.stringify({ event: "unconfirmed-tx" }));
  }
  //   address='1DEP8i3QJCsomS4BSMY2RpU1upv62aGvhD'
  //   logger.debug(address,"=================-")
  //   const  url = 'https://api.blockcypher.com/v1/btc/main/addrs/'+address+'/full';
  //   logger.debug(url,"=================")
  //   request({
  //     url: url,
  //     json: true
  // }, function (error, response, body) {
  //   logger.debug(body,"----");
  //   logger.debug(error,"+++++++++=");

  //   })
}
module.exports = getBitcoinTransaction