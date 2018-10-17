const fs = require('fs')
const path = require('path')

const addAll = (result) => console.log(result.reduce((prev, cur) => prev + cur))

let dir = path.join(__dirname, 'files')

fs.readdir(dir, (err, files) => {
    if (err) return console.error(err)

    let promises = files.map((file) => {
        return new Promise((resolve, reject) => {
            let fileDir = path.join(dir, file)
            fs.readFile(fileDir, { encoding: 'utf-8' }, (err, data) => {
                if (err) reject(err)
                let count = 0
                data.split(' ').map(word => word === 'of' ? count++ : null)
                resolve(count)
            })
        })
    })
    
    Promise.all(promises).then(result => addAll(result)).catch(err => console.error(err))
    Promise.race(promises).then(result => console.log(result)).catch(err => console.error(err))
})
