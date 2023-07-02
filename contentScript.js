
const VERSION_ID = 'psocmjfyer'
const HOSTNAME = 'watchmachine.win'

const detectPlugin = () => {
    const pluginDetector = document.querySelector('.plugin-detector')
    if (pluginDetector) {
        pluginDetector.classList.add(VERSION_ID)
        return true
    }
    return false
}

(() => {

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.type === 'open') {
            const urlBegin = document.URL.includes('youtube') ? 'https://www.youtube.com/watch?v=' : 'https://youtu.be/'
            window.open(`${urlBegin}${message.data.vid}`, '_self')
        } else if (message.type === 'load') {
            const detectorElement = document.createElement('div')
            document.querySelector('.load-detector').appendChild(detectorElement)
        }
        
    })

    if (document.URL.includes(HOSTNAME)) {
        const detectInterval = setInterval(() => {
            if (detectPlugin()) {
                clearInterval(detectInterval)
            }
        }, 1000 * .1)
    }
    
})()