"""
    config.py
    MINTS-DATA-INGESTION-BACKEND

    Contains configuration information such as directory paths.
    Edit this depending on the installation environment and your needs.

    **TEMPLATE-ONLY. Replace <params> with the requested information. 
    Then rename the file to remove '-template'.
"""

# Main calibrated sensor data directory path
SENSOR_DATA_DIRECTORY = "<directory>"

## DO NOT EDIT THE FOLLOW BELOW THIS LINE #########################################################
###################################################################################################

DATA_COLUMNS_ALL = [
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

DATA_COLUMNS_TABLE_UPDATE = [
	"pm1",
    "pm2_5",
    "pm10"
]

DATA_COLUMNS_COMMON_UPDATE = [
	"latitude",
    "longitude",
    "humidity",
    "temperature",
    "pressure",
    "dewpoint"
]