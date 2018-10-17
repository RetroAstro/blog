const fs = require('fs')
const path = require('path')
const request = require('request')
const cheerio = require('cheerio')

const isError = (err, res) => (err || res.statusCode !== 200) ? true : false

const downloadImages = function (arr) {
    let promises = arr.map((url) => {
        let imgName = url.split('/').pop()
        let imgPath = path.join(__dirname, `images/${imgName}`)
        return new Promise((resolve) => {
            let reqStream = request(url)
            reqStream.pipe(fs.createWriteStream(imgPath))
            reqStream.on('close', () => resolve())
        })
    })
    Promise.all(promises).then(() => console.log('Download finished.'))
}

let page = 1

request({
    url: `http://www.zimuxia.cn/${encodeURIComponent('我们的作品')}?set=${page}`,
    method: 'GET'
}, (err, res, data) => {
    if (isError(err, res)) return console.log('Request failed.')
    let $ = cheerio.load(data)
    let arr = []
    $('.pg-page-wrapper img').each((i, el) => {
        let imgUrl = $(el).attr('data-cfsrc')
        arr.push(imgUrl)
    })
    downloadImages(arr)
})

