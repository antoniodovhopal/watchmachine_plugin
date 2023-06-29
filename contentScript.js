
const VERSION_ID = 'cjdos89pkk'

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
        const urlBegin = document.URL.includes('youtube') ? 'https://www.youtube.com/watch?v=' : 'https://youtu.be/'
        window.open(`${urlBegin}${message.vid}`, '_self')
    })

    if (document.URL.includes('watchmachine.win')) {
        const detectInterval = setInterval(() => {
            if (detectPlugin()) {
                clearInterval(detectInterval)
            }
        }, 1000 * .1)
    }
    
})()