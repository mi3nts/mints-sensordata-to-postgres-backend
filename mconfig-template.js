/*
	mconfig.js
	MINTS-DATA-INGESTION-BACKEND

	Contains configuration information such as directory paths.
    Edit this depending on the installation environment and your needs.
    
    **TEMPLATE-ONLY. Replace <params> with the requested information. 
    Then rename the file to remove '-template'.
*/

// Main MQTT broker address (use "mqtts://" if using SSL/TLS)
const MQTT_BROKER_ADDRESS = 'mqtt://<MQTT Server Address (IP or Domain Name)>'

// MQTT credentials (when using SSL/TLS)
const MQTT_USERNAME = ''
const MQTT_PASS = ''

// MQTT Topic for calibrated/reference sensor data
const MQTT_TOPIC_SENSOR_DATA = 'topic'

// Main sensor directory path
const SENSOR_DIRECTORY = '<path to where the sensor data folders are>'

// Allows email notification
const EMAIL_NOTIFICATION_ENABLE = false

const EMAIL_NOTIFICATION_ADDRESS = "<email to send notifications to, must enable smtp access>"
const EMAIL_NOTIFICATION_PASS = "<password to email, probably will not work with 2FA>"

// Amount of time since a sensor last updated its calibrated data
const EMAIL_NOTIFY_INACTIVE_THRESHOLD_1_HOUR = 360000
const EMAIL_NOTIFY_INACTIVE_THRESHOLD_1_DAY = 86400000
const EMAIL_NOTIFY_INACTIVE_THRESHOLD_2_WEEKS = 1209600000

// Email notification subscribers (updated by query after script startup)
var email_subscribers = ""

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
    MQTT_USERNAME,
    MQTT_PASS,
    MQTT_TOPIC_SENSOR_DATA,
    SENSOR_DIRECTORY,
    EMAIL_NOTIFICATION_ENABLE,
    EMAIL_NOTIFICATION_ADDRESS,
    EMAIL_NOTIFICATION_PASS,
    EMAIL_NOTIFY_INACTIVE_THRESHOLD_1_HOUR,
    EMAIL_NOTIFY_INACTIVE_THRESHOLD_1_DAY,
    EMAIL_NOTIFY_INACTIVE_THRESHOLD_2_WEEKS,
    email_subscribers,
    DATA_COLUMNS_ALL,
    DATA_COLUMNS_TABLE_UPDATE,
    DATA_COLUMNS_COMMON_UPDATE
}
