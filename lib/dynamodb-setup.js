const AWS = require('aws-sdk');
const dotenv = require('dotenv');
dotenv.config();
AWS.config.update({ region: process.env.NEXT_PUBLIC_AWS_REGION });


// Initialize DynamoDB client (use your LocalStack endpoint or AWS endpoint)
const dynamoDB = new AWS.DynamoDB({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
});

// Define all tables you need to create
const tables = [
    {
        TableName: 'users',
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
        ],
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' },
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
        TableName: 'appointments',
        AttributeDefinitions: [
            { AttributeName: 'appointmentId', AttributeType: 'S' },
        ],
        KeySchema: [
            { AttributeName: 'appointmentId', KeyType: 'HASH' },
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
        TableName: 'educationalMaterials',
        AttributeDefinitions: [
            { AttributeName: 'materialId', AttributeType: 'S' },
        ],
        KeySchema: [
            { AttributeName: 'materialId', KeyType: 'HASH' },
        ],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    // Add more tables as needed
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
