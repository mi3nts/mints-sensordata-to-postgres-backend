/*
    updates.js
    MINTS-BACKEND
    
    Reads sensor data from .csv files and updates the PostgreSQL database with new data.
    Most operations performed here are asynchronous.
*/
const PSQL = require('pg').Pool
const pgcon = require('./postgrescon.js')

const fs = require('fs')
const mutil = require('./util.js')


// Postgre connector object and connection information
const psql = new PSQL({
    connectionString: pgcon.PSQL_LOGIN
})

///////////////////////////////////////////////////////////
// -- Begin modification area -- //////////////////////////

// Data columns to look for and update
const dataToUpdate = [
    'pm2_5', 
    'pm1', 
    'pm10'
]

// Common data columns to look for and update
const dataToUpdateCommonParams = [
    "latitude",
    "longitude",
    "temperature",
    "humidity"
]

// -- End modification area -- ////////////////////////////
///////////////////////////////////////////////////////////


/*
    Manually update sensor data on REST API call
*/
const updateSensorDataManual = (request, response) => {
    if(psql == null) console.log("The PSQL object is unavailable at this time")
    else querySensorList()

   // Output json response
   response.json({
       message: "Results are processing asynchronously. Use /data to get sensor data in a .json format"
   })
}

/*
    Updates sensor data
*/
const updateSensorData = function () {
    if(psql == null) console.log("The PSQL object is unavailable at this time")
    else querySensorList()
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
    // For each sensor
    for(var i = 0; i < sensors.length; i++) {
        // Since operations from here are asynchronous, use const to ensure the sensor_id value stays fixed
        const sensorID = sensors[i]

        // Setting the filename to open
        // For testing only - Comment out when used in production
        //const fileName = 'sensorData/' + sensorID + '/2020/01/31/MINTS_' + sensorID + '_calibrated_UTC_2020_01_31.csv'

        // Uncomment when ready
        const fileName = mutil.getSensorDataToday(sensorID)

        // Open file metadata (through stat) to get its file size
        fs.stat(fileName, function(error, stat) {
            if(error) console.log(error.message)
            else {
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
                            
                            // Assigning data column offsets
                            for(var i = 0; i < dataToUpdate.length; i++) {
                                if(res.rows[0]['col_offset_' + dataToUpdate[i].toLowerCase()] != null) {
                                    dataOffset[dataToUpdate[i]] = res.rows[0]['col_offset_' + dataToUpdate[i].toLowerCase()]
                                }
                            }

                            // Assigning common data column offsets
                            for(var i = 0; i < dataToUpdateCommonParams.length; i++) {
                                if(res.rows[0]['col_offset_' + dataToUpdateCommonParams[i].toLowerCase()] != null) {
                                    dataOffset[dataToUpdateCommonParams[i]] = res.rows[0]['col_offset_' + dataToUpdateCommonParams[i].toLowerCase()]
                                }
                            }
                        }
                        openFile(fileName, fileSize, prevFileSize, sensorID, dataOffset)
                    }
                })
            }
        })
    }
}

/*
    TODO: Rename function
    Opens today's sensor data file and updates the postgres database with new data rows
*/
function openFile(fileName, fileSize, prevFileSize, sensor_id, dataOffset) {
    // Open file in read-only
    fs.open(fileName, 'r', function(err, fd) {
        if(err) console.log(err.message)
        else {
            var readCalc = fileSize - prevFileSize          // Calculate the number of bytes to read
            if(readCalc < 0) {                              // Temporary measure to deal with a negative result
                console.log(mutil.getTimeSensorHeader(sensor_id) + "WARNING: Read size calculations resulted in a negative read (" + fileSize + " - " + prevFileSize + " = " + readCalc + ").\n"
                    + "\t\t\t\tAs a temporary measure, the resulting read length is set to 0")
                readCalc = 0
            }
            const readLen = readCalc        

            const curFileOffset = prevFileSize              // Set the bytes to skip (skipping bytes already read previously)
            const fileBuffer = Buffer.alloc(readLen)        // Allocate buffer based on the number of bytes we'll read
            fs.read(fd, fileBuffer, 0, readLen, curFileOffset, function(err, bytesRead, buffer) {
                if(err) console.log(err.message)

                // Every single line in the file
                const fileLines = buffer.toString().split('\n')                   
                
                // Data collection
                for(var i = 1; i < fileLines.length; i++) {
                    const lineParts = fileLines[i].split(',')
                    if(lineParts[0] != null && lineParts[0] != '') {
                        // Break the raw timestamp string into discernable parts so 
                        var timestampDateParts = lineParts[0].split(/[- :]/)
                        var timestampDateObj = new Date(parseInt(timestampDateParts[0]),
                                                        parseInt(timestampDateParts[1]) - 1,
                                                        parseInt(timestampDateParts[2].split("T")[0]),
                                                        parseInt(timestampDateParts[2].split("T")[1]),
                                                        parseInt(timestampDateParts[3]),
                                                        parseInt(timestampDateParts[4]))
                        
                        // Insert data into each main data tables
                        for(var j = 0; j < dataToUpdate.length; j++) {
                            // Initialize query statement
                            var dataInsertionQuery = "INSERT INTO data_" + dataToUpdate[j] + "(timestamp, sensor_id, value, "

                            // Build remaining column parameters
                            for(var k = 0; k < dataToUpdateCommonParams.length; k++) {
                                if(k == dataToUpdateCommonParams.length - 1)
                                    dataInsertionQuery += dataToUpdateCommonParams[k]
                                else dataInsertionQuery += dataToUpdateCommonParams[k] + ", "
                            }
                            dataInsertionQuery += ") VALUES ($1, $2, $3,"

                            // Build remaining value parameters and insert them into the parameter array
                            var dataInsertionQueryParams = [timestampDateObj, sensor_id, lineParts[dataOffset[dataToUpdate[j]]]]
                            var paramNum = 4
                            for(var k = 0; k < dataToUpdateCommonParams.length; k++, paramNum++) {
                                if(k == dataToUpdateCommonParams.length - 1) {
                                    dataInsertionQuery += "$" + paramNum
                                    dataInsertionQueryParams.push(lineParts[dataOffset[dataToUpdateCommonParams[k]]])
                                } else {
                                    dataInsertionQuery += "$" + paramNum + ", "
                                    dataInsertionQueryParams.push(lineParts[dataOffset[dataToUpdateCommonParams[k]]])
                                }
                            }
                            dataInsertionQuery += ");"

                            // Make insertion query
                            psql.query(dataInsertionQuery, dataInsertionQueryParams, (err, res) => {
                                if(err) console.log(err.message + " for sensor " + sensor_id)
                            })
                        }
                    }
                }

                // Update table for the largest amount of bytes read for today's sensor data file
                const metaUpdateQuery = "INSERT INTO sensor_meta(sensor_id, largest_read) VALUES ($1, $2) ON CONFLICT (sensor_id) DO UPDATE SET largest_read = $2"
                    + " WHERE sensor_meta.sensor_id = $1;"
                psql.query(metaUpdateQuery, [sensor_id, (prevFileSize + readLen)], (err, res) => {
                    if(err) console.log(err.message)
                    else {
                        // If no new data was read
                        if(bytesRead == 0)
                            console.log(mutil.getTimeSensorHeader(sensor_id) + "No new data.")
                        else console.log(mutil.getTimeSensorHeader(sensor_id) + "Got new data and successfully inserted into database.")
                    }
                })

                // Close file to prevent memory leak
                fs.close(fd, function () {
                    // Do nothing
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
