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
const mcfg = require('./mconfig.js')

// Postgre connector object and connection information
const psql = new PSQL({
    connectionString: pgcon.PSQL_LOGIN
})

// Data columns to look for and update
const dataToUpdate = mcfg.DATA_COLUMNS_TABLE_UPDATE

// Common data columns to look for and update
const dataToUpdateCommonParams = mcfg.DATA_COLUMNS_COMMON_UPDATE

// Error flags, used as a key:value array for each sensor
// TODO: Improve
var missingFileError = new Object
var fileOpenError = new Object
var fileReadError = new Object
var outdatedSensor = new Object

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
    Update sensor data based on MQTT request
*/
const updateSensorDataFromMQTT = function (message) {
    const sensor_id = message.split('|')[0]
    const dataLine = message.split('|')[1]

    // Query sensor metadata to get column location information
    psql.query("SELECT * FROM sensor_meta WHERE sensor_id = \'" + sensor_id + "\';", (err, res) => {
        if (err) console.log(err.stack)
        else {
            var dataColOffset = [];

            // Ensure the query is not empty, set the previous file size
            if(res != null && res.rows[0] != null) {
                // Assigning data column offsets for table data to update
                for(var i = 0; i < dataToUpdate.length; i++) {
                    if(res.rows[0]['col_offset_' + dataToUpdate[i].toLowerCase()] != null) {
                        dataColOffset[dataToUpdate[i]] = res.rows[0]['col_offset_' + dataToUpdate[i].toLowerCase()]
                    }
                }
                // Assigning data column offsets for common data shared across tables
                for(var i = 0; i < dataToUpdateCommonParams.length; i++) {
                    if(res.rows[0]['col_offset_' + dataToUpdateCommonParams[i].toLowerCase()] != null) {
                        dataColOffset[dataToUpdateCommonParams[i]] = res.rows[0]['col_offset_' + dataToUpdateCommonParams[i].toLowerCase()]
                    }
                }
            }

            // Insert directly into the database
            insertIntoDBFromLine(sensor_id, dataLine, dataColOffset, true)
        }
    })
}

const updateSensorDataHistorical = function () {
    // Get sensors ids in directory
    fs.readdir(mcfg.SENSOR_DIRECTORY, function (err, files) {
        if(err) {
            console.log(mutil.getTimeHeader() + err.message)
            mutil.emailNotify(mutil.getTimeHeader() + err.message, 2)
        } else {
            
        }
    })
}
/*
    Retrieves the list of sensor_ids and prepares to send it to 
      processSensors() 
    
    **Make sure to run updateMetadata first.
*/
function querySensorList() {
    // Queries sensor_meta for list of sensor_ids
    psql.query("SELECT sensor_id FROM sensor_meta", (error, results) => {
        if (error) {
            console.log(mutil.getTimeHeader() + error)
            mutil.emailNotify(mutil.getTimeHeader() + error.message, 2)
        } else {
            // Push the list of sensors into the array to pass on to the next function
            var sensorBuffer = []
            for(var i = 0; i < results.rows.length; i++) {
                sensorBuffer.push(results.rows[i].sensor_id.trim())

                // Set error flag instances
                if(missingFileError[results.rows[i].sensor_id.trim()] == null)
                    missingFileError[results.rows[i].sensor_id.trim()] = false
                if(fileOpenError[results.rows[i].sensor_id.trim()] == null)
                    fileOpenError[results.rows[i].sensor_id.trim()] = false
                if(fileReadError[results.rows[i].sensor_id.trim()] == null)
                    fileReadError[results.rows[i].sensor_id.trim()] = false
                if(outdatedSensor[results.rows[i].sensor_id.trim()] == null)
                    outdatedSensor[results.rows[i].sensor_id.trim()] = false
            }
            processSensorDataForToday(sensorBuffer)
        }
    })
}

/*
    Retrieves the .csv file for today's sensor reading, get its information and the sensor's meta information
      and prepares to send it to "openFile()" for processing
*/
function processSensorDataForToday(sensors) {
    // For each sensor
    for(var i = 0; i < sensors.length; i++) {
        // Since operations from here are asynchronous, use const to ensure the sensor_id value stays fixed
        const sensor_id = sensors[i]

        // Setting the filename to open
        const fileName = mutil.getSensorDataToday(sensor_id)

        getFileMetadata(fileName, sensor_id)
    }
}

function getFileMetadata(fileName, sensor_id) {
    // Open file metadata (through stat) to get its file size
    fs.stat(fileName, function(error, stat) {
        if(error) {
            console.log(mutil.getTimeSensorHeader(sensor_id) + "fs.stat: " + error.message)
            
            if(!missingFileError[sensor_id]) {
                missingFileError[sensor_id] = true;    // Set error flag the mail system does not get spammed
                mutil.emailNotify(mutil.getTimeSensorHeader(sensor_id) + "fs.stat: " + error.message, 2)
            } 
            else console.log(mutil.getTimeSensorHeader(sensor_id) + "fs.stat: An email was already sent regarding this issue and remains unresolved.")
        } else {
            // Reset error flag for email
            if(missingFileError[sensor_id]) {
                missingFileError[sensor_id] = false;
                mutil.emailNotify(mutil.getTimeSensorHeader(sensor_id) + "fs.stat issue has been resolved", 1)
                console.log(mutil.getTimeSensorHeader(sensor_id) + "fs.stat issue has been resolved.")
            }
            const fileSize = stat.size
            // Query table for the last largest number of bytes read 
            // (since we are assuming sensor data will be continually added to the .csv files)
            psql.query("SELECT * FROM sensor_meta WHERE sensor_id = \'" + sensor_id + "\';", (err, res) => {
                if (err) console.log(err.stack)
                else {
                    var prevFileSize = 0, dataOffset = [];

                    // Ensure the query is not empty, set the previous file size
                    if(res != null && res.rows[0] != null) {

                        // Data that is always used from sensor_meta
                        if(res.rows[0].largest_read != null)
                            prevFileSize = res.rows[0].largest_read
                        
                        // Assigning data column offsets for table data to update
                        for(var i = 0; i < dataToUpdate.length; i++) {
                            if(res.rows[0]['col_offset_' + dataToUpdate[i].toLowerCase()] != null) {
                                dataOffset[dataToUpdate[i]] = res.rows[0]['col_offset_' + dataToUpdate[i].toLowerCase()]
                            }
                        }
                        // Assigning data column offsets for common data shared across tables
                        for(var i = 0; i < dataToUpdateCommonParams.length; i++) {
                            if(res.rows[0]['col_offset_' + dataToUpdateCommonParams[i].toLowerCase()] != null) {
                                dataOffset[dataToUpdateCommonParams[i]] = res.rows[0]['col_offset_' + dataToUpdateCommonParams[i].toLowerCase()]
                            }
                        }
                    }

                    // Open the file for reading data into a buffer
                    openFile(fileName, fileSize, prevFileSize, sensor_id, dataOffset)
                }
            })
        }
    })
}

/*
    Opens the specified sensor data file and prepares to read the file
*/
function openFile(fileName, fileSize, prevFileSize, sensor_id, dataOffset) {
    // Open file in read-only
    fs.open(fileName, 'r', function(err, fd) {
        if(err) {
            console.log(mutil.getTimeSensorHeader(sensor_id) + "fs.open: " + err.message)
            if(!fileOpenError[sensor_id]) {
                fileOpenError[sensor_id] = true
                mutil.emailNotify(mutil.getTimeSensorHeader(sensor_id) + "fs.open: " + err.message, 2)
            } else console.log(mutil.getTimeSensorHeader(sensor_id) + "fs.open: An email was already sent regarding this issue and remains unresolved.")
        } else {
            if(fileOpenError[sensor_id]) {
                fileOpenError[sensor_id] = false
                mutil.emailNotify(mutil.getTimeSensorHeader(sensor_id) + "fs.open issue has been resolved", 1)
                console.log(mutil.getTimeSensorHeader(sensor_id) + "fs.open issue has been resolved.")
            }

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
                if(err) {
                    console.log(mutil.getTimeSensorHeader(sensor_id) + "fs.read: " + err.message)
                    if(!fileReadError[sensor_id]) {
                        fileReadError[sensor_id] = true
                        mutil.emailNotify(mutil.getTimeSensorHeader(sensor_id) + "fs.read: " + err.message, 2)
                    } else console.log(mutil.getTimeSensorHeader(sensor_id) + + "fs.read: An email was already sent regarding this issue and remains unresolved.")
                } else {
                    if(fileReadError[sensor_id]) {
                        fileReadError[sensor_id] = false
                        mutil.emailNotify(mutil.getTimeSensorHeader(sensor_id) + "fs.read issue has been resolved", 1)
                        console.log(mutil.getTimeSensorHeader(sensor_id) + "fs.read issue has been resolved.")
                    }

                    // Start parsing data from the CSV file
                    readDataFromCSVToDB(fd, sensor_id, dataOffset, bytesRead, prevFileSize, readLen, buffer)
                }
            })
        }
    })
}

/*
    Reads the sensor data file and updates the postgresql database accordingly
*/
function readDataFromCSVToDB(fd, sensor_id, dataOffset, bytesRead, prevFileSize, readLen, buffer) {
    // Every single line in the file
    const fileLines = buffer.toString().split('\n')                   
    
    // Data insertion
    for(var i = 1; i < fileLines.length; i++) {
        insertIntoDBFromLine(sensor_id, fileLines[i], dataOffset, false)
    }

    // Update table for the largest amount of bytes read for today's sensor data file
    const metaUpdateQuery = "INSERT INTO sensor_meta(sensor_id, largest_read) VALUES ($1, $2) ON CONFLICT (sensor_id) DO UPDATE SET largest_read = $2"
        + " WHERE sensor_meta.sensor_id = $1;"
    psql.query(metaUpdateQuery, [sensor_id, (prevFileSize + readLen)], (err, res) => {
        if(err) {
            console.log(mutil.getTimeSensorHeader(sensor_id) 
                + "An error occured while updating the largest amount of bytes read for today's sensor data file: " 
                + err.message)
            // mutil.emailNotify(mutil.getTimeSensorHeader(sensor_id) 
            //     + "An error occured while updating the largest amount of bytes read for today's sensor data file: " 
            //     + err.message, 2)
        } else {
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
}

/*
    Inserts a line of data into the PostgreSQL database
*/
function insertIntoDBFromLine(sensor_id, line, dataOffset, isFromMQTT) {
    const lineParts = line.split(',')
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
            dataInsertionQuery += ") ON CONFLICT DO NOTHING;"

            // Make insertion query
            psql.query(dataInsertionQuery, dataInsertionQueryParams, (err, res) => {
                if(err) {
                    console.error(mutil.getTimeSensorHeader(sensor_id) + err.message)
                } else if(isFromMQTT) {
                    // Note, this message may print three times because it is currently inserted into three different tables
                    console.log(mutil.getTimeSensorHeader(sensor_id) + "Successfully inserted from MQTT into the database")
                }
                checkSensorDataLastUpdated(sensor_id)
            })
        }

        // Update sensor location
        updateSensorLocation(sensor_id, 
            lineParts[dataOffset[dataToUpdateCommonParams[1]]],
            lineParts[dataOffset[dataToUpdateCommonParams[0]]])
    }
}

function updateSensorLocation(sensor_id, longitude, latitude) {
    if(longitude == 'NaN' || latitude == 'NaN' || longitude == null || latitude == null) {
        console.error(mutil.getTimeSensorHeader(sensor_id) 
            + "Could not update location due to longitude: " + longitude + ", latitude: " + latitude
            + " being possibily null or NaN")
        
        return
    }
    const query = "UPDATE sensor_meta SET longitude = $2, latitude = $3, last_updated = $4 WHERE sensor_id = $1"
    const queryParams = [sensor_id, longitude, latitude, new Date()]
    psql.query(query, queryParams, (error, res) => {
        if(error) {
            console.error(mutil.getTimeSensorHeader(sensor_id) + err.message)
        }
    })
}

function checkSensorDataLastUpdated(sensor_id) {
    const query = "SELECT MAX(timestamp) FROM data_pm2_5 WHERE sensor_id = $1"
    const queryParams = [sensor_id]
    psql.query(query, queryParams, (error, res) => {
        if(error) {
            console.error(mutil.getTimeSensorHeader(sensor_id) + err.message)
        } else {
            if(res != null && res.rows[0] != null && res.rows[0].max != null) {
                var retreivedTimestamp = Date.parse(res.rows[0].max)
                //console.log(retreivedTimestamp + " vs. " + (new Date().getTime() - 360000))
                if(retreivedTimestamp < (new Date()).getTime() - 3600000) {
                    if(!outdatedSensor[sensor_id]) {
                        console.log(mutil.getTimeSensorHeader(sensor_id) + "The sensor has not sent any data in over an hour.")
                        mutil.emailNotify(mutil.getTimeSensorHeader(sensor_id) + "The sensor has not sent any data in over an hour.", 2)
                        outdatedSensor[sensor_id] = true
                    }
                } else {
                    if(outdatedSensor[sensor_id]) {
                        console.log(mutil.getTimeSensorHeader(sensor_id) + "The sensor is now sending data.")
                        mutil.emailNotify(mutil.getTimeSensorHeader(sensor_id) + "The sensor is now sending data.", 1)
                        outdatedSensor[sensor_id] = false
                    }
                }
            }
        }
    })
}
// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    updateSensorDataManual,
    updateSensorData,
    updateSensorDataFromMQTT
}
