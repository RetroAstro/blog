const fs = require('fs')
const path = require('path')
const request = require('request')
const cheerio = require('cheerio')

const target = `http://www.zimuxia.cn/${encodeURIComponent('我们的作品')}`

const isError = (err, res) => (err || res.statusCode !== 200) ? true : false

const getImgUrls = function (pages) {
    return new Promise((resolve) => {
        let limit = 5, number = 0, imgUrls = []
        const recursive = async function () {
            pages = pages - limit
            limit = pages >= 0 ? limit : (pages + limit)
            let arr = []
            for (let i = 1; i <=limit; i++) {
                arr.push(
                    new Promise((resolve) => {
                        request(target + `?set=${number++}`, (err, res, data) => {
                            if (isError(err, res)) return console.log('Request failed.')
                            let $ = cheerio.load(data)
                            $('.pg-page-wrapper img').each((i, el) => {
                                let imgUrl = $(el).attr('data-cfsrc')
                                imgUrls.push(imgUrl)
                                resolve()
                            })
                        })
                    })
                )
            }
            await Promise.all(arr)
            if (limit === 5) return recursive()
            resolve(imgUrls)
        }
        recursive()
    })
}

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

request({
    url: target,
    method: 'GET'
}, (err, res, data) => {
    if (isError(err, res)) return console.log('Request failed.')
    let $ = cheerio.load(data)
    let pageNum = $('.pg-pagination li').length
    getImgUrls(pageNum)
    .then((result) => {
        // downloadImages(result)
    })
})

