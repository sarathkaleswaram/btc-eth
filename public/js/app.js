$(document).ready(function () {
    window.WebSocket = window.WebSocket || window.MozWebSocket
    var wsUrl = `ws://${window.location.host}`
    var connection = new WebSocket(wsUrl)
    var urlParams = new URLSearchParams(window.location.search)
    var address = $('#copy-address').text().trim()
    var interval

    if (address) {
        $('.count-down').append(`
            <div class='alert alert-info count-down-alert'>
                <h5>Session Expires in:</h5>
                <p id='countdown-timer'></p>
            </div>
        `)
        startCountDown(300, $('#countdown-timer')) // 300 sec = 5 mins
    }

    if (!window.WebSocket) {
        appendWsError()
    }

    connection.onopen = function () {
        console.log('Websocket connected.')
        if (address)
            connection.send(JSON.stringify({ address: address, status: 'Connected' }))
    }

    connection.onerror = function (error) {
        appendWsError()
    }

    $(window).on('unload', function () {
        if (address)
            connection.send(JSON.stringify({ address: address, status: 'Closed', ercToken: urlParams.get('ercToken') || undefined }))
    })

    connection.onmessage = function (message) {
        console.log(message.data)
        try {
            var message = JSON.parse(message.data)
            console.log(message)
            if (message.address === address) {
                if (message.type === 'submitted') {
                    console.log('Got submitted message')
                    stopCountDown()
                    $('#websocket-submitted-message').append(`
                        <div class='alert alert-primary'>
                            <strong>${message.title}</strong>
                            <p>${message.template}</p>
                            <p>${message.message}</p>
                        </div>
                    `)
                    setTimeout(function () {
                        window.location.replace(message.callbackUrl)
                    }, 3000)
                }
                if (message.type === 'confirmed') {
                    console.log('Got confirmed message')
                    stopCountDown()
                    $('#websocket-submitted-message').remove()
                    $('#websocket-confirmed-message').append(`
                        <div class='alert alert-success'>
                            <strong>${message.title}</strong>
                            <p>${message.message}</p>
                        </div>
                    `)
                    setTimeout(function () {
                        window.location.replace(message.callbackUrl)
                    }, 2000)
                }
                if (message.type === 'timeout') {
                    console.log('Got timeout message')
                    window.location.replace(message.callbackUrl)
                }
            }
        } catch (e) {
            console.log(e)
            return
        }
    }

    function appendWsError() {
        $('#websocket-error').prepend(`
            <div class='alert alert-warning'>
                <strong>Unable to make WebSocket Connection.</strong>
                <p>Please submit transaction and close this Tab. Once transaction is confirmed, we will credit the amount.</p>
            </div>
        `)
    }

    function startCountDown(duration, display) {
        var timer = duration, minutes, seconds
        interval = setInterval(function () {
            minutes = parseInt(timer / 60, 10)
            seconds = parseInt(timer % 60, 10)

            minutes = minutes < 10 ? '0' + minutes : minutes
            seconds = seconds < 10 ? '0' + seconds : seconds

            display.html(minutes + 'm : ' + seconds + 's')

            if (--timer < 0) {
                timer = duration
                sessionExpired()
                clearInterval(interval)
            }
        }, 1000)
    }

    function stopCountDown() {
        $('.count-down').remove()
        clearInterval(interval)
    }

    function sessionExpired() {
        $('.jumbotron').remove()
        $('.count-down').empty()
        $('.count-down').append(`
            <div class='alert alert-danger'>
                <h5>Your session got expired.</h5>
                <p>Redirecting back.</p>
            </div>
        `)
    }

    $('#copy-clipboard').click(function () {
        var temp = $('<input>')
        $('body').append(temp)
        temp.val(address).select()
        document.execCommand('copy')
        temp.remove()
        alert('Copied address: ' + address)
    })
})