/*
    util.js
    MINTS-BACKEND

    Utility functions
*/

const mcfg = require('./mconfig.js')

/*
    Generates the filepath for today's sensor data
*/
const getSensorDataToday = (sensor_id) => {
    // Get today's date object and break it up to form a date path
    var dateToday = new Date()
    let monthLead = (dateToday.getMonth() + 1) < 10 ? '0' : ''
    let dayLead = (dateToday.getDate() < 10) ? '0' : ''
    let datePath = dateToday.getFullYear() + '/' + monthLead + (dateToday.getMonth() + 1) + '/' + dayLead + dateToday.getDate()

    // Generate the file path and file name
    let sensorDataFilePath = mcfg.SENSOR_DIRECTORY + sensor_id + '/' + datePath + '/'
    let sensorDataFilename = 'MINTS_' + sensor_id + '_calibrated_UTC_' + dateToday.getFullYear() + '_' + monthLead + (dateToday.getMonth() + 1) + '_' + dayLead + dateToday.getDate() + '.csv'

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
    getSensorDataToday,
    getTimeSensorHeader,
    getTimeHeader
}
