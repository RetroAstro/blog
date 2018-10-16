const fs = require('fs')
const path = require('path')

const addAll = (result) => console.log(result.reduce((prev, cur) => prev + cur))

let dir = path.join(__dirname, 'files')

// callback
let taskLength, taskCount = 0, countArray = []

fs.readdir(dir, (err, files) => {
    if (err) return console.error(err)
    taskLength = files.length
    files.map((file) => {
        let fileDir = path.join(dir, file)
        fs.readFile(fileDir, { encoding: 'utf-8' }, (err, data) => {
            if (err) return console.error(err)
            let count = 0
            data.split(' ').map(word => word === 'of' ? count++ : null)
            countArray.push(count)
            taskCount++
            taskCount === taskLength ? addAll(countArray) : null
        })
    })
})

// promise 
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
    Promise.all(promises).then(result => addAll(result))
})
