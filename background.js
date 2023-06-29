
const DELAY = 10
const CLEARED_CASH_DELAY = 10 * 60
const SILENCE_DELAY = 5 * 60
const MEDIA_DELAY = 5

const breakAll = () => {
    chrome.storage.local.get(null, function(res) {
        const tabs = Object.keys(res).map((tab) => parseInt(tab))
        chrome.tabs.remove(tabs, function() {
            chrome.storage.local.clear()
        })
    })
}

const removeSession = (tid) => {
    chrome.storage.local.remove([tid], function() {
        chrome.tabs.remove(parseInt(tid))
    })
}

const updateTab = (tid, vid, source) => {
    chrome.tabs.update(parseInt(tid), {url: source})
    setTimeout(() => {
        chrome.tabs.sendMessage(parseInt(tid), {vid})
    }, MEDIA_DELAY * 1000)
}

const fetchVideo = (sid, tabId) => {
    fetch('https://watchmachine.onrender.com/plugin/yt/', {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "wm-sid": sid
        },
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.success) {
            updateTab(tabId, data.info.videoId, data.info.source)
        }
        else {
            removeSession(tabId)
        }
    })
    .catch(() => {
        removeSession(tabId)
    })
}

const clearCash = () => {
    const dateNow = Date.now()
    chrome.storage.local.get(null, function(res) {
        const expiredTabs = Object.keys(res).filter((tab) => {
            if (!res[tab].packages.slice(-1)[0]) return true
            const updateAt = res[tab].packages.slice(-1)[0].timestamp
            return (dateNow - updateAt) >= SILENCE_DELAY * 1000
        })
        if (!!expiredTabs.length) {
            chrome.storage.local.remove(expiredTabs)
        }
    })
}

const continueSession = (sid, tid, start=false) => {
    clearCash()
    const storageObj = {}
    storageObj[tid] = {
        sid,
        packages: []
    }
    if (start) {
        chrome.storage.local.set(storageObj, function() {
            fetchVideo(sid, tid)
        })
    } else {
        chrome.storage.local.remove([tid], function() {
            chrome.storage.local.set(storageObj, function() {
                fetchVideo(sid, tid)
            })
        })
    }
}

const init = (tab) => {
    try {
        const {url, tabId} = tab
        if (tabId <= 0) return
        const hostname = url.split('://')[1].split('/')[0].split('.').slice(-2)[0]
        const type = url.split('?')[0].split('/').slice(-1)[0]
        const paramsSTR = url.split('?')[1]
        const params = new URLSearchParams(paramsSTR)
        const tabIdSTR = tabId.toString()   

            if (hostname === 'onrender' && type === 'start') {
                continueSession(params.get('sid'), tabIdSTR, true)
            } else if (hostname === 'youtube') {
                chrome.storage.local.get(null, function(res) {
                    console.log(res)
                    if (type === 'playback' && params.get('euri') === 'https://watchmachine.win/') {
                        fetch('https://watchmachine.onrender.com/plugin/yt', {
                            method: 'POST',
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({params: paramsSTR})
                        })
                        .finally(() => chrome.tabs.reload())
                    } else if (!!res[tabIdSTR] && type.includes('unavailable_video')) {
                        continueSession(res[tabIdSTR].sid, tabIdSTR)
                    } else if (!!res[tabIdSTR]) {
                        const request = {type, params: paramsSTR, timestamp: Date.now()}
                        const obj = res[tabIdSTR]
                        const requests = obj.packages
                        requests.push(request)
                        obj['packages'] = requests
                        const storageObj = {}
                        storageObj[tabIdSTR] = obj
                        chrome.storage.local.set(storageObj, function() {
                            if (type === 'qoe' && params.get('vps') && params.get('vps').split(':').slice(-1)[0] === 'EN') {
                                const groupedData = obj.packages.reduce((result, object) => {
                                    if (!result[object.type]) {
                                      result[object.type] = []
                                    }
                                    result[object.type].push(object)
                                    return result
                                }, {})
                                Object.keys(groupedData).forEach((gType) => {
                                    fetch('https://watchmachine.onrender.com/plugin/yt/' + gType, {
                                        method: 'PUT',
                                        headers: { "Content-Type": "application/json", "wm-sid": obj.sid },
                                        body: JSON.stringify({packages: groupedData[gType]})
                                    })
                                    .catch(null)
                                })
                                setTimeout(() => continueSession(obj.sid, tabIdSTR), DELAY * 1000)
                            }
                        })
                    }
                })
            }
    } catch (e) {
        console.log(e)
    }
    
}

chrome.webRequest.onCompleted.addListener(
    init,
    { urls: ["https://watchmachine.onrender.com/*", "https://*.youtube.com/*"] }
)
