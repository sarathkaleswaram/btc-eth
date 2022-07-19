var requests = require('../../models/requests')
const { logger } = require('../../utils/logger')

var pugRequests = function (req, res) {
    logger.debug('pugRequests')

    requests.find({}).sort({ createdDate: -1 }).then((requests) => {
        logger.debug('Requests length: ' + requests.length)
        res.render('requests', { requests: requests, moment: require('moment') })
    }, error => {
        logger.error('Error: ' + error)
        res.render('requests', { error: true, message: error.toString() })
    })

}

module.exports = pugRequests