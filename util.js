/*
    util.js
    MINTS-BACKEND

    Utility functions
*/

/*
    Generates the filepath for today's sensor data
*/
const getSensorDataToday = (sensor_id) => {
    // Get today's date object and break it up to form a date path
    var dateToday = new Date()
    let monthLead = (dateToday.getMonth() + 1) < 10 ? '0' : ''
    let datePath = dateToday.getFullYear() + '/' + monthLead + (dateToday.getMonth() + 1) + '/' + dateToday.getDate()

    // Generate the file path and file name
    let sensorDataFilePath = 'sensorData/' + sensor_id + '/' + datePath + '/'
    let sensorDataFilename = 'MINTS_' + sensor_id + '_calibrated_UTC_' + dateToday.getFullYear() + '_' + monthLead + (dateToday.getMonth() + 1) + '_' + dateToday.getDate() + '.csv'

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