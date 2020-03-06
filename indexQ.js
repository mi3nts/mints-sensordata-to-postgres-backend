/*
    indexQ.js
    MINTS-BACKEND

    To be used for user data retreival only.
    Main script file to be called from terminal.
    Where it all comes together
*/
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3010

///////////////////////////////////////////////////////////////////////////////
// Start copy /////////////////////////////////////////////////////////////////

const PSQL = require('pg').Pool
const pgcon = require('./postgrescon.js')

// Postgre connector object and connection information
const psql = new PSQL({
    connectionString: pgcon.PSQL_LOGIN
})

const db = require('./queries-air-sensors.js')

// End copy ///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Important setup procedure (probably to allow JSON returns and thus REST functionality)
app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true
    })
)
// CORS configuration
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (request, response) => {
    response.json({
        info: 'MINTS-BACKEND processing server for transferring sensor data from .csv files to postgreSQL database tables'
    })
})

///////////////////////////////////////////////////////////////////////////////
// Start copy /////////////////////////////////////////////////////////////////

// REST API calls
app.get('/data_pm1', db.getSensorData)
app.get('/data_pm2_5', db.getSensorData)
app.get('/data_pm10', db.getSensorData)

app.get('/sensor_id_list', db.getListOfSensorIDs)
app.get('/latest', db.getLatestSensorData)

/*
    Where the script begins as soon as "node index.js" is run
*/
app.listen(port, () => {
    console.log('Server running on port ' + port + '.')
    generateLatestSensorIDDataRequests()
})

/*
    Generates the individual API requests for each sensor ID to get the latest data
*/
function generateLatestSensorIDDataRequests() {
    // Queries sensor_meta for list of sensor_ids
    psql.query("SELECT sensor_id FROM sensor_meta", (error, results) => {
        if (error) console.log(error)
        else {
            for(var i = 0; i < results.rows.length; i++) {
                app.get('/latest/' + results.rows[i].sensor_id.trim(), db.getLatestSensorDataForID)
            }
        }
    })
}

// End copy ///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
