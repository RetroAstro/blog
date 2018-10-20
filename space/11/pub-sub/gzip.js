const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const gzipFile = function (file) {
    let dir = path.join(__dirname, 'watch')
    fs.readdir(dir, (err, files) => {
        if (err) console.error(err)
        files.map((filename) => {
            let watchFile = path.join(dir, filename)
            fs.stat(watchFile, (err, stats) => {
                if (err) console.error(err)
                if (stats.isFile() && file === filename) {
                    let doneFile = path.join(__dirname, `done/${file}.gz`)
                    fs.createReadStream(watchFile)
                    .pipe(zlib.createGzip())
                    .pipe(fs.createWriteStream(doneFile))
                }
            })
        })
    })
}

module.exports = {
    gzipFile: gzipFile
}

