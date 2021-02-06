
const PSQL = require('pg').Pool
const pgcon = require('./postgrescon.js')

const fs = require('fs')
const mutil = require('./util.js')
const mcfg = require('./mconfig.js')
const em = require('./emailNotify.js')

const dbconn = require('./dbconnector.js')

const updateSensorDataHistorical = function (request, response) {
    // Get sensors ids in directory
    var dataFileSet = []
    var sensorFolders = fs.readdirSync(mcfg.SENSOR_DIRECTORY)

    for (var i = 0; i < sensorFolders.length; i++) {
        var sensorDataFiles = {}
        sensorDataFiles.yearFolders = fs.readdirSync(mcfg.SENSOR_DIRECTORY + sensorFolders[i])
        for (var j = 0; j < sensorDataFiles.yearFolders.length; j++) {
            sensorDataFiles.monthFolders = fs.readdirSync(mcfg.SENSOR_DIRECTORY + sensorFolders[i] + "/" + sensorDataFiles.yearFolders[j])
            for (var k = 0; k < sensorDataFiles.monthFolders.length; k++) {
                sensorDataFiles.dayFolders = fs.readdirSync(mcfg.SENSOR_DIRECTORY + sensorFolders[i] + "/" + sensorDataFiles.yearFolders[j] + "/" + sensorDataFiles.monthFolders[k])
                for (var l = 0; l < sensorDataFiles.dayFolders.length; l++) {
                    dataFileSet.push(mutil.getSensorData(sensorFolders[i], sensorDataFiles.yearFolders[j], sensorDataFiles.monthFolders[k], sensorDataFiles.dayFolders[l]))
               }
            }
        }
    }
    processData(dataFileSet)

    console.log("Done reading files!")
    response.send("All available data files have been read and are being inserted/updated in the database. This can take awhile depending on the amount of data being inserted\n")
}

function processData(dataFileSet) {
    for (var i = 0; i < dataFileSet.length; i++) {
        console.log("File to read: " + dataFileSet[i])
        var data = fs.readFileSync(dataFileSet[i])
        var dataLines = data.toString().split('\n')
        console.log("Got " + dataLines.length + " lines of data including header")
        var dataOffset = processDataHeader(dataLines[0])

        var filePathParts = dataFileSet[i].split('/')
        var sensor_id = filePathParts[filePathParts.length - 5]

        for(var j = 1; j < dataLines.length; j++) {
            const lineParts = dataLines[j].split(',')
            if(lineParts[0] != null && lineParts[0] != '') {
                dbconn.insertMainData(sensor_id, lineParts, dataOffset, null)
            }
        }
    }
}

function processDataHeader(dataHeaderLine) {
    // Finding the column index for the data we want
    var dataHeaders = dataHeaderLine.split(',')
    var dataOffsets = {}

    // Mark the data column positions
    for(var i = 0; i < dataHeaders.length; i++) {
        dataOffsets[dataHeaders[i].toLowerCase()] = i
    }
    return dataOffsets
}

module.exports = {
    updateSensorDataHistorical
}