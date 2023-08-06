
const VERSION_ID = 'jkidychqpp'
const HOSTNAME = 'watchmachine.win'
// const HOSTNAME = 'localhost'

let isPretified = false

const detectPlugin = () => {
    const pluginDetector = document.querySelector('.plugin-detector')
    if (pluginDetector) {
        pluginDetector.classList.add(VERSION_ID)
        return true
    }
    return false
}

window.onload = () => {
    chrome.storage.local.get(['act'], function(res) {
        if (!res.act) return
        const {vid, like, sub, exp, pbr} = res.act
        const videoId = new URLSearchParams(document.URL.split('?')[1]).get('v')
        if (vid !== videoId || Date.now() >= exp) return
        const targetNode = document.getElementById("primary") || document.body;
        selfObserver(targetNode, {like, sub, pbr});
    })
}


function selfObserver(documentNode, act) {
    const observer = new MutationObserver(function () {
        adFunction()
        playbackFunction(act.pbr)
        if (act.like) likeFunction()
        if (act.sub) subFunction()
        setTimeout(() => pretifyFunc(), 1.5 * 1000)
    });

    const config = {
        subtree: true,
        childList: true,
    }
    observer.observe(documentNode, config);
}

function pretifyFunc() {
    if (isPretified) return
    isPretified = true
    document.querySelector('.ytp-chrome-bottom').remove()
    document.querySelector('#top-row').remove()
    const logoIcon = document.querySelector('#logo-icon')
    logoIcon.querySelector('yt-icon-shape').remove()
    logoIcon.style.width = '50px'
    const imgElement = document.createElement('img')
    imgElement.setAttribute('src', "https://i.ibb.co/j43Cpj2/logo-circle.png")
    logoIcon.appendChild(imgElement)
    imgElement.style.height = '50px'
}

function likeFunction() {
    const likeButton = document.querySelector("#segmented-like-button button")
    if (!likeButton) return
    const isActive = likeButton.getAttribute('aria-pressed') === 'true'
    if (!isActive) {
        likeButton.click()
    }
}

function subFunction() {
    const subButton = document.querySelector("#subscribe-button button")
    if (!subButton) return
    const isActive = document.querySelector("#subscribe-button ytd-subscribe-button-renderer").getAttributeNames().includes('subscribed')
    if (!isActive) {
        subButton.click()
    }
}

function playbackFunction(pbr) {
    const vd = document.querySelector('.video-stream.html5-main-video')
    if (!vd || (vd.volume === 0.01 && vd.playbackRate === pbr)) return
    vd.volume = 0.01
    vd.playbackRate = pbr
}

function adFunction() {
    const mainDocument = document.getElementsByClassName(
        "video-ads ytp-ad-module"
    );
    const playerOverlay = document.getElementsByClassName(
        "ytp-ad-player-overlay"
    );
    const imageOverlay = document.getElementsByClassName(
        "ytp-ad-image-overlay"
    );

    const skipBtn = document.getElementsByClassName(
        "ytp-ad-skip-button ytp-button"
    );

    const videoDocument = document.getElementsByClassName(
        "video-stream html5-main-video"
    );

    const textOverlay = document.getElementsByClassName("ytp-ad-text-overlay");

    const playerAds = document.getElementById("player-ads");

    function handleSkipBtn() {
        if (skipBtn.length > 0) {
            skipBtn[0].click();
        }
    }

    if (mainDocument.length > 0) {
        handleSkipBtn();
        if (playerOverlay.length > 0) {
            playerOverlay[0].style.visibility = "hidden";
            for (let i = 0; i < videoDocument.length; i++) {
                if (videoDocument[i] && videoDocument[i].duration) {
                    videoDocument[i].currentTime = videoDocument[i].duration;
                }
            }
            handleSkipBtn();
        }
        if (imageOverlay.length > 0) {
            imageOverlay[0].style.visibility = "hidden";
        }
    }

    if (playerAds) {
        playerAds.style.display = "none";
    }

    if (textOverlay.length > 0) {
        textOverlay[0].style.display = "none";
    }
}

// (() => {

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
    
// })()