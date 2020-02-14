/*
    updates.js
    MINTS-BACKEND
    
    Reads sensor data from .csv files and updates the PostgreSQL database with new data.
    Most operations performed here are asynchronous.
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

// Data columns to look for and update
const dataToUpdate = [
    'data_pm2_5', 
    'data_pm1', 
    'data_pm10'
    // Add additional entries if collecting more data
]

/*
    Manually update sensor data on REST API call
*/
const updateSensorDataManual = (request, response) => {
    querySensorList()

   // Output json response
   response.json({
       message: "Results are processing asynchronously. Use /data to get sensor data in a .json format"
   })
}

/*
    Updates sensor data
*/
const updateSensorData = function () {
    querySensorList()
}

/*
    Retrieves the list of sensor_ids and prepares to send it to 
      processSensors() 
    
    **Make sure to run updateMetadata first.
*/
function querySensorList() {
    // Queries sensor_meta for list of sensor_ids
    psql.query("SELECT sensor_id FROM sensor_meta", (error, results) => {
        if (error) console.log(error)
        else {
            // Push the list of sensors into the array to pass on to the next function
            var sensorBuffer = []
            for(var i = 0; i < results.rows.length; i++) {
                sensorBuffer.push(results.rows[i].sensor_id.trim())
            }
            processSensors(sensorBuffer)
        }
    })
}

/*
    TODO: Rename function
    Retrieves the .csv file for today's sensor reading, get its information and the sensor's meta information
      and prepares to send it to "openFile()" for processing
*/
function processSensors(sensors) {
    // Setup today's date
    var dateToday = new Date()
    let monthLead = (dateToday.getMonth() + 1) < 10 ? '0' : ''
    let datePath = dateToday.getFullYear() + '/' + monthLead + (dateToday.getMonth() + 1) + '/' + dateToday.getDate()

    // For each sensor
    for(var i = 0; i < sensors.length; i++) {
        // Since operations from here are asynchronous, use const to ensure the sensor_id value stays fixed
        const sensorID = sensors[i]

        // Setting the filename to open
        //////////
        // For testing only - Comment out when used in production
        // Static file retrieval
        const fileName = 'sensorData/' + sensorID + '/2020/01/31/MINTS_' + sensorID + '_calibrated_UTC_2020_01_31.csv'

        // Uncomment when used in production
        // Gets the sensor data for today
        /*
        const fileName = 'sensorData/' 
            // Main sensor path
            + sensorID + '/' + datePath 
            // File itself
            + '/MINTS_' + sensorID + '_calibrated_UTC_' + dateToday.getFullYear() + '_' + monthLead + (dateToday.getMonth() + 1) + '_' + dateToday.getDate() + '.csv'
        //*/
        //////////

        
        // Open file metadata (through stat) to get its file size
        fs.stat(fileName, function(error, stat) {
            const fileSize = stat.size
            // Query table for the last largest number of bytes read 
            // (since we are assuming sensor data will be continually added to the .csv files)
            psql.query("SELECT * FROM sensor_meta WHERE sensor_id = \'" + sensorID + "\';", (err, res) => {
                if (err) console.log(err.stack)
                else {
                    var prevFileSize = 0, dataOffset = [];
                    // Ensure the query is not empty, set the previous file size
                    if(res != null && res.rows[0] != null) {
                        // Data that is always used from sensor_meta
                        if(res.rows[0].largest_read != null)
                            prevFileSize = res.rows[0].largest_read
                        // If more data is retreived, add the .csv column offsets here
                        if(res.rows[0].col_offset_pm2_5 != null)
                            dataOffset['data_pm2_5'] = res.rows[0].col_offset_pm2_5
                        if(res.rows[0].col_offset_pm1 != null)
                            dataOffset['data_pm1'] = res.rows[0].col_offset_pm1
                        if(res.rows[0].col_offset_pm10 != null)
                            dataOffset['data_pm10'] = res.rows[0].col_offset_pm10
                        // if(res.rows[0].col_offset_longitude != null)
                        //     dataOffset['data_longitude'] = res.rows[0].col_offset_longitude
                        // if(res.rows[0].col_offset_latitude != null)
                        //     dataOffset['data_latitude'] = res.rows[0].col_offset_latitude
                        // if(res.rows[0].col_offset_temperature != null)
                        //     dataOffset['data_temperature'] = res.rows[0].col_offset_temperature
                        // if(res.rows[0].col_offset_humidity != null)
                        //     dataOffset['data_humidity'] = res.rows[0].col_offset_humidity
                        
                        // Work in progress on making json parsing more efficient
                        // console.log(JSON.stringify(res.rows[0]))
                        // const stringifiedJSON = JSON.stringify(res.rows[0])
                        // for(var i = 0; i < dataToUpdate.length; i++) {
                        //     var offsetDataIndex = stringifiedJSON.indexOf("col_offset_" + dataToUpdate[i].substr(5))
                        //     if(offsetDataIndex != 0) {
                        //         var offsetColonIndex = stringifiedJSON.indexOf(":", offsetDataIndex)
                        //         var offsetAfterIndex = stringifiedJSON.indexOf(",", offsetDataIndex)
                        //         if(offsetAfterIndex == -1) {
                        //             console.log("Data offset updated: " + dataToUpdate[i] + " with " 
                        //                 + stringifiedJSON.substr(offsetColonIndex + 1))
                        //         } else {
                        //             console.log("Data offset updated: " + dataToUpdate[i] + " with " 
                        //                 + stringifiedJSON.substr(offsetColonIndex + 1, (offsetAfterIndex - (offsetColonIndex + 1))))
                        //         }
                                
                        //     }  
                        // }
                    }
                    openFile(fileName, fileSize, prevFileSize, sensorID, dataOffset)
                }
            })
        })
    }
}

/*
    TODO: Rename function
    Opens today's sensor data file and updates the postgres database with new data rows
*/
function openFile(fileName, fileSize, prevFileSize, sensor_id, dataOffset) {
    // Open file in read-only
    fs.open(fileName, 'r', function(error, fd) {
        if(error) console.log(error)
        else {
            const readLen = fileSize - prevFileSize         // Calculate the number of bytes to read
            const curFileOffset = prevFileSize              // Set the bytes to skip (skipping bytes already read previously)
            var fileBuffer = Buffer.alloc(readLen)          // Allocate buffer based on the number of bytes we'll read
            fs.read(fd, fileBuffer, 0, readLen, curFileOffset, function(error, bytesRead, buffer) {
                var fileLines = fileBuffer.toString().split('\n')                   // Every single line in the file
                
                // Data collection
                for(var i = 1; i < fileLines.length; i++) {
                    var lineParts = fileLines[i].split(',')
                    if(lineParts[0] != null && lineParts[0] != '') {
                        var timestampDateParts = lineParts[0].split(/[- :]/)
                        //console.log(timestampDateParts)
                        var timestampDateObj = new Date(parseInt(timestampDateParts[0]),
                                                        parseInt(timestampDateParts[1]) - 1,
                                                        parseInt(timestampDateParts[2].split("T")[0]),
                                                        parseInt(timestampDateParts[2].split("T")[1]),
                                                        parseInt(timestampDateParts[3]),
                                                        parseInt(timestampDateParts[4]))
                        
                        // Insert data into each main data tables
                        for(var j = 0; j < dataToUpdate.length; j++) {
                            const dataInsertionQuery = "INSERT INTO " + dataToUpdate[j] + "(timestamp, sensor_id, value) VALUES ($1, $2, $3);"
                            const colOffset = dataOffset[dataToUpdate[j]]
                            psql.query(dataInsertionQuery, [timestampDateObj, sensor_id, lineParts[colOffset]], (err, res) => {
                                if(err) console.log(err.message + ", data offset: " + colOffset)
                            })
                        }
                    }
                }

                // Update table for the largest amount of bytes read for today's sensor data file
                const metaUpdateQuery = "INSERT INTO sensor_meta(sensor_id, largest_read) VALUES ($1, $2) ON CONFLICT (sensor_id) DO UPDATE SET largest_read = $2"
                    + " WHERE sensor_meta.sensor_id = $1;"
                psql.query(metaUpdateQuery, [sensor_id, (prevFileSize + readLen)], (err, res) => {
                    if(err) console.log(err.message)
                    else console.log("Updated sensor_id (" + sensor_id + ") with new largest read: " + (prevFileSize + readLen))
                })
            })
        }
    })
}

// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    updateSensorDataManual,
    updateSensorData
}