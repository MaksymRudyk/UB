const UB = require('@unitybase/ub')
const http = require('http')
const me = req_user
me.entity.addMethod('addUsers')

me.addUsers = function (ctx) {
    // send request
    const req = http.request({
        URL: 'https://jsonplaceholder.typicode.com/users',
        // host: host,
        // port: port,
        // path: path,
        method: 'GET',
        sendTimeout: 1000, receiveTimeout: 30000, connectTimeout: 1000,
        keepAlive: true,
        compressionEnable: true,
        headers: {} // {Authorization: 'Basic ' + 'QURNSU46MTIzNDU2'}
    })
    const resp = req.end()
    if (resp.statusCode !== 200) {
        ctx.mParams.result = false
        return
    }

    const userStore = UB.DataStore('req_user')
    // get data from response
    const userData = JSON.parse(resp.read('utf-8'))
    // insert data to db
    userData.forEach(user => {
        userStore.run('insert', {
            execParams:
                {
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    website: user.website
                }
        })
    })
    ctx.mParams.result = true
}