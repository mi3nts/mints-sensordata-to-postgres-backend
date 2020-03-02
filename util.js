/*
    util.js
    MINTS-BACKEND

    Utility functions
*/
const mailer = require('nodemailer')
const mcfg = require('./mconfig.js')

/*
    Generates the filepath for today's sensor data
*/
const getSensorDataToday = (sensor_id) => {
    // Get today's date object and break it up to form a date path
    var dateToday = new Date()
    let monthLead = (dateToday.getMonth() + 1) < 10 ? '0' : ''
    let datePath = dateToday.getFullYear() + '/' + monthLead + (dateToday.getMonth() + 1) + '/' + dateToday.getDate()

    // Generate the file path and file name
    let sensorDataFilePath = mcfg.SENSOR_DIRECTORY + sensor_id + '/' + datePath + '/'
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

const emailNotify = (message, priority) => {
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

    // create reusable transporter object using the default SMTP transport
    let transporter = mailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: "780dev@gmail.com",
            pass: "MXC708ASUS10"
        }
    });

    // send mail with defined transport object
    let info = transporter.sendMail({
        from: "780dev@gmail.com", 
        to: "780dev@gmail.com",
        subject: priorityHeader + "mints-backend-notification", 
        html: message 
    });

    console.log(getTimeHeader() + "An email has been sent regarding server status")
}

// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    getSensorDataToday,
    getTimeSensorHeader,
    getTimeHeader,
    emailNotify
}
