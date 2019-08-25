const fs = require('fs')
const path = require('path')
const request = require('request')
const cheerio = require('cheerio')

const target = `http://www.zimuxia.cn/${encodeURIComponent('我们的作品')}`

const isError = (err, res) => (err || res.statusCode !== 200) ? true : false

const getImgUrls = function (pages) {
    return new Promise((resolve) => {
        let limit = 8, number = 0, imgUrls = []
        const recursive = async function () {
            pages = pages - limit
            limit = pages >= 0 ? limit : (pages + limit)
            let arr = []
            for (let i = 1; i <= limit; i++) {
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
            if (limit === 8) return recursive()
            resolve(imgUrls)
        }
        recursive()
    })
}

const downloadImages = function (imgUrls) {
    console.log('\n Start to download images. \n')
    let limit = 5
    const recursive = async function () {
        limit = imgUrls.length - limit >= 0 ? limit : imgUrls.length
        let arr = imgUrls.splice(0, limit)
        let promises = arr.map((url) => {
            return new Promise((resolve) => {
                let imgName = url.split('/').pop()
                let imgPath = path.join(__dirname, `images/${imgName}`)
                request(url)
                .pipe(fs.createWriteStream(imgPath))
                .on('close', () => {
                    console.log(`${imgName} has been saved.`)
                    resolve()
                })
            })
        })
        await Promise.all(promises)
        if (imgUrls.length) return recursive()
        console.log('\n All images have been downloaded.')
    }
    recursive()
}

request({
    url: target,
    method: 'GET'
}, (err, res, data) => {
    if (isError(err, res)) return console.log('Request failed.')
    let $ = cheerio.load(data)
    let pageNum = $('.pg-pagination li').length
    console.log('Start to get image urls...')
    getImgUrls(pageNum)
    .then((result) => {
        console.log(`Finish getting image urls and the number of them is ${result.length}.`)
        downloadImages(result)
    })
})
