
const DELAY = 10
const CLEARED_CASH_DELAY = 10 * 60
const SILENCE_DELAY = 5 * 60
const MEDIA_DELAY = 5

const CLIENT_URL = 'https://watchmachine.win'
const API_URL = 'https://watchmachine.onrender.com'
const HOSTNAME = API_URL.split('://')[1].split('/')[0].split('.').slice(-2)[0]

const breakAll = () => {
    chrome.storage.local.get(null, function(res) {
        const tabs = Object.keys(res).map((tab) => parseInt(tab))
        chrome.tabs.remove(tabs, function() {
            chrome.storage.local.clear()
        })
    })
}

const closeTabs = (windowId, tabId) => {
    chrome.tabs.query({ windowId: parseInt(windowId) }, function(tabs) {
        tabs.forEach(function(tab) {
            if (tab.id !== parseInt(tabId)) {
                console.log(windowId, tabId)
                chrome.tabs.remove(tab.id)
            }
        })
    })
}

const removeSession = (tid) => {
    chrome.storage.local.remove([tid], function() {
        chrome.tabs.get(parseInt(tid), function(tab) {
            if (tab) chrome.tabs.remove(parseInt(tid))
        })
    })
}

const updateTab = (tid, vid, source) => {
    chrome.tabs.update(parseInt(tid), {url: source})
    setTimeout(() => {
        chrome.tabs.sendMessage(parseInt(tid), {type: 'open', data: {vid}})
    }, MEDIA_DELAY * 1000)
}

const fetchVideo = async (sid, tabId) => {
    try {
        const res = await fetch(API_URL + '/plugin/yt/', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "wm-sid": sid
            },
        })
        const data = await res.json()
        if (data.success) {
            return {success: true, data: {videoId: data.info.videoId, source: data.info.source}}
        } else {
            return {success: false}
        }
    } catch {
        return {success: false}
    }
    // .then((res) => res.json())
    // .then((data) => {
    //     if (data.success) {

    //         // chrome.storage.local.set({videoId: data.info.videoId, source: data.info.source}, function() {
    //         //     updateTab(tabId, data.info.videoId, data.info.source)
    //         // })
    //     }
    //     else {
    //         // removeSession(tabId)
    //     }
    // })
    // .catch(() => {
    //     // removeSession(tabId)
    // })
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

const continueSession = async (sid, tid, wid, start=false) => {
    clearCash()
    const result = await fetchVideo(sid, tid)
    if (!result.success) removeSession(tid)
    const storageObj = {}
    storageObj[tid] = {
        sid, wid,
        videoId: result.data.videoId,
        source: result.data.source,
        packages: []
    }
    if (start) {
        chrome.storage.local.set(storageObj, function() {
            updateTab(tid, result.data.videoId, result.data.source)
        })
    } else {
        chrome.storage.local.remove([tid], function() {
            chrome.storage.local.set(storageObj, function() {
                updateTab(tid, result.data.videoId, result.data.source)
            })
        })
    }
    setTimeout(() => closeTabs(wid, tid), 1000)
}

const getGroupedData = (packages) => {
    const groupedData = packages.reduce((result, object) => {
        if (!result[object.type]) {
          result[object.type] = []
        }
        result[object.type].push(object)
        return result
    }, {})
    return groupedData
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

            if (hostname === HOSTNAME && type === 'start') {
                chrome.windows.create({url: 'https://youtube.com/', state: 'maximized'}, function(window) {
                    const windowId = window.id
                    const tabId = window.tabs[0].id
                    continueSession(params.get('sid'), tabId.toString(), windowId.toString(), true)
                })
            }
            else if(hostname === HOSTNAME && type === 'break') {
                chrome.storage.local.get(null, function(res) {
                    const tabToRemove = Object.keys(res).find((key) => res[key].sid === params.get('sid'))
                    if (tabToRemove) removeSession(tabToRemove)
                })
            }
            else if (hostname === 'youtube') {
                chrome.storage.local.get(null, function(res) {
                    if (type === 'playback' && params.get('euri') === CLIENT_URL + '/') {
                        fetch(API_URL + '/plugin/yt', {
                            method: 'POST',
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({params: paramsSTR})
                        })
                        .finally(() => {
                            chrome.tabs.sendMessage(parseInt(tabIdSTR), {type: 'load'})
                        })
                    } else if (!!res[tabIdSTR] && type.includes('unavailable_video')) {
                        continueSession(res[tabIdSTR].sid, tabIdSTR, res[tabIdSTR].wid)
                    } else if (!!res[tabIdSTR]) {
                        const request = {type, params: paramsSTR, timestamp: Date.now()}
                        const obj = res[tabIdSTR]
                        const requests = obj.packages
                        requests.push(request)
                        obj['packages'] = requests
                        const storageObj = {}
                        storageObj[tabIdSTR] = obj
                        chrome.storage.local.set(storageObj, function() {
                            if (params.get('vps') && params.get('vps').split(':').slice(-1)[0] === 'EN' && params.get('el') === 'detailpage') {
                                chrome.tabs.update(parseInt(tabIdSTR), {url: 'https://youtube.com/'})
                                const groupedData = getGroupedData(obj.packages)
                                Object.keys(groupedData).forEach((gType) => {
                                    fetch(API_URL + '/plugin/yt/' + gType, {
                                        method: 'PUT',
                                        headers: { "Content-Type": "application/json", "wm-sid": obj.sid },
                                        body: JSON.stringify({packages: groupedData[gType]})
                                    })
                                    .catch(null)
                                })
                                setTimeout(() => continueSession(obj.sid, tabIdSTR, obj.wid), DELAY * 1000)
                            } else if (params.get('idpj') && params.get('ldpj') && params.get('el') === 'adunit' && params.get('st') === '0') {
                                updateTab(tabIdSTR, res[tabIdSTR].videoId, res[tabIdSTR].source)
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
    { urls: [API_URL + "/*", "https://*.youtube.com/*"] }
)
