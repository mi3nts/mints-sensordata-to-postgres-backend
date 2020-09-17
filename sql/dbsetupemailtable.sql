/*
    dbsetupemailtable.sql
    MINTS-DATA-INGESTION-BACKEND
    
    Creating the email table for subscribers. 
    This table is not synced with any other databases.
*/

CREATE TABLE IF NOT EXISTS notify_email_list (
    email_id SERIAL PRIMARY KEY,
    email VARCHAR(320),
    added TIMESTAMP
);