/*
    dbsetuppub.sql
    MINTS-DATA-INGESTION-BACKEND
    
    SQL queries to setup the publisher database which serves as the main database other 
      subscriber databases would sync to.
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
ALTER TABLE sensor_meta REPLICA IDENTITY FULL;

/* 
    Only the master database needs these indices in order to prevent duplicate rows/data.
    The slave database should not have duplicated data as a result.
 */
CREATE UNIQUE INDEX index_data_pm1 ON data_pm1(timestamp, sensor_id);
CREATE UNIQUE INDEX index_data_pm2_5 ON data_pm2_5(timestamp, sensor_id);
CREATE UNIQUE INDEX index_data_pm10 ON data_pm10(timestamp, sensor_id);

/* 
    Setting up master database publications
*/
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'teamlary';

GRANT ALL PRIVILEGES ON DATABASE mints TO replicator;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO replicator;

CREATE PUBLICATION mints_public;
ALTER PUBLICATION mints_public ADD TABLE data_pm1;
ALTER PUBLICATION mints_public ADD TABLE data_pm2_5;
ALTER PUBLICATION mints_public ADD TABLE data_pm10;

CREATE PUBLICATION mints_public_meta;
ALTER PUBLICATION mints_public_meta ADD TABLE sensor_meta;
