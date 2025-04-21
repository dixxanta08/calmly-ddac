const AWS = require('aws-sdk');
const dotenv = require('dotenv');
dotenv.config();

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

const adminUser = {
    id: '1', // Using a simple ID for admin
    name: 'Admin',
    phone: '9800110010',
    email: 'admin@gmail.com',
    password: '$2b$10$mpfbRW/p.cLzBwtCdOvUdOWb/VlVaXgreBX9hQndIu1xvO.QBfj1m',
    role: 'admin',
    createdAt: '2025-03-18T06:48:40.000Z',
    updatedAt: '2025-03-19T09:23:47.000Z',
    imageUrl: 'https://picsum.photos/200/300'
};

async function seedAdminUser() {
    try {
        const params = {
            TableName: 'users',
            Item: adminUser
        };

        await dynamoDb.put(params).promise();
        console.log('Admin user seeded successfully');
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
}

// Run the seeding function
seedAdminUser(); 