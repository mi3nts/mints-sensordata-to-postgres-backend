const PSQL = require('pg').Pool
const pgcon = require('./postgrescon.js')

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

const insertMainData = function(sensor_id, dataParts, dataOffset, callback) {
    // Break the raw timestamp string into discernable parts so 
    var timestampDateParts = dataParts[0].split(/[- :]/)
    var timestampDateObj = new Date(parseInt(timestampDateParts[0]),
                                    parseInt(timestampDateParts[1]) - 1,
                                    parseInt(timestampDateParts[2]),
                                    parseInt(timestampDateParts[3]),
                                    parseInt(timestampDateParts[4]),
                                    parseInt(timestampDateParts[5]))
        
    // Insert data into each main data tables
    for(var mainDataItr = 0; mainDataItr < dataToUpdate.length; mainDataItr++) {
        // Initialize query statement
        var dataInsertionQuery = "INSERT INTO data_" + dataToUpdate[mainDataItr] + "(timestamp, sensor_id, value, "

        // Build remaining column parameters
        for(var colItr = 0; colItr < dataToUpdateCommonParams.length; colItr++) {
            if(colItr == dataToUpdateCommonParams.length - 1)
                dataInsertionQuery += dataToUpdateCommonParams[colItr]
            else dataInsertionQuery += dataToUpdateCommonParams[colItr] + ", "
        }
        dataInsertionQuery += ") VALUES ($1, $2, $3,"

        var dataUpdateQuery = ""
        // Build remaining value parameters and insert them into the parameter array and update statement
        var dataInsertionQueryParams = [timestampDateObj, sensor_id, dataParts[dataOffset[dataToUpdate[mainDataItr]]]]
        var paramNum = 4
        for(var colItr = 0; colItr < dataToUpdateCommonParams.length; colItr++, paramNum++) {
            if(colItr == dataToUpdateCommonParams.length - 1) {
                dataInsertionQuery += "$" + paramNum
                dataUpdateQuery += dataToUpdateCommonParams[paramNum-4] + " = EXCLUDED." + dataToUpdateCommonParams[paramNum-4]
            } else {
                dataInsertionQuery += "$" + paramNum + ", "
                dataUpdateQuery += dataToUpdateCommonParams[paramNum-4] + " = EXCLUDED." + dataToUpdateCommonParams[paramNum-4] + ", "
            }

            // Checking for NaN before inserting data value into the query parameters
            if(dataParts[dataOffset[dataToUpdateCommonParams[colItr]]] == "NaN" 
                || dataParts[dataOffset[dataToUpdateCommonParams[colItr]]] == null) {
                dataInsertionQueryParams.push("0")
            } else {
                dataInsertionQueryParams.push(dataParts[dataOffset[dataToUpdateCommonParams[colItr]]])
            }
        }
        dataInsertionQuery += ") ON CONFLICT (timestamp,sensor_id) DO UPDATE SET value = EXCLUDED.value, "
            + dataUpdateQuery + ";"
        
        // Make insertion query
        psql.connect((err, client, done) => {
            if (err) {
                console.error(mutil.getTimeSensorHeader(sensor_id) + err.message)
            } else {
                client.query(dataInsertionQuery, dataInsertionQueryParams, (err, res) => {
                    done()
                    if(err) {
                        console.error(mutil.getTimeSensorHeader(sensor_id) + err.message)
                    }
                })
            }
        })
    }
}

module.exports = {
    insertMainData
}