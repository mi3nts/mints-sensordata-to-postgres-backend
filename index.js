/*
    index.js
    MINTS-BACKEND

    Main script file to be called from terminal.
    Where it all comes together
*/
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

const db = require('./queries.js')
const upd = require('./updates.js')
const updm = require('./updateMeta.js')

var today

// Important setup procedure (probably to allow JSON returns and thus REST functionality)
app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true
    })
)

app.get('/', (request, response) => {
    response.json({
        info: 'MINTS-BACKEND processing server for transferring sensor data from .csv files to postgreSQL database tables'
    })
})

// REST API calls
app.get('/data_pm1', db.getSensorData)
app.get('/data_pm2_5', db.getSensorData)
app.get('/data_pm10', db.getSensorData)

app.get('/update', upd.updateSensorDataManual)          // Call to update sensor data manually

// Call to update sensor metadata. 
// This needs to be done if a new sensor is added or if any of the column 
//   headers in the .csv output changes position or name
app.get('/update_meta', updm.updateSensorMetadata)      

/*
    Where the script begins as soon as "node index.js" is run
*/
app.listen(port, () => {
    console.log('Server running on port ' + 3000 + '.')
    today = (new Date()).getDay()
    // Update database with new sensor data every 5 seconds
    setInterval(mintsUpdateRoutine(), 5000)
})

/*
    Routinely called "main" function for continuous operations
*/
function mintsUpdateRoutine() {
    // Get today's date (day of the week number)
    var now = (new Date()).getDay()

    // ----- IMPORTANT -----
    // If its a new day when this update routine is called then reset
    //   the largest read for today's sensor data file
    // If its a new day and this is not called, there may be serious inaccuracies in the database
    if(now != today)
        updm.resetLargestReadToday
    
    // Check for new sensor data and update the database
    upd.updateSensorData
}