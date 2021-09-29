var requests = require('../../models/requests')

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var pugRequests = function (req, res) {
    logger.debug('pugRequests')

    requests.find({}).sort({ createdDate: -1 }).then((requests) => {
        logger.debug('Requests length:', requests.length)
        res.render('requests', { requests: requests, moment: require('moment') })
    }, error => {
        logger.error(error)
        res.render('requests', { error: true, message: error.toString() })
    })

}

module.exports = pugRequests