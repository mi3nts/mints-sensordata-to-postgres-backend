const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

const db = require('./queries.js')
const upd = require('./updates.js')
const updm = require('./updateMeta.js')

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true
    })
)

app.get('/', (request, response) => {
    response.json({
        info: 'Node.js, Express, and Postgres API',
        requestData: request.url
    })
})

app.get('/update', upd.updateSensorDataManual)
app.get('/data_pm1', db.getSensorData)
app.get('/data_pm2_5', db.getSensorData)
app.get('/data_pm10', db.getSensorData)

app.get('/update_meta', updm.updateSensorMetadata)

app.listen(port, () => {
    console.log('App running on port ' + 3000 + '.')
    
    // Update sensor metadata every 8 hours
    setInterval(updm.updateSensorMetadata, 2880000)

    // Update database with new sensor data every 30 minutes
    setInterval(upd.updateSensorDataManual, 180000)
})