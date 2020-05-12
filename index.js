/*
    index.js
    MINTS-BACKEND

    Only for continuous backend services not user interaction.
    User interactable REST APIs are present for the purposes of debugging.
    
    Main script file to be called from terminal.
    Where it all comes together
*/
const process = require('process')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3000

const upd = require('./updates.js')
const updm = require('./updateMeta.js')
const schedule = require('node-schedule')

const mutil = require('./util.js')
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
        info: 'MINTS-BACKEND processing server for transferring sensor data from .csv files to postgreSQL database tables.' +
            'This server instance is only for continuous operations.'
    })
})

// REST API calls
// Call to update sensor data manually
app.get('/update', upd.updateSensorDataManual)          

// Call to update sensor metadata manually 
// This needs to be done if a new sensor is added or if any of the column 
//   headers in the .csv output changes position or name
app.get('/update_meta', updm.updateSensorMetadata)      

/*
    Routinely called "main" function for continuous operations
*/
schedule.scheduleJob('*/5 * * * * *', function(fireDate) {
    // Get today's date (day of the week number)
    var now = fireDate.getUTCDate()

    // ----- IMPORTANT -----
    // If its a new day when this update routine is called then reset
    //   the largest read for today's sensor data file
    // If its a new day and this is not called, there may be serious inaccuracies in the database
    if(now != today) {
        console.log(mutil.getTimeSensorHeader() + "Preparing to reset largest file size read (today: " + today + ", now: " + now + ")")
        updm.resetLargestReadToday()
        today = now
    }
    
    // Check for new sensor data and update the database
    upd.updateSensorData()
});

/*
    Where the script begins as soon as "node index.js" is run
*/
app.listen(port, () => {
    console.log(mutil.getTimeHeader() + 'Server running on port ' + port + '.')
    mutil.emailNotify(mutil.getTimeHeader() + "Sensor processing server has started on port " + port + ".", 1)
    updm.resetLargestReadToday()
    
    today = (new Date()).getUTCDate()
    updm.updateSensorMetadata()
})

/*
    Notify for "normal" exit even though none exists right now and exit
*/
process.on('exit', function () {
    mutil.emailNotifyForShutdown(mutil.getTimeHeader() + "Sensor processing server has stopped.", 0)
})

/*
    Notify for manual shutdown and exit
*/
process.on('SIGINT', function () {
    console.log(mutil.getTimeHeader() + 'Manual shutdown was performed.')
    mutil.emailNotifyForShutdown(mutil.getTimeHeader() + "Sensor processing server has been manually stopped.", 2)
});

/*
    Notify for uncaught exception and exit
*/
process.on('uncaughtException', function(err) {
    console.log(mutil.getTimeHeader() + "UNCAUGHT EXCEPTION: " + err.stack)
    mutil.emailNotify(mutil.getTimeHeader() + "UNCAUGHT EXCEPTION: " + err.message, 99)
});