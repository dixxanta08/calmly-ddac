const AWS = require('aws-sdk');
const dotenv = require('dotenv');
dotenv.config();
AWS.config.update({ region: process.env.NEXT_PUBLIC_AWS_REGION });

// Initialize DynamoDB client
const dynamoDB = new AWS.DynamoDB({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

// Define all tables you need to create
const tables = [
    {
        TableName: 'users',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'email', AttributeType: 'S' },
            { AttributeName: 'phone', AttributeType: 'S' },
            { AttributeName: 'role', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'EmailIndex',
                KeySchema: [
                    { AttributeName: 'email', KeyType: 'HASH' }
                ],
                Projection: {
                    ProjectionType: 'ALL'
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'PhoneIndex',
                KeySchema: [
                    { AttributeName: 'phone', KeyType: 'HASH' }
                ],
                Projection: {
                    ProjectionType: 'ALL'
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'RoleIndex',
                KeySchema: [
                    { AttributeName: 'role', KeyType: 'HASH' }
                ],
                Projection: {
                    ProjectionType: 'ALL'
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    {
        TableName: 'appointments',
        AttributeDefinitions: [
            { AttributeName: 'appointmentId', AttributeType: 'S' },
            { AttributeName: 'therapist_id', AttributeType: 'S' },
            { AttributeName: 'patient_id', AttributeType: 'S' },
            { AttributeName: 'appointmentDateTime', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'appointmentId', KeyType: 'HASH' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'TherapistDateTimeIndex',
                KeySchema: [
                    { AttributeName: 'therapist_id', KeyType: 'HASH' },
                    { AttributeName: 'appointmentDateTime', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
            },
            {
                IndexName: 'PatientDateTimeIndex',
                KeySchema: [
                    { AttributeName: 'patient_id', KeyType: 'HASH' },
                    { AttributeName: 'appointmentDateTime', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
            }
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
        TableName: 'educationalMaterials',
        AttributeDefinitions: [
            { AttributeName: 'materialId', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'materialId', KeyType: 'HASH' }
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
];

// Function to check if a table exists
const checkIfTableExists = async (tableName) => {
    try {
        const data = await dynamoDB.listTables().promise();
        return data.TableNames && data.TableNames.includes(tableName);
    } catch (err) {
        console.error('Error checking if table exists:', err);
        return false;
    }
};

// Function to create tables if not exists
const createTableIfNotExists = async () => {
    for (let table of tables) {
        const tableExists = await checkIfTableExists(table.TableName);

        if (tableExists) {
            console.log(`Table "${table.TableName}" already exists.`);
            continue;
        }

        try {
            const data = await dynamoDB.createTable(table).promise();
            console.log(`Table "${table.TableName}" created successfully:`, data);
        } catch (err) {
            console.error(`Error creating table "${table.TableName}":`, err);
        }
    }
};

// Call the function to create tables if not exists
createTableIfNotExists();

