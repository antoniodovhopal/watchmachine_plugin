
const VERSION_ID = 'lsocuwmejt'
const HOSTNAME = 'watchmachine.win'
// const HOSTNAME = 'localhost'

let isPretified = false
let isStreamed = false
let isClicked = false
let isPlayered = false
let isSubed = false

const detectPlugin = () => {
    const pluginDetector = document.querySelector('.plugin-detector')
    if (pluginDetector) {
        pluginDetector.classList.add(VERSION_ID)
        return true
    }
    return false
}

chrome.runtime.onMessage.addListener(function (message) {
    windowOnload(message.data)
})

function windowOnload(data) {
    const {vid, pbr, type, params, link, sub} = data
    // console.log(data)
    if (type === 'video' && document.URL.includes(vid)) {
        selfObserverPlayer(document.body, sub, pbr)
    } else if (document.URL.startsWith(link)) {
        switch (type) {
            case 'outer':
                windowOpen(`https://youtu.be/${vid}?si=${params.si}`, data)
                break
            case 'inner':
                selfObserverInner(document.body, data)
                break
            case 'search':
                selfObserverSearch(document.body, data)
                break
            case 'channel':
                selfObserverChannel(document.body, data)
                break
            case 'niche':
                selfObserverNiche(document.body, data)
                break
            case 'endscreen':
                selfObserverEndscreen(document.body, data)
                break
        }
    }
    // else if (document.URL.includes(vid)) {
    //     selfObserverPlayer(document.body, sub, pbr)
    // }
}


function selfObserverInner(documentNode, data) {
    const observer = new MutationObserver(async function () {
        if (document.URL.includes(data.vid)) {
            if (isPlayered) return
            isPlayered = true
            selfObserverPlayer(documentNode, data.sub, data.pbr)
            return
        }
        await sleep(2500)
        const isMain = await emulateMain(data.vid, data)
        if (isMain) return
        if (Math.random() < .65) {
            if (Math.random() < .65) changeAct(`https://www.youtube.com/results?search_query=${encodeSearchQuery(data.params.title)}`, 'search', data)
            else changeAct(`${data.params.channel}/videos`, 'channel', data)
            
        } else {
            changeAct(`https://www.youtube.com/results?search_query=${encodeSearchQuery(data.params.niche)}`, 'niche', data)
        }
    })
    const config = { subtree: true, childList: true, }
    observer.observe(documentNode, config);
}
function selfObserverSearch(documentNode, data) {
    const observer = new MutationObserver(async function() {
        if (document.URL.includes(data.vid)) {
            if (isPlayered) return
            isPlayered = true
            selfObserverPlayer(documentNode, data.sub, data.pbr)
            return
        }
        await sleep(5000)
        const isSearch = await emulateSearch(data.vid)
        if (isSearch) return
        changeAct(`https://www.youtube.com/results?search_query=${encodeSearchQuery(data.params.niche)}`, 'niche', data)
    })
    const config = { subtree: true, childList: true, }
    observer.observe(documentNode, config);
}
function selfObserverChannel(documentNode, data) {
    const observer = new MutationObserver(async function () {
        if (document.URL.includes(data.vid)) {
            if (isPlayered) return
            isPlayered = true
            selfObserverPlayer(documentNode, data.sub, data.pbr)
            return
        }
        await sleep(5000)
        const isChannel = await emulateChannel(data.vid)
        if (isChannel) return
        changeAct(`https://www.youtube.com/results?search_query=${encodeSearchQuery(data.params.niche)}`, 'niche', data)
    })
    const config = { subtree: true, childList: true, }
    observer.observe(documentNode, config)
}
function selfObserverNiche(documentNode, data) {
    const observer = new MutationObserver(async function () {
        if (document.URL.includes(data.vid)) {
            if (isPlayered) return
            isPlayered = true
            selfObserverPlayer(documentNode, data.sub, data.pbr)
            return
        }
        await sleep(5000)
        emulateNiche(data.vid, data)
    })
    const config = { subtree: true, childList: true, }
    observer.observe(documentNode, config)
}
function selfObserverEndscreen(documentNode, data) {
    const observer = new MutationObserver(async function () {
        if (document.URL.includes(data.vid)) {
            if (isPlayered) return
            isPlayered = true
            selfObserverPlayer(documentNode, data.sub, data.pbr)
            return
        }
        await sleep(1000)
        await emulateEndscreen(data.vid, data)
    })
    const config = { subtree: true, childList: true, }
    observer.observe(documentNode, config);
}


async function emulateMain(vid, data) {
    const item = document.querySelector(`ytd-rich-item-renderer a#thumbnail[href="/watch?v=${vid}"]`)
    if (isClicked) return true
    isClicked = true
    if (!item) {
        if (Math.random() < .15) {
            windowOpen('https://www.youtube.com/watch?v=' + vid, data)
            return true
        }
        else return false
    }
    item.click()
    return true
}
async function emulateSearch(vid) {
    const item = document.querySelector(`#contents>ytd-video-renderer a#thumbnail[href*="${vid}"]`)
    if (!item) return false
    if (isClicked) return true
    isClicked = true
    item.click()
    return true
}
async function emulateChannel(vid) {
    const item = document.querySelector(`#contents ytd-rich-item-renderer a#thumbnail[href*="${vid}"]`)
    if (!item) return false
    if (isClicked) return true
    isClicked = true
    item.click()
    return true
}
function emulateNiche(vid, data) {
    if (document.URL.includes('results?search_query=')) {
        let items = document.querySelectorAll(`#contents>ytd-video-renderer a#thumbnail[href*="watch"]`)
        if (!items.length) return true
        const chosenItem = items[parseInt(Math.floor(Math.random() * items.length))]
        if (!chosenItem) return true
        const nicheHrefSP = new URLSearchParams(chosenItem.href.split('?')[1])
        if (isClicked) return true
        isClicked = true
        changeAct(`https://www.youtube.com/watch?v=${nicheHrefSP.get('v')}`, 'niche', data)
    } else if (document.URL.includes('watch?v=')) {
        if (document.URL.includes(vid)) return true
        const wantedVideo = document.querySelector(`ytd-compact-video-renderer a#thumbnail[href*="${vid}"]`)
        const cv = document.querySelectorAll(`ytd-compact-video-renderer a#thumbnail`)
        if (isClicked) return true
        isClicked = true
        if (!wantedVideo) windowOpen(`https://www.youtube.com/watch?v=${vid}`, data)
        else wantedVideo.click()
    }
    return true
}
async function emulateEndscreen(vid, data) {
    if (document.URL.includes(vid)) return true
    const vd = document.querySelector('.video-stream.html5-main-video')
    if (!vd) {
        await sleep(1000)
        await emulateEndscreen(vid, data)
        return
    }
    vd.pause()
    vd.currentTime = vd.duration - 5
    await sleep(1500)
    const item = document.querySelector(`.ytp-ce-element.ytp-ce-video a[href*="${vid}"]`)
    if (isClicked) return true
    isClicked = true
    if (!item) windowOpen(`https://www.youtube.com/watch?v=${vid}`, data)
    else item.click()
}


function selfObserverPlayer(documentNode, sub, pbr) {
    const observer = new MutationObserver(async function () {
        adFunction()
        await sleep(5000)
        await videoStreamFunction(pbr)
        await sleep(5000)
        await likeFunction()
        if (sub) await subFunction()
        await sleep(5000)
        await pretifyFunc()
    })
    const config = { subtree: true, childList: true, }
    observer.observe(documentNode, config);
}

async function pretifyFunc() {
    const chromeBottom = document.querySelector('.ytp-chrome-bottom>.ytp-chrome-controls')
    const topRow = document.querySelector('#top-row')
    const logoIcon = document.querySelector('#logo-icon')
    if (!chromeBottom || !topRow || !logoIcon) {
        await sleep(1000)
        await pretifyFunc()
        return
    }
    if (isPretified) return
    isPretified = true
    chromeBottom.remove()
    topRow.remove()
    logoIcon.querySelector('yt-icon-shape').remove()
    logoIcon.style.width = '50px'
    const imgElement = document.createElement('img')
    imgElement.setAttribute('src', "https://i.ibb.co/j43Cpj2/logo-circle.png")
    logoIcon.appendChild(imgElement)
    imgElement.style.height = '50px'
}

async function likeFunction() {
    const likeButton = document.querySelector("#segmented-like-button button")
    if (!likeButton) {
        await sleep(1000)
        await likeFunction()
        return
    }
    const isActive = likeButton.getAttribute('aria-pressed') === 'true'
    if (!isActive) {
        likeButton.click()
    }
}

async function subFunction() {
    const subButton = document.querySelector("#subscribe-button button")
    if (!subButton) {
        await sleep(1000)
        await subFunction()
        return
    }
    if (isSubed) return
    isSubed = true
    subButton.click()
    await sleep(200)
    const dialModal = document.querySelector('tp-yt-paper-dialog')
    if (dialModal) {
        dialModal.querySelectorAll('button')[1].click()
        await sleep(150)
        document.querySelector('yt-button-shape#subscribe-button-shape button').click()
    }
}

async function videoStreamFunction(pbr) {
    const vd = document.querySelector('.video-stream.html5-main-video')
    const menu = document.querySelector('.ytp-popup.ytp-settings-menu')
    const settBtn = document.querySelector('.ytp-button.ytp-settings-button')
    if (!menu || !vd || !settBtn) {
        await sleep(1000)
        await videoStreamFunction(pbr)
        return
    }
    if (isStreamed) return true
    isStreamed = true
    // document.querySelector('.ytp-play-button').click()
    vd.play()
    await sleep(500)
    const playback = [1, 1.25, 1.5, 1.75, 2].indexOf(pbr) + 3
    vd.volume = 0
    vd.currentTime = 0
    settBtn.click()
    await sleep(500)
    const menuitems = menu.querySelectorAll('.ytp-menuitem[role="menuitem"]')
    menuitems[0].click()
    await sleep(500)
    menu.querySelectorAll('.ytp-menuitem')[playback].click()
    menuitems[menuitems.length-1].click()
    await sleep(500)
    const qualityItems = menu.querySelectorAll('.ytp-menuitem')
    qualityItems[qualityItems.length-2].click()
}

function adFunction() {
    const largePlayBtn = document.querySelector(
        '.ytp-large-play-button.ytp-button'
    )
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

    if (largePlayBtn) videoDocument.currentTime = 0

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


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function changeAct(link, type, data) {
        data['link'] = link
        data['type'] = type
        chrome.runtime.sendMessage({type: 'act', data })
}
function windowOpen(link, data) {
    data['link'] = link
    data['type'] = 'video'
    chrome.runtime.sendMessage({type: 'window', data })
    window.open(link, '_self')
    
}

function encodeSearchQuery(str) {
    return encodeURIComponent(str.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ')).replaceAll('%20', '+')
}

if (document.URL.includes(HOSTNAME)) {
    const detectInterval = setInterval(() => {
        if (detectPlugin()) {
            clearInterval(detectInterval)
        }
    }, 1000 * .1)
}
