/*
    index.js
    MINTS-DATA-INGESTION-BACKEND

    Only for continuous backend services not user interaction.
    User interactable REST APIs are present for the purposes of debugging.
    
    Main script file to be called from terminal.
    Where it all comes together
*/
const mqtt = require('mqtt')
const process = require('process')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3200

const upd = require('./updates.js')
const updh = require('./updatesHistorical.js')
const updm = require('./updateMeta.js')
const schedule = require('node-schedule')

const mutil = require('./util.js')
const mcfg = require('./mconfig.js')
const em = require('./emailNotify.js')

const mqttClient  = mqtt.connect(mcfg.MQTT_BROKER_ADDRESS, {
    clientId: 'mqttjs_mints_data_ingestion',
    username: mcfg.MQTT_USERNAME,
    password: mcfg.MQTT_PASS
})

var today
var terminatedAdminCommandError = false

// Important setup procedure (to allow JSON output and thus REST functionality)
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
app.get('/updateHistorical', updh.updateSensorDataHistorical)       

// Call to update sensor metadata manually 
// This needs to be done if a new sensor is added or if any of the column 
//   headers in the .csv output changes position or name
app.get('/update_meta', updm.updateSensorMetadata)     
app.get('/reset_read_count', updm.resetLargestReadToday)
app.get('/toggle_sensor/:sensor_id', updm.toggleSensorForPublic) 
app.get('/rename_sensor/:sensor_id/:sensor_name', updm.updateSensorName)
app.get('/add_email_sub/:email', em.addEmailSubscribers)

/*
    Routinely called "main" function for continuous operations
*/
schedule.scheduleJob('*/5 * * * * *', function(fireDate) {
    // Get today's date (day of the week number)
    var now = fireDate.getUTCDate()

    // ----- IMPORTANT -----
    // If its a new day when this update routine is called then reset
    //   the largest read for today's sensor data file
    // TEMPORARY: For now, new sensor data will not be fetched when the reset function is called due
    //            to a race condition where the read is reset asynchronously as the rest of the script
    //            tries to update the sensor data.
    // If its a new day and this is not done, there will be missing data
    if(now != today) {
        console.log(mutil.getTimeSensorHeader() + "Preparing to reset largest file size read (today: " + today + ", now: " + now + ")")
        em.emailNotify(mutil.getTimeHeader() + "It is now a new day in UTC time.", 1)
        updm.resetLargestReadToday()
        today = now
        // mutil.updateDateToday()
    }
    // Otherwise check for new sensor data and update the database
    else {
        upd.updateSensorData()
        em.updateEmailSubscribers()
    }
});

schedule.scheduleJob('0 0 0 * * 0', function(fireDate) {
    console.log(mutil.getTimeSensorHeader() + "Updating historical data")
    updh.updateSensorDataHistorical()
})

/*
    Where the script begins as soon as "node index.js" is run
*/
app.listen(port, () => {
    em.updateEmailSubscribers()
    console.log(mutil.getTimeHeader() + 'Server running on port ' + port + '.')
    em.emailNotify(mutil.getTimeHeader() + "Sensor data ingestion script has started on port " + port + "." +
        "Please note that any issues raised in the past before this message are <b>not</b> remembered." + 
        "You may recieve notifications if previous issues are still not resolved." +
        "You will not recieve notifications for resolved issues.", 1)
    updm.resetLargestReadToday()
    
    today = (new Date()).getUTCDate()
    updm.updateSensorMetadata()
})

// MQTT Operations currently disabled (not ready)
/*
    Subscribe to MQTT topic(s) upon connection established to broker
*/
/*
mqttClient.on('connect', function () {
    mqttClient.subscribe('sensordata', function (err) {
        if(err) {
            console.log(mutil.getTimeHeader() + "Failed to establish mqtt subscription")
        } else 
            console.log(mutil.getTimeHeader() + 'MQTT subscription established')
    })
})
*/

mqttClient.on('error', function (error) {
    console.log(mutil.getTimeHeader() + "Failed to establish mqtt connection: " + error.message)
})

/*
    Manage data received from MQTT respectively
*/
/*
mqttClient.on('message', function (topic, message) {
    if(topic.toString() == 'sensordata') {
        upd.updateSensorDataFromMQTT(message.toString())
    }
    if(topic.toString() == 'uncalibrated-sensordata') {
        upd.updateRawSensorDataFromMQTT(message.toString())
    }
})
*/

/*
    Notify for "normal" exit even though none exists right now and exit
*/
process.on('exit', function () {
    em.emailNotifyForShutdown(mutil.getTimeHeader() + "Sensor data processing server has stopped.", 0)
})

/*
    Notify for manual shutdown and exit
*/
process.on('SIGINT', function () {
    console.log(mutil.getTimeHeader() 
        + 'Manual script shutdown was performed. Either an update is being performed or changes are being made that require the script to be offline.')
    em.emailNotifyForShutdown(mutil.getTimeHeader() 
        + 'Manual script shutdown was performed. Either an update is being performed or changes are being made that require the script to be offline.', 2)
});
process.on('SIGTERM', function () {
    console.log(mutil.getTimeHeader() 
        + 'Manual script shutdown was performed. Either an update is being performed or changes are being made that require the script to be offline.')
    em.emailNotifyForShutdown(mutil.getTimeHeader() 
        + 'Manual script shutdown was performed. Either an update is being performed or changes are being made that require the script to be offline.', 2)
});
/*
    Notify for uncaught exception and exit
*/
process.on('uncaughtException', function(err) {
    let message = ""
    if(!terminatedAdminCommandError && err.message == "terminating connection due to administrator command") {
        message = "Processing task was interrupted, likely due to system restart."
        em.emailNotify(mutil.getTimeHeader() + message, 99)
        terminatedAdminCommandError = true
    } else if(terminatedAdminCommandError && err.message == "terminating connection due to administrator command") {
        console.log("An email was already sent about a terminated connection.")
    } else {
        message = "UNCAUGHT EXCEPTION: " + err.message
        em.emailNotify(mutil.getTimeHeader() + message, 99)
    }
    console.log(mutil.getTimeHeader() + "UNCAUGHT EXCEPTION: " + err.stack)
});