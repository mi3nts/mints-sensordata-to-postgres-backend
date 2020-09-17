/*
    emailNotify.js
    MINTS-DATA-INGESTION-BACKEND
    
    Handling all email related functionality for notifying the status of sensors/script health
*/
const PSQL = require('pg').Pool
const pgcon = require('./postgrescon.js')

const process = require('process')
const mailer = require('nodemailer')
const mutil = require('./util.js')
const mcfg = require('./mconfig.js')

// Postgre connector object and connection information
const psql = new PSQL({
    connectionString: pgcon.PSQL_LOGIN
})

/*
    Adds an email to the list of emails to notify
*/
const addEmailSubscribers = (request, response) => {
    const email = request.params.email
    if(email.includes("@") && email.includes(".")) {
        const insertQuery = "INSERT INTO notify_email_list(email, added) VALUES ($1, $2);"
        const insertParams = [email, (new Date())]
        psql.query(insertQuery, insertParams, (err, res) => {
            if(err) {
                console.log(mutil.getTimeHeader() + "ERROR: Unable to add " + email + " to the notifications mailing list due to a database error.")
                response.json({
                    status: 500,
                    message: mutil.getTimeHeader() + "ERROR: Unable to add " + email + " to the notifications mailing list due to a database error.",
                    db_error: err.message 
                })
            } else {
                console.log(mutil.getTimeHeader() + "Succesfully added " + email + " to notifications mailing list.")
                response.json({
                    status: 200,
                    message: mutil.getTimeHeader() + "Succesfully added " + email + " to notifications mailing list."
                })
            }
        })
    } 
    // Error for imporper email format
    else {
        console.log(mutil.getTimeHeader() + "ERROR: Unable to add " + email + " to the notifications mailing list due to a format issue (missing @ or .)")
        response.json({
            status: 500,
            message: mutil.getTimeHeader() + "ERROR: Unable to add " + email + " to the notifications mailing list due to a format issue (missing @ or .)"
        })
    }
}

/*
    Updates the local list of email subscribers for the notification system
*/
const updateEmailSubscribers = function () {
    const query = "SELECT email FROM notify_email_list;"
    psql.query(query, (err, res) => {
        if(err) {
            console.log(mutil.getTimeHeader() + "ERROR: Unable to retreive email list from database." + err.message)
        } else {
            var email_list = ""
            for(var i = 0; i < res.rows.length; i++) {
                if(i != res.rows.length - 1) {
                    email_list += res.rows[i].email.trim() + ","
                } else {
                    email_list += res.rows[i].email.trim()
                }
            }
            if(mcfg.email_subscribers != email_list) {
                mcfg.email_subscribers = email_list
                console.log(mutil.getTimeHeader() + "Updated list of email subscribers from database.")
            }
        }
    })
}

/*
    Used to send general email notifications of events that occur while this script is running.
*/
const emailNotify = (message, priority) => {
    if(!mcfg.EMAIL_NOTIFICATION_ENABLE) {
        console.log(mutil.getTimeHeader() + "Email notifications are disabled! No email was sent.")
        return;
    }

    var priorityHeader = ""
    switch (priority) {
        case 0:
            priorityHeader = "[Resolved] "
            break;
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
        to: mcfg.EMAIL_NOTIFICATION_ADDRESS + "," + mcfg.email_subscribers,
        subject: priorityHeader + "mints-backend-notification", 
        html: message 
    }, function (err, info) {
        if(err) console.log(mutil.getTimeHeader() + "Failed to send email notification. Error: " + err.message)
        else console.log(mutil.getTimeHeader() + "An email has been sent regarding server status")
    });
}

/*
    Used to send an email notifying of a script shutdown event
*/
const emailNotifyForShutdown = (message, type) => {
    if(!mcfg.EMAIL_NOTIFICATION_ENABLE) {
        console.log(mutil.getTimeHeader() + "Email notifications are disabled! No email was sent.")
        process.exit(type)
    }

    var typeHeader = "[Shutdown] "

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
        if(err) console.log(mutil.getTimeHeader() + "Failed to send email notification. Error: " + err.message)
        else 
            console.log(mutil.getTimeHeader() + "An email has been sent regarding server status")

        process.exit(type)
    });
}

module.exports = {
    addEmailSubscribers,
    updateEmailSubscribers,
    emailNotify,
    emailNotifyForShutdown
}