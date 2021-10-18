const path = require('path')
const fs = require('fs')
const { dataLoader, csv } = require('@unitybase/base')

// to fill more tables with more csv just expand this array!
const fileData = [
    {
        csvName: "req_depart.csv",
        metaName: "req_depart",
        columns: "name;postAddr;phoneNum",
        mainField: "name"
    }
]

const fillTables = (fileData, { connection: conn }) => {
    fileData.forEach(({ csvName, metaName, columns, mainField }) => {
            const fContent = fs.readFileSync(path.join(__dirname, csvName), { encoding: 'utf8' }).trim()
            if (!fContent) {
                throw new Error(`File ${csvName} is empty or not exist`)
            }
            const csvData = csv.parse(fContent)
            const splitColumns = columns.split(';')
            const mainFieldIndex = splitColumns.findIndex(field => field === mainField)
            const notExisted = csvData.filter(row => !conn.lookup(metaName, 'ID', conn.Repository(metaName).where(mainField, '=', row[mainFieldIndex]).ubql().whereList))
            const arrColumns = splitColumns.map((_, index) => index)
            console.info(`\t\tFill ${metaName} table from ${csvName}`)
            dataLoader.loadArrayData(conn, notExisted, metaName, splitColumns, arrColumns, 1000)
        }
    )
}

module.exports = function (session) {
    fillTables(fileData, session)
}



