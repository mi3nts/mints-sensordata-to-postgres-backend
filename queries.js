/*
    queries.js
    MINTS-BACKEND
    
    Queries data from postgre
*/
const PSQL = require('pg').Pool

// Postgre connector object and connection information
const psql = new PSQL({
    user: 'vmadmin780',
    host: 'localhost',
    database: 'mints',
    password: '2wire609',
    port: 5432
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
                error: "" + error
            })
        }
        // Display JSON data 
        else response.status(200).json(results.rows)
    })
}

// Needed so functions can be imported in another script file 
//   and called like an object method
// Must remain on the bottom of script files
module.exports = {
    getSensorData
}