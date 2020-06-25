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
    dewpoint double precision
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
    dewpoint double precision
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
    dewpoint double precision
);
/*
    Setup table used for gathering information about how to read the csv files.
    On the slave database, it is useful in providing a list and indicating whether or not the sensor
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
    col_offset_dewpoint INT
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
