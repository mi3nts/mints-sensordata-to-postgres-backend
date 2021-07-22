/*
    dbsetupsub.sql
    MINTS-DATA-INGESTION-BACKEND
    
    SQL queries to setup the subscriber database to sync with the related publisher database.
    **Remember to fill out the information at the bottom.
*/

/*
    Setup main data tables
*/
CREATE TABLE IF NOT EXISTS data_pm1 (
    timestamp TIMESTAMP,
    sensor_id VARCHAR(20),
    value double precision,
    longitude double precision,
    latitude double precision,
    humidity double precision,
    temperature double precision,
    pressure double precision,
    dewpoint double precision,
    calibration_ver INT
);

CREATE TABLE IF NOT EXISTS data_pm2_5 (
    timestamp TIMESTAMP,
    sensor_id VARCHAR(20),
    value double precision,
    longitude double precision,
    latitude double precision,
    humidity double precision,
    temperature double precision,
    pressure double precision,
    dewpoint double precision,
    calibration_ver INT
);

CREATE TABLE IF NOT EXISTS data_pm10 (
    timestamp TIMESTAMP,
    sensor_id VARCHAR(20),
    value double precision,
    longitude double precision,
    latitude double precision,
    humidity double precision,
    temperature double precision,
    pressure double precision,
    dewpoint double precision,
    calibration_ver INT
);
/*
    Setup table used for gathering information about how to read the csv files.
    On the subscriber database, it is useful in providing a list and indicating whether or not the sensor
      is ready for the public.
*/
CREATE TABLE IF NOT EXISTS sensor_meta (
    sensor_id VARCHAR(20) UNIQUE,
    sensor_name VARCHAR(120),
    allow_public BOOLEAN,
    largest_read INT,
    col_offset_longitude INT,
    col_offset_latitude INT,
    col_offset_pm1 INT,
    col_offset_pm2_5 INT,
    col_offset_pm10 INT,
    col_offset_pressure INT,
    col_offset_temperature INT,
    col_offset_humidity INT,
    col_offset_dewpoint INT,
    location_last_upd TIMESTAMP,
    latest_longitude double precision,
    latest_latitude double precision,
    latest_data_timestamp TIMESTAMP,
    latest_pm1 double precision,
    latest_pm2_5 double precision,
    latest_pm10 double precision,
    latest_temperature double precision,
    latest_humidity double precision,
    latest_pressure double precision,
    latest_dewpoint double precision
);

/* Needed for replication */
ALTER TABLE data_pm1 REPLICA IDENTITY FULL;
ALTER TABLE data_pm2_5 REPLICA IDENTITY FULL;
ALTER TABLE data_pm10 REPLICA IDENTITY FULL;

/*
    Needed to connect to the master database to replicate data
*/
CREATE SUBSCRIPTION mints_sync CONNECTION 'host=<master_ip> port=5432 password=teamlary user=replicator dbname=mints' PUBLICATION mints_public;
CREATE SUBSCRIPTION mints_sync_meta CONNECTION 'host=<master_ip> port=5432 password=teamlary user=replicator dbname=mints' PUBLICATION mints_public_meta;
