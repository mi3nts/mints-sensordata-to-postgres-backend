/*
    updatesMeta.js
    MINTS-BACKEND
    
    Reads the column header of today's sensor data and updates the sensor metadata table
      in postgre.
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
const updateSensorMetadata = () => {
    if(psql == null)
        console.log("The PSQL object is unavailable at this time.")
    else {
        fs.readdir(mcfg.SENSOR_DIRECTORY, function(err, files) {
            if(err) console.log(mutil.getTimeHeader() + err.message)
            else {
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
    // For testing only - Comment out when used in production
    //const fileName = 'sensorData/' + sensor_id + '/2020/01/31/MINTS_' + sensor_id + '_calibrated_UTC_2020_01_31.csv'

    // Uncomment when ready
    const fileName = mutil.getSensorDataToday(sensor_id)

    fs.stat(fileName, function (err, stat) {
        if(err) console.log(mutil.getTimeSensorHeader(sensor_id) + err.message)
        else {
            const fileSize = stat.size
            fs.open(fileName, 'r', function (err, fd) {
                if(err) console.log(mutil.getTimeSensorHeader(sensor_id) + err.message)
                else {
                    // Allocate buffer based on the number of bytes we'll read
                    var fileBuffer = Buffer.alloc(fileSize)   

                    fs.read(fd, fileBuffer, 0, fileSize, 0, function(err, bytesRead, buffer) {
                        if(err) console.log(mutil.getTimeHeader() + err.message)
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
                            if(err) console.log(mutil.getTimeSensorHeader(sensor_id) + err.message)
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

// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    updateSensorMetadata,
    resetLargestReadToday
}
