import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

// Fetch user by email
const getUserByEmail = async (email) => {
    try {
        const params = {
            TableName: 'users',
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
            }
        };
        const result = await dynamoDb.scan(params).promise();
        return result.Items[0]; // Return the first matching user
    } catch (error) {
        console.error('Error fetching user by email:', error);
        throw new Error('Failed to fetch user by email');
    }
};

// Handle reset password
export async function PUT(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const existingUser = await getUserByEmail(email);
        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the password in DynamoDB
        const params = {
            TableName: 'users',
            Key: { id: existingUser.id },
            UpdateExpression: 'set password = :password, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':password': hashedPassword,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };

        await dynamoDb.update(params).promise();

        return NextResponse.json(
            { message: 'Password updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Failed to update password:', error);
        return NextResponse.json(
            { error: 'Failed to update password' },
            { status: 500 }
        );
    }
}
