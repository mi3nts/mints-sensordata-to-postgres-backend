/*
    updatesMeta.js
    MINTS-BACKEND
    
    Reads the column header of today's sensor data and updates the sensor metadata table
      in postgre.
*/
const PSQL = require('pg').Pool
const fs = require('fs')

// Postgre connector object and connection information
const psql = new PSQL({
    user: 'vmadmin780',
    host: 'localhost',
    database: 'mints',
    password: '2wire609',
    port: 5432
})

/*
    Opens the directory ../sensorData and inserts a row for each sensor ID folder if it 
      doesn't already exist in the postgre database
*/
const updateSensorMetadata = (request, response) => {
    fs.readdir('sensorData', function(error, files) {
        if(error) console.log(error)
        else {
            for(var i = 0; i < files.length; i++) {
                const sensor_id = files[i]
                psql.query("INSERT INTO sensor_meta(sensor_id) VALUES " + "(\'" + sensor_id + "\')" + " ON CONFLICT (sensor_id) DO NOTHING;",
                    (error, res) => {
                        updateColOffsets(response, sensor_id)
                    }
                )
            }
        }
    })
    response.json({
        message: "Results are processing asynchronously"
    })
}

/*
    Finds the positions of the column headers to look for and updates them
*/
function updateColOffsets(response, sensor_id) {
    var dateToday = new Date()
    let monthLead = (dateToday.getMonth() + 1) < 10 ? '0' : ''
    let datePath = dateToday.getFullYear() + '/' + monthLead + (dateToday.getMonth() + 1) + '/' + dateToday.getDate()

    //////////
    // For testing only - Comment out when used in production
    const fileName = 'sensorData/' + sensor_id + '/2020/01/31/MINTS_' + sensor_id + '_calibrated_UTC_2020_01_31.csv'

    // Uncomment when used in production
    // Gets the sensor data for today
    /*
    const fileName = 'sensorData/' 
        // Main sensor path
        + sensor_id + '/' + datePath 
        // File itself
        + '/MINTS_' + sensor_id + '_calibrated_UTC_' + dateToday.getFullYear() + '_' + monthLead + (dateToday.getMonth() + 1) + '_' + dateToday.getDate() + '.csv'
    //*/
    //////////

    fs.stat(fileName, function (error, stat) {
        if(error) console.log(error)
        else {
            const fileSize = stat.size
            fs.open(fileName, 'r', function (error, fd) {
                if(error) console.log(error)
                else {
                    var fileBuffer = Buffer.alloc(fileSize)     // Allocate buffer based on the number of bytes we'll read
                    fs.read(fd, fileBuffer, 0, fileSize, 0, function(error, bytesRead, buffer) {
                        // Every single line in the file, although we are only focusing on one line only
                        var fileLines = fileBuffer.toString().split('\n')                   

                        // Finding the column index for the data we want
                        var dataHeaders = fileLines[0].split(',')
                        var dataOffsets = []

                        // Mark the data column positions
                        for(var i = 0; i < dataHeaders.length; i++) {
                            dataOffsets[dataHeaders[i]] = i
                        }

                        var updateQuery = "UPDATE sensor_meta SET " 
                            + "col_offset_pm1 = $1, col_offset_pm2_5 = $2, col_offset_pm10 = $3 "
                            + "WHERE sensor_id = $4;"
                        
                        psql.query(updateQuery, [dataOffsets['PM1'], dataOffsets['PM2_5'], dataOffsets['PM10'], sensor_id], (err, res) => {
                            console.log("Finished updating sensor metadata.")
                        })
                    })
                }
            })
        }
    })
}

// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    updateSensorMetadata
}