/*
    updatesMeta.js
    MINTS-DATA-INGESTION-BACKEND
    
    Reads the column header of today's sensor data and updates the sensor metadata table
      in postgre.
*/
const PSQL = require('pg').Pool
const pgcon = require('./postgrescon.js')

const fs = require('fs')
const mutil = require('./util.js')
const mcfg = require('./mconfig.js')
const em = require('./emailNotify.js')

// Postgre connector object and connection information
const psql = new PSQL({
    connectionString: pgcon.PSQL_LOGIN
})

// Add more data columns here
const dataColumns = mcfg.DATA_COLUMNS_ALL

/*
    Opens the directory ../sensorData and inserts a row for each sensor ID folder if it 
      doesn't already exist in the postgre database
*/
const updateSensorMetadata = () => {
    if(psql == null)
        console.log("The PSQL object is unavailable at this time.")
    else {
        fs.readdir(mcfg.SENSOR_DIRECTORY, function(err, files) {
            if(err) {
                console.log(mutil.getTimeHeader() 
                    + "Directory read error - While getting the list of sensors, the following error occured"
                    + "(Make sure you configured the sensor directory correctly in mconfig.js where SENSOR_DIRECTORY is):\n" + err.message)
                em.emailNotify(mutil.getTimeHeader() 
                    + "Directory read error - While getting the list of sensors, the following error occured"
                    + "(Make sure you configured the sensor directory correctly in mconfig.js where SENSOR_DIRECTORY is):\n" + err.message, 2)
            } else {
                for(var i = 0; i < files.length; i++) {
                    const sensor_id = files[i]
                    psql.query("INSERT INTO sensor_meta(sensor_id) VALUES " + "(\'" + sensor_id + "\')" + " ON CONFLICT (sensor_id) DO NOTHING;",
                        (error, res) => {
                            updateColOffsets(sensor_id)
                        }
                    )
                }
            }
        })
    }
}

/*
    Finds the positions of the column headers to look for and updates them
*/
function updateColOffsets(sensor_id) {
    // Setting the filename to open
    const fileName = mutil.getSensorDataToday(sensor_id)

    fs.stat(fileName, function (err, stat) {
        if(err) {
            console.log(mutil.getTimeSensorHeader(sensor_id) 
                + "File metadata read error - While updating column offsets, the following error occured:\n" + err.message)
            em.emailNotify(mutil.getTimeSensorHeader(sensor_id) 
                + "File metadata read error - While updating column offsets, the following error occured:\n" + err.message, 2)
        } else {
            const fileSize = stat.size
            fs.open(fileName, 'r', function (err, fd) {
                if(err) {
                    console.log(mutil.getTimeSensorHeader(sensor_id) + err.message)
                    em.emailNotify(mutil.getTimeSensorHeader(sensor_id) + err.message, 2)
                    // Close file to prevent memory leak
                    fs.close(fd, function () {
                        // Do nothing
                    })
                } else {
                    // Allocate buffer based on the number of bytes we'll read
                    var fileBuffer = Buffer.alloc(fileSize)   

                    fs.read(fd, fileBuffer, 0, fileSize, 0, function(err, bytesRead, buffer) {
                        if(err) {
                            console.log(mutil.getTimeSensorHeader(sensor_id) 
                                + "File read error - While updating column offsets, the following read error occured:\n" + err.message)
                            em.emailNotify(mutil.getTimeSensorHeader(sensor_id) 
                                + "File read error - While updating column offsets, the following read error occured:\n" + err.message, 2)
                        } 
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
                            if(err) { 
                                console.log(mutil.getTimeSensorHeader(sensor_id) 
                                    + "Database error - An error occured while updating sensor metadata on the database:\n" + err.message)
                                em.emailNotify(mutil.getTimeSensorHeader(sensor_id) 
                                    + "Database error - An error occured while updating sensor metadata on the database:\n" + err.message, 2)
                            }
                            console.log(mutil.getTimeSensorHeader(sensor_id) + "Finished updating sensor metadata")
                        })

                        // Close file to prevent memory leak
                        fs.close(fd, function () {
                            // Do nothing
                        })
                    })
                }
            })
        }
    })
}

const resetLargestReadToday = function () {
    if(psql == null)
        console.log("The PSQL object is unavailable at this time.")
    else {
        psql.query("UPDATE sensor_meta SET largest_read = 0;",
            (error, res) => {
                if(error)
                    console.log("ERROR: Unable to reset largest read for today: " + error.message)
                else console.log(mutil.getTimeHeader() + "Successfully reset largest file size read for all sensors.")
            }
        )
    }
}

const toggleSensorForPublic = (request, response) => {
    if(psql == null) {
        console.log("The PSQL object is unavailable at this time.")
        response.json({
            status: 500,
            message: "The PSQL object is unavailable at this time."
        })
    } else {
        const getQuery = "SELECT allow_public FROM sensor_meta WHERE sensor_id = $1;"
        const queryParams = [request.params.sensor_id];
        psql.query(getQuery, queryParams,
            (error, res) => {
                if(error) {
                    console.log("ERROR: Unable to get allow_public status of sensor id: " + request.params.sensor_id);
                    response.json({
                        status: 500,
                        message: "ERROR: Unable to get allow_public status of sensor id: " + request.params.sensor_id
                    })
                } else if(res.rows[0] != null && res.rows[0].allow_public) {
                    psql.query("UPDATE sensor_meta SET allow_public = false WHERE sensor_id = $1", queryParams,
                    (error, res) => {
                        if(error) {
                            console.log("ERROR: Unable to change publicity to false of sensor id: " + request.params.sensor_id);
                            response.json({
                                status: 500,
                                message: "ERROR: Unable to change publicity to false of sensor id: " + request.params.sensor_id
                            })
                        } else {
                            response.json({
                                status: 200,
                                message: "Publicity of " + request.params.sensor_id + " set to false."
                            })
                        }
                    })
                } else if(res.rows[0] != null) {
                    psql.query("UPDATE sensor_meta SET allow_public = true WHERE sensor_id = $1", queryParams,
                    (error, res) => {
                        if(error) {
                            console.log("ERROR: Unable to change publicity to true of sensor id: " + request.params.sensor_id);
                            response.json({
                                status: 500,
                                message: "ERROR: Unable to change publicity to true of sensor id: " + request.params.sensor_id
                            })
                        } else {
                            response.json({
                                status: 200,
                                message: "Publicity of " + request.params.sensor_id + " set to true."
                            })
                        }
                    })
                } else {
                    response.json({
                        status: 500,
                        message: request.params.sensor_id + " does not exist."
                    })
                }
            }
        )
    }
}

const updateSensorName = (request, response) => {
    const sensor_id = request.params.sensor_id
    const sensor_name = request.params.sensor_name
    const query = "UPDATE sensor_meta SET sensor_name = $2 WHERE sensor_id = $1"
    const queryParams = [sensor_id, sensor_name]
    psql.query(query, queryParams, (err, res) => {
        if(err) {
            console.log(mutil.getTimeSensorHeader(sensor_id) + "ERROR: Unable to change sensor name to " + sensor_name)
            response.json({
                status: 500,
                message: mutil.getTimeSensorHeader(sensor_id) + "ERROR: Unable to change sensor name to " + sensor_name
            })
        } else {
            console.log(mutil.getTimeSensorHeader(sensor_id) + "Succesfully changed sensor name to " + sensor_name)
            response.json({
                status: 200,
                message: mutil.getTimeSensorHeader(sensor_id) + "Succesfully changed sensor name to " + sensor_name
            })
        }
    })
}

// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    updateSensorMetadata,
    resetLargestReadToday,
    toggleSensorForPublic,
    updateSensorName
}
