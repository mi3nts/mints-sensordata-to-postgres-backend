import dbconnector
import config as cfg

import time
import os

def listHistoricalData():
    dataFiles = []
    for sensorFile in os.listdir(cfg.SENSOR_DATA_DIRECTORY):
        for yearFile in os.listdir(cfg.SENSOR_DATA_DIRECTORY + sensorFile + '/'):
            for monthFile in os.listdir(cfg.SENSOR_DATA_DIRECTORY + sensorFile + '/' + yearFile + '/'):
                for dayFile in os.listdir(cfg.SENSOR_DATA_DIRECTORY + sensorFile + '/' + yearFile + '/' + monthFile + '/'):
                    for file in os.listdir(cfg.SENSOR_DATA_DIRECTORY + sensorFile + '/' + yearFile + '/' + monthFile + '/' + dayFile + '/'):
                        if(file.find("_calibrated") != -1):
                            dataFiles.append('{}{}/{}/{}/{}/{}'.format(cfg.SENSOR_DATA_DIRECTORY, sensorFile, yearFile, monthFile, dayFile, file))
    
    return dataFiles

def processDataFiles(dataFiles):

    sqlStatements = []
    sqlQueryParams = []

    for file in dataFiles:
        csvData = open(file, 'r')
        csvDataLines = csvData.readlines()
        csvData.close()

        lineNo = 0
        dataOffsets = {}
        dataValues = {}
        dataValid = True

        fileParts = file.split('/')
        print("[{}]: Processing...".format(fileParts[len(fileParts) - 1]))
        sensor_id = fileParts[len(fileParts) - 5]
        for line in csvDataLines:
            # If CSV data is corrupted/unreadable
            if not dataValid:
                continue

            # Process CSV data headers
            if lineNo == 0:
                sanitizedLine = line.replace('\n','')
                headers = sanitizedLine.split(',')

                # Get col index of main data
                for mainData in cfg.DATA_COLUMNS_TABLE_UPDATE:
                    col = 0
                    for header in headers:
                        if(header.lower() == mainData.lower()):
                            dataOffsets[mainData] = col
                            break
                        col += 1

                # Get col index of common data
                for dataHeader in cfg.DATA_COLUMNS_COMMON_UPDATE:
                    col = 0
                    for header in headers:
                        if(header.lower() == dataHeader.lower()):
                            dataOffsets[dataHeader] = col
                            break
                        col += 1
                    if(dataOffsets.get(dataHeader) == None):
                        print("[{}]:    +- Could not find required data headers for {}. Data is not imported!".format(fileParts[len(fileParts) - 1], dataHeader))
                        dataValid = False
                        break

            # Process data with reference to headers
            else:
                sanitizedLine = line.replace('\n','')
                colData = sanitizedLine.split(',')

                # Find main data
                for mainData in cfg.DATA_COLUMNS_TABLE_UPDATE:
                    col = 0
                    for data in colData:
                        if(col == dataOffsets[mainData]):
                            dataValues[mainData] = data
                            break
                        col += 1

                # Find common data
                for dataHeader in cfg.DATA_COLUMNS_COMMON_UPDATE:
                    col = 0
                    for data in colData:
                        if(col == dataOffsets[dataHeader]):
                            dataValues[dataHeader] = data
                            break
                        col += 1
                
                # Prepare sql statements
                sqlStmt = "INSERT INTO data_{} (timestamp, sensor_id, value, {}) VALUES (%s, %s, %s, {}) ON CONFLICT (timestamp,sensor_id) DO UPDATE SET value = EXCLUDED.value, {}"
                tableCols = ""
                valueParams = ""
                updateParams = ""
                valueParamNum = 4
                queryParams = [colData[0], sensor_id]
                itr = 0
                for dataHeader in cfg.DATA_COLUMNS_COMMON_UPDATE:
                    if(itr == len(cfg.DATA_COLUMNS_COMMON_UPDATE) - 1):
                        tableCols += dataHeader.lower()
                        valueParams += "%s"
                        queryParams.append(dataValues[dataHeader])
                        updateParams += dataHeader.lower() + " = EXCLUDED." + dataHeader.lower()
                    else:
                        tableCols += dataHeader.lower() + ", "
                        valueParams += "%s, "
                        queryParams.append(dataValues[dataHeader])
                        updateParams += dataHeader.lower() + " = EXCLUDED." + dataHeader.lower() + ", "
                    valueParamNum += 1
                    itr += 1
                
                # Finalize SQL statements, one for each main data table, 
                #   inserting the main data value into the final statement
                for mainData in cfg.DATA_COLUMNS_TABLE_UPDATE:
                    sqlStatements.append(sqlStmt.format(mainData, tableCols, valueParams, updateParams))
                    queryParamsFinal = []
                    for param in queryParams:
                        queryParamsFinal.append(param)
                    queryParamsFinal.insert(2, dataValues[mainData])
                    sqlQueryParams.append(queryParamsFinal)

            lineNo += 1

    return sqlStatements, sqlQueryParams
        

def main():
    startTime = time.time() * 1000
    dataFiles = listHistoricalData()
    print('[1/4] Done searching for data files')
    for file in dataFiles:
        print("    +- Found data file: {}".format(file))
    
    print('[2/4] Processing files to prepare SQL statements...')
    sqlStatements, sqlQueryParams = processDataFiles(dataFiles)

    print("[3/4] Finished preparing SQL statements, proceeding to send queries to database")
    dbconnector.insertBulkQuery(sqlStatements, sqlQueryParams)

    print("[4/4] Finished updating historical data!")
    print("Operation took {} ms".format(round((time.time()*1000) - startTime)))

main()
