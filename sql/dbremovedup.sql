DELETE FROM data_pm1 a USING data_pm1 b WHERE a.ctid < b.ctid AND a.timestamp = b.timestamp AND a.sensor_id = b.sensor_id;
DELETE FROM data_pm2_5 a USING data_pm2_5 b WHERE a.ctid < b.ctid AND a.timestamp = b.timestamp AND a.sensor_id = b.sensor_id;
DELETE FROM data_pm10 a USING data_pm10 b WHERE a.ctid < b.ctid AND a.timestamp = b.timestamp AND a.sensor_id = b.sensor_id;

