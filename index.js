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
const schedule = require('node-schedule');

var today

// Important setup procedure (probably to allow JSON returns and thus REST functionality)
app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true
    })
)
// CORS configuration
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (request, response) => {
    response.json({
        info: 'MINTS-BACKEND processing server for transferring sensor data from .csv files to postgreSQL database tables'
    })
})

// REST API calls
app.get('/data_pm1', db.getSensorData)
app.get('/data_pm2_5', db.getSensorData)
app.get('/data_pm10', db.getSensorData)

app.get('/sensor_id_list', db.getListOfSensorIDs)
app.get('/latest', db.getLatestSensorData)

app.get('/update', upd.updateSensorDataManual)          // Call to update sensor data manually

// Call to update sensor metadata. 
// This needs to be done if a new sensor is added or if any of the column 
//   headers in the .csv output changes position or name
app.get('/update_meta', updm.updateSensorMetadata)      

/*
    Routinely called "main" function for continuous operations
*/
schedule.scheduleJob('*/5 * * * * *', function(fireDate) {
    // Get today's date (day of the week number)
    var now = fireDate.getDay()

    // ----- IMPORTANT -----
    // If its a new day when this update routine is called then reset
    //   the largest read for today's sensor data file
    // If its a new day and this is not called, there may be serious inaccuracies in the database
    if(now != today) {
        updm.resetLargestReadToday()
        now = today
    }
    
    // Check for new sensor data and update the database
    upd.updateSensorData()
});

/*
    Where the script begins as soon as "node index.js" is run
*/
app.listen(port, () => {
    console.log('Server running on port ' + port + '.')
    updm.resetLargestReadToday()
    
    today = (new Date()).getDay()
    updm.updateSensorMetadata()
})

