var server = require('../server');
const WebSocket = require('ws');
const request = require('request')
var getBitcoinTransaction = function(address){
  var ws = new WebSocket("wss://socket.blockcypher.com/v1/btc/main");
var count = 0;
// console.log(ws)
ws.onmessage = function (event) {
  console.log(event)
  // var tx = JSON.parse(event.data);
  // var shortHash = tx.hash.substring(0, 6) + "...";
  // var total = tx.total / 100000000;
  // var addrs = tx.addresses.join(", ");
  // console.loog(addrs,total)
//   $('#browser-websocket').before("<div>Unconfirmed transaction " + shortHash + " totalling " + total + "BTC involving addresses " + addrs + "</div>");
//   count++;
//   if (count > 10) ws.close();
}
ws.onopen = function(event) {
  // console.log(ws.onopen)
  // ws.send(JSON.stringify({ "event": "ping" }));
  ws.send(JSON.stringify({event: "unconfirmed-tx"}));
}
//   address='1DEP8i3QJCsomS4BSMY2RpU1upv62aGvhD'
//   console.log(address,"=================-")
//   const  url = 'https://api.blockcypher.com/v1/btc/main/addrs/'+address+'/full';
//   console.log(url,"=================")
//   request({
//     url: url,
//     json: true
// }, function (error, response, body) {
//   console.log(body,"----");
//   console.log(error,"+++++++++=");
    
//   })
}
module.exports = getBitcoinTransaction