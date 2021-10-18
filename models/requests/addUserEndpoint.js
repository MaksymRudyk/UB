const UB = require('@unitybase/ub')
const App = require('@unitybase/ub').App
const querystring = require('querystring')

App.registerEndpoint('addUser', addUser, false)

function addUser (req, resp) {
    const { name, email, phone, website } = querystring.parse(req.parameters)
    const userStore = UB.DataStore('req_user')
    userStore.run('insert', {
        execParams:
            {
                name,
                email,
                phone,
                website
            }
    })
    resp.statusCode = 200
    resp.writeEnd('user addded')
}