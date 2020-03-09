/*
	mconfig.js
	MINTS-BACKEND

	Contains configuration information such as directory paths.
	Edit this depending on the installation environment and your needs.
*/

// Main sensor directory path
const SENSOR_DIRECTORY = '/home/teamlarylive/minstData/liveUpdate/results/'

// Allows email notification of 
const EMAIL_NOTIFICATION_ENABLE = true

const EMAIL_NOTIFICATION_ADDRESS = "780devtest@gmail.com"
const EMAIL_NOTIFICATION_PASS = "MXC708ASUS10"

// All the data columns that are being collected from the .csv files
const DATA_COLUMNS_ALL = [
	"PM1",
    "PM2_5",
    "PM10",
    "Latitude",
    "Longitude",
    "Humidity",
    "Temperature"
]

// All the data columns that have their dedicated table, usually denoted by
//   the table name and the column containing the actual value is simply
//   called "value"
const DATA_COLUMNS_TABLE_UPDATE = [
	"pm1",
    "pm2_5",
    "pm10"
]

// All the data columns that are present in every data table (the tables described above)
const DATA_COLUMNS_COMMON_UPDATE = [
	"latitude",
    "longitude",
    "humidity",
    "temperature"
]

module.exports = {
    SENSOR_DIRECTORY,
    EMAIL_NOTIFICATION_ENABLE,
    EMAIL_NOTIFICATION_ADDRESS,
    EMAIL_NOTIFICATION_PASS
}
