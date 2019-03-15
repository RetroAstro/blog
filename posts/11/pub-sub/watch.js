const fs = require('fs')
const path = require('path')

const { gzipFile } = require('./gzip')
const { Listener } = require('./listener')

let listener = new Listener()

listener.on('gzip', (data) => gzipFile(data))

let dir = path.join(__dirname, 'watch')

let wait = true

fs.watch(dir, (event, filename) => {
    if (filename && event === 'change' && wait) {
        wait = false
        setTimeout(() => wait = true, 100)
        listener.emit('gzip', filename)
    }
})

