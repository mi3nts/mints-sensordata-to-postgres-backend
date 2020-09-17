/*
    util.js
    MINTS-DATA-INGESTION-BACKEND

    Utility functions
*/
const process = require('process')
const mailer = require('nodemailer')
const mcfg = require('./mconfig.js')

// Tracking today's date recognized by this script for functions
/*
var dateToday = new Date()

const getDateToday = () => {
    return dateToday
}

const updateDateToday = () => {
    dateToday = new Date()
}
*/
/*
    Generates the filepath for today's sensor data
*/
const getSensorDataToday = (sensor_id) => {
    // Get today's date object and break it up to form a date path
    var dateToday = new Date()

    // Generate month number as 01 instead of 1
    let monthLead = (dateToday.getUTCMonth() + 1) < 10 ? '0' : ''
    let monthFull = monthLead + (dateToday.getUTCMonth() + 1)

    // Generate date number as 01 instead of 1
    let dayLead = (dateToday.getUTCDate() < 10) ? '0' : ''
    let dayFull = dayLead + dateToday.getUTCDate()

    // Redundant variable for readability and flexibility 
    //   (e.x. if year is formatted differently for reasons similar to the above)
    let yearFull = dateToday.getUTCFullYear()

    // Full date path for the sensor directory
    let datePath = yearFull + '/' + monthFull + '/' + dayFull

    // Generate the file path and file name
    let sensorDataFilePath = mcfg.SENSOR_DIRECTORY + sensor_id + '/' + datePath + '/'
    let sensorDataFilename = 'MINTS_' + sensor_id + '_calibrated_UTC_' + yearFull + '_' + monthFull + '_' + dayFull + '.csv'

    // Return combined file path and file name
    return sensorDataFilePath + sensorDataFilename
}

const getTimeSensorHeader = (sensor_id) => {
    return "[" + (new Date()) + ", " + sensor_id + "]: "
}

const getTimeHeader = () => {
    return "[" + (new Date()) + "]: " 
}

// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    //getDateToday,
    //updateDateToday,
    getSensorDataToday,
    getTimeSensorHeader,
    getTimeHeader
}
