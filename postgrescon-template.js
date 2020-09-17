/*
    postgrescon.js
    MINTS-DATA-INGESTION-BACKEND

    Contains important connection information for postgres

    **TEMPLATE-ONLY. Replace <params> with the requested information. 
    Then rename the file to remove '-template'.
*/
const PSQL_LOGIN = "postgres://<username>:<password>@localhost:5432/mints"

module.exports = {
    PSQL_LOGIN
}