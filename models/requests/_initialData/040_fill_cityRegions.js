module.exports = function (session) {
    const path = require('path')
    const fs = require('fs')
    const { dataLoader, csv, argv } = require('@unitybase/base')
    const conn = session.connection
    const fn = path.join(__dirname, '/req_cityRegions.csv')
    let fContent = fs.readFileSync(fn)
    if (!fContent) {
        throw new Error(`File ${fn} is empty or not exist`)
    }
    fContent = fContent.toString('utf8').trim()
    const csvData = csv.parse(fContent)
    // check existing records in the DB
    const notExisted = csvData.filter(
        (row) => !conn.lookup('req_cityRegion', 'ID',
            conn.Repository('req_cityRegion').where('name', '=', row[0]).ubql().whereList
        )
    )
    console.info('\t\tFill City Region field (req_cityRegion)')
    dataLoader.loadArrayData(conn, notExisted, 'req_cityRegion', 'name'.split(';'), [0], 1)
}