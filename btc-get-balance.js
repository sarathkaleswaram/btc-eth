const axios = require('axios');

var address = "17hFoVScNKVDfDTT6vVhjYwvCu6iDEiXC4";

axios.get(`https://blockchain.info/balance?active=${address}`)
    .then(data => console.log(data.data))
    .catch(error => console.log(error.code));