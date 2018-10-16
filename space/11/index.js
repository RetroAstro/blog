const fs = require('fs')
const path = require('path')

const addAll = () => console.log(countArray.reduce((prev, cur) => prev + cur))

let dir = path.join(__dirname, 'files')

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
            taskCount === taskLength ? addAll() : null
        })
    })
})
