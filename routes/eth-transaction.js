var server = require('../server');

var getTransaction =  function (address) {
    try {
        console.log("iam here", address)
        var dbs = server.dbs;
        // console.log(dbs)
        let addressss=[];
     
        const db = dbs.db('crypto');
        const collection = db.collection('transactions');
        collection.find({ "type": 'ETH',"status":-1}).toArray( (err, item) => {
            console.log(item)
            var data =[];
                test(address)
        })
        
    } catch (error) {
console.log(error)
    }
}
var test=function(address){

    var web3 = server.web3socket;
    console.log(address)
try{
    subscription = web3.eth.subscribe('logs', {
        //fromBlock: 1,
       // address: data,
       topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]
   }, function () { }).on("data", function (trxData) {
       console.dir(trxData, {
           depth: null
       })
       function formatAddress(data) {
           var step1 = web3.utils.hexToBytes(data);
           for (var i = 0; i < step1.length; i++)
               if (step1[0] == 0) step1.splice(0, 1);
           return web3.utils.bytesToHex(step1);
       }

       if (formatAddress(trxData.topics['2']).toLowerCase() === address.toLowerCase()) {
           var transferAmount = web3.utils.fromWei(web3.utils.hexToNumberString(trxData.data), 'ether');
       }
       // collection.updateOne({ "address": address, "status": -1 }, {'$set': {'amount': transferAmount,'tid':}}, (err, item) => {
       //     console.log(item)
       //   })
       // collection.findOne({ "address": address, "status": -1 }, (err, item) => {
       //     if (!item) {
       //         collection.insertOne({ address: address, type: type, token: token, time_stamp: timestamp, call_back: callback, status: status })
       //     }
       // })

   })
}catch(error){

}
}
module.exports = getTransaction