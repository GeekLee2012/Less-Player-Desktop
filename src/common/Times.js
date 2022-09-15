export const toMmss = (millis) => {
    let minutes = Math.floor(millis / 60000);
    let seconds = ((millis % 60000) / 1000).toFixed(0);
    if(seconds >= 60) { //toFixed()是否引起进位
        seconds = seconds - 60
        ++minutes
    }
    minutes = (minutes < 10 ? '0' : '') + minutes
    seconds = (seconds < 10 ? '0' : '') + seconds
    return minutes + ":" + seconds;
}

export const toMMssSSS = (millis) => {
    let minutes = Math.floor(millis / 60000);
    let fullSecs = ((millis % 60000) / 1000);
    let seconds = Math.floor(fullSecs);
    let millsecs = ((fullSecs - seconds) * 1000).toFixed(0);
    //console.log(fullSecs + ", " + seconds + ", " + millsecs)
    minutes = (minutes < 10 ? '0' : '') + minutes
    seconds = (seconds < 10 ? '0' : '') + seconds
    millsecs = (millsecs < 100 ? (millsecs < 10 ? '00' : '0') : '') + millsecs
    return minutes + ":" + seconds + "." + millsecs;
}

export const toYyyymmdd = (timestamp, sp) => {
    sp = sp || '-'
    const date = new Date(timestamp)
    const yyyy = date.getFullYear()
    let mm = (date.getMonth() + 1)
    mm = mm < 10 ? ('0' + mm) : mm
    let dd = date.getDate()
    dd = dd < 10 ? ('0' + dd) : dd
    return yyyy + sp + mm + sp + dd
}

export const toYmd = (timestamp, sp) => {
    sp = sp || '.'
    const date = new Date(timestamp)
    const yyyy = date.getFullYear()
    let m = (date.getMonth() + 1)
    let d = date.getDate()
    return yyyy + sp + m + sp + d
}

export const toYyyymmddHhMmSs = (timestamp, sp) => {
    sp = sp || '-'
    const date = new Date(timestamp)
    const yyyy = date.getFullYear()
    let mm = (date.getMonth() + 1)
    mm = mm < 10 ? ('0' + mm) : mm
    let dd = date.getDate()
    dd = dd < 10 ? ('0' + dd) : dd
    let Hh = date.getHours()
    Hh = Hh < 10 ? ('0' + Hh) : Hh
    let Mm = date.getMinutes()
    Mm = Mm < 10 ? ('0' + Mm) : Mm
    let Ss = date.getSeconds()
    Ss = Ss < 10 ? ('0' + Ss) : Ss
    return yyyy + sp + mm + sp + dd + " " 
        + Hh + ":" + Mm + ":" + Ss
}
