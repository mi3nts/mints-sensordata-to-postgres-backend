/*
	mconfig.js
	MINTS-BACKEND

	Contains configuration information such as directory paths.
    Edit this depending on the installation environment and your needs.
    
    **TEMPLATE-ONLY. Replace <params> with the requested information. 
    Then rename the file to remove '-template'.
*/

// Main MQTT broker address
const MQTT_BROKER_ADDRESS = 'mqtt://<MQTT Server Address (IP or Domain Name)>'

// Main sensor directory path
const SENSOR_DIRECTORY = '<path to where the sensor data folders are>'

// Allows email notification of 
const EMAIL_NOTIFICATION_ENABLE = false

const EMAIL_NOTIFICATION_ADDRESS = "<email to send notifications to, must enable smtp access>"
const EMAIL_NOTIFICATION_PASS = "<password to email, probably will not work with 2FA>"

// DO NOT EDIT THE FOLLOW BELOW THIS LINE FOR NOW /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

// All the data columns that are being collected from the .csv files
const DATA_COLUMNS_ALL = [
	"PM1",
    "PM2_5",
    "PM10",
    "Latitude",
    "Longitude",
    "Humidity",
    "Temperature",
    "Pressure",
    "DewPoint"
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
    "temperature",
    "pressure",
    "dewpoint"
]

module.exports = {
    MQTT_BROKER_ADDRESS,
    SENSOR_DIRECTORY,
    EMAIL_NOTIFICATION_ENABLE,
    EMAIL_NOTIFICATION_ADDRESS,
    EMAIL_NOTIFICATION_PASS,
    DATA_COLUMNS_ALL,
    DATA_COLUMNS_TABLE_UPDATE,
    DATA_COLUMNS_COMMON_UPDATE
}
