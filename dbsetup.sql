CREATE TABLE IF NOT EXISTS data_pm1 (
    timestamp TIMESTAMP,
    sensor_id VARCHAR(20),
    value double precision,
    longitude double precision,
    latitude double precision,
    humidity double precision,
    temperature double precision
);

CREATE TABLE IF NOT EXISTS data_pm2_5 (
    timestamp TIMESTAMP,
    sensor_id VARCHAR(20),
    value double precision,
    longitude double precision,
    latitude double precision,
    humidity double precision,
    temperature double precision
);

CREATE TABLE IF NOT EXISTS data_pm10 (
    timestamp TIMESTAMP,
    sensor_id VARCHAR(20),
    value double precision,
    longitude double precision,
    latitude double precision,
    humidity double precision,
    temperature double precision
);

CREATE TABLE IF NOT EXISTS sensor_meta (
    sensor_id VARCHAR(20) PRIMARY KEY,
    largest_read INT,
    col_offset_pm1 INT,
    col_offset_pm2_5 INT,
    col_offset_pm10 INT,
    col_offset_longitude INT,
    col_offset_latitude INT,
    col_offset_humidity INT,
    col_offset_temperature INT
);