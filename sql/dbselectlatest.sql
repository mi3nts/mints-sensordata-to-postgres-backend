SELECT 
    data_pm1.timestamp, 
    data_pm1.sensor_id,
    data_pm1.value as pm1, 
    data_pm2_5.value as pm2_5, 
    data_pm10.value as pm10, 
    data_pm1.temperature, 
    data_pm1.humidity 
FROM data_pm1 
INNER JOIN data_pm2_5 ON data_pm2_5.timestamp = data_pm1.timestamp AND data_pm2_5.sensor_id = data_pm1.sensor_id
INNER JOIN data_pm10 ON data_pm10.timestamp = data_pm1.timestamp AND data_pm10.sensor_id = data_pm1.sensor_id
WHERE data_pm1.timestamp = (SELECT MAX(timestamp) FROM data_pm1 WHERE sensor_id = '001e06305a12')
AND data_pm1.sensor_id = '001e06305a12';