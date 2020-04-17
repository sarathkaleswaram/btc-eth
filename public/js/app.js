function copyClipboard() {
    var $temp = $('<input>')
    var text = $('#copy-address').text().trim()
    $('body').append($temp)
    $temp.val(text).select()
    document.execCommand('copy')
    $temp.remove()
    alert('Copied address: ' + text)
}