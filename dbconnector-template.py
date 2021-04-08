"""
    Connection file for the postgreSQL database to write wind data to.
"""
import psycopg2

def createConnection():
    ### --- Edit the connection info here ---
    connection = psycopg2.connect(user = "<username>",
                                password = "<password>",
                                host = "127.0.0.1",
                                port = "5432",
                                database = "mints", 
                                async=False)
    ### --------------------------------------
    cursor = connection.cursor()
    return connection, cursor

def closeConnection(connection, cursor):
    if(connection):
        cursor.close()
        connection.close()


def insertQuery(sqlStatement, queryParameters):
    connection, cursor = createConnection()
    try:
        cursor.execute(sqlStatement, queryParameters)
        connection.commit()
    except (Exception, psycopg2.Error) as error:
        print("Error while performing query", error)
    closeConnection(connection, cursor)

def insertBulkQuery(sqlStatements, queryParameters):
    connection, cursor = createConnection()
    try:
        for i in range(len(sqlStatements)):
            cursor.execute(sqlStatements[i], queryParameters[i])
        connection.commit()
    except (Exception, psycopg2.Error) as error:
        print("Error while performing query", error)
    closeConnection(connection, cursor)
        