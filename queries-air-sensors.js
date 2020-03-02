/*
    queries.js
    MINTS-BACKEND
    
    Queries data from postgre
*/
const pg = require('pg')
pg.types.setTypeParser(1114, str => str);

const PSQL = require('pg').Pool
const pgcon = require('./postgrescon.js')

// Postgre connector object and connection information
const psql = new PSQL({
    connectionString: pgcon.PSQL_LOGIN
})

/*
    Get data based on the request url
*/
const getSensorData = (request, response) => {
    // Request URL will have the "/" at the beginning so it must be dealt with
    const getQuery = "SELECT * FROM " + request.url.substr(1) + " ORDER BY timestamp ASC"
    psql.query(getQuery, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        }
        // Display JSON data 
        else response.status(200).json(results.rows)
    })
}

const getLatestSensorData = (request, response) => {
    const getQuery = "SELECT data_pm1.timestamp, "
            + "data_pm1.value as pm1, "
            + "data_pm1.sensor_id, "
            + "data_pm2_5.value as pm2_5, "
            + "data_pm10.value as pm10, "
            + "data_pm1.temperature, "
            + "data_pm1.humidity, "
            + "data_pm1.longitude, "
            + "data_pm1.latitude "
            + "FROM data_pm1 "
            + "INNER JOIN data_pm2_5 ON data_pm2_5.timestamp = data_pm1.timestamp "
            + "INNER JOIN data_pm10 ON data_pm10.timestamp = data_pm1.timestamp "
            + "WHERE data_pm1.timestamp = (SELECT MAX(timestamp) FROM data_pm1);"
    psql.query(getQuery, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else response.status(200).json(results.rows)
    })
}

const getListOfSensorIDs = (request, response) => {
    const getQuery = "SELECT sensor_id FROM sensor_meta;"
    psql.query(getQuery, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else {
            var buffer = []
            for(var i = 0; i < results.rows.length; i++) {
                buffer.push(results.rows[i]['sensor_id'])
            }
            response.status(200).json(buffer)
        }
    })
}

const getLatestSensorDataForID = (request, response) => {
    const getQuery = "SELECT " +
            "data_pm1.timestamp, " +
            "data_pm1.sensor_id, " +
            "data_pm1.value as pm1, " +
            "data_pm2_5.value as pm2_5, " +
            "data_pm10.value as pm10, " +
            "data_pm1.temperature, " +
            "data_pm1.humidity, " +
            "data_pm1.longitude, " +
            "data_pm1.latitude " +
        "FROM data_pm1 " +
        "INNER JOIN data_pm2_5 ON data_pm2_5.timestamp = data_pm1.timestamp AND data_pm2_5.sensor_id = data_pm1.sensor_id " +
        "INNER JOIN data_pm10 ON data_pm10.timestamp = data_pm1.timestamp AND data_pm10.sensor_id = data_pm1.sensor_id " +
        "WHERE data_pm1.timestamp = (SELECT MAX(timestamp) FROM data_pm1 WHERE sensor_id = \'" + request.url.substr(8) + "\')" +
        "AND data_pm1.sensor_id = \'" + request.url.substr(8) + "\';"
    psql.query(getQuery, (error, results) => {
        if(error) {
            response.json({
                status: 500,
                error: error.message
            })
        } else response.status(200).json(results.rows)
    })
}

// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    getSensorData,
    getLatestSensorData,
    getListOfSensorIDs,
    getLatestSensorDataForID
}