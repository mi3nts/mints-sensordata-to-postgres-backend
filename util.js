/*
    util.js
    MINTS-BACKEND

    Utility functions
*/
const process = require('process')
const mailer = require('nodemailer')
const mcfg = require('./mconfig.js')

// Tracking today's date recognized by this script for functions
var dateToday = new Date()

const getDateToday = () => {
    return dateToday
}

const updateDateToday = () => {
    dateToday = new Date()
}
/*
    Generates the filepath for today's sensor data
*/
const getSensorDataToday = (sensor_id) => {
    // Get today's date object and break it up to form a date path
    //var dateToday = new Date()

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

const emailNotify = (message, priority) => {
    if(!mcfg.EMAIL_NOTIFICATION_ENABLE) {
        console.log(getTimeHeader() + "Email notifications are disabled! No email was sent.")
        return;
    }

    var priorityHeader = ""
    switch (priority) {
        case 1:
            priorityHeader = "[Info] "
            break;
        case 2:
            priorityHeader = "[Warning] "
            break;
        case 3:
            priorityHeader = "[Severe] "
            break;
        default:
            break;
    }

    // Create reusable transporter object using the default SMTP transport
    let transporter = mailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: mcfg.EMAIL_NOTIFICATION_ADDRESS,
            pass: mcfg.EMAIL_NOTIFICATION_PASS
        }
    });

    // Send mail with defined transport object
    let info = transporter.sendMail({
        from: mcfg.EMAIL_NOTIFICATION_ADDRESS, 
        to: mcfg.EMAIL_NOTIFICATION_ADDRESS,
        subject: priorityHeader + "mints-backend-notification", 
        html: message 
    }, function (err, info) {
        if(err) console.log(getTimeHeader() + "Failed to send email notification. Error: " + err.message)
        else console.log(getTimeHeader() + "An email has been sent regarding server status")
    });
}

const emailNotifyForShutdown = (message, type) => {
    if(!mcfg.EMAIL_NOTIFICATION_ENABLE) {
        console.log(getTimeHeader() + "Email notifications are disabled! No email was sent.")
        process.exit(type)
    }

    var typeHeader = "[Shutdown] "
    if(type == 99) {
        typeHeader = "[Shutdown-Severe] "
    }

    // Create reusable transporter object using the default SMTP transport
    let transporter = mailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: mcfg.EMAIL_NOTIFICATION_ADDRESS,
            pass: mcfg.EMAIL_NOTIFICATION_PASS
        }
    });

    // Send mail with defined transport object
    transporter.sendMail({
        from: mcfg.EMAIL_NOTIFICATION_ADDRESS, 
        to: mcfg.EMAIL_NOTIFICATION_ADDRESS,
        subject: typeHeader + "mints-backend-notification", 
        html: message 
    }, function (err, info) {
        if(err) console.log(getTimeHeader() + "Failed to send email notification. Error: " + err.message)
        else 
            console.log(getTimeHeader() + "An email has been sent regarding server status")

        process.exit(type)
    });
}

// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    getDateToday,
    updateDateToday,
    getSensorDataToday,
    getTimeSensorHeader,
    getTimeHeader,
    emailNotify,
    emailNotifyForShutdown
}
