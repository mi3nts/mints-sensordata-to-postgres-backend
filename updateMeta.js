/*
    updatesMeta.js
    MINTS-BACKEND
    
    Reads the column header of today's sensor data and updates the sensor metadata table
      in postgre.
*/
const PSQL = require('pg').Pool
const fs = require('fs')
const mutil = require('./util.js')

// Postgre connector object and connection information
const psql = new PSQL({
    user: 'vmadmin780',
    host: 'localhost',
    database: 'mints',
    password: '2wire609',
    port: 5432
})

///////////////////////////////////////////////////////////
// -- Begin modification area -- //////////////////////////

// Add more data columns here
const dataColumns = [
    "PM1",
    "PM2_5",
    "PM10",
    "Latitude",
    "Longitude",
    "Humidity",
    "Temperature"
]

// -- End modification area -- ////////////////////////////
///////////////////////////////////////////////////////////

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

    // Setting the filename to open
    // For testing only - Comment out when used in production
    const fileName = 'sensorData/' + sensor_id + '/2020/01/31/MINTS_' + sensor_id + '_calibrated_UTC_2020_01_31.csv'

    // Uncomment when ready
    //const fileName = mutil.getSensorDataToday(sensor_id)

    fs.stat(fileName, function (error, stat) {
        if(error) console.log(error)
        else {
            const fileSize = stat.size
            fs.open(fileName, 'r', function (error, fd) {
                if(error) console.log(error)
                else {
                    // Allocate buffer based on the number of bytes we'll read
                    var fileBuffer = Buffer.alloc(fileSize)   

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

                        // Create dynamic, parameterized query that will set the respective column offset values
                        //   based on what is specified in the dataColumns array
                        var updateMetaQuery = "UPDATE sensor_meta SET "
                        var paramNum = 1
                        for(var i = 0; i < dataColumns.length; i++, paramNum++) {
                            if(i == dataColumns.length - 1)
                                updateMetaQuery += "col_offset_" + dataColumns[i].toLowerCase() + " = $" + paramNum + " "
                            else updateMetaQuery += "col_offset_" + dataColumns[i].toLowerCase() + " = $" + paramNum + ", "
                        }
                        updateMetaQuery += "WHERE sensor_id = $" + paramNum
                        
                        // Create the respective parameters array to match with the parameterized query created
                        //   above
                        var updateMetaQueryParams = []
                        for(var i = 0; i < dataColumns.length; i++) {
                            updateMetaQueryParams.push(dataOffsets[dataColumns[i]])    
                        }
                        updateMetaQueryParams.push(sensor_id)
                        
                        // Update the sensor metadata
                        psql.query(updateMetaQuery, updateMetaQueryParams, (err, res) => {
                            console.log("[" + (new Date()) + "]: Finished updating sensor metadata for sensor " + sensor_id)
                        })
                    })
                }
            })
        }
    })
}

const resetLargestReadToday = function () {
    psql.query("UPDATE sensor_meta SET largest_read = 0;",
        (error, res) => {
            if(error)
                console.log("ERROR: Unable to reset largest read for today: " + error.message)
        }
    )
}

// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    updateSensorMetadata,
    resetLargestReadToday
}