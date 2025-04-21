import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

// Fetch all users from DynamoDB
const getUsersFromDynamoDB = async () => {
    const params = {
        TableName: 'users',
    };

    try {
        const result = await dynamoDb.scan(params).promise();
        return result.Items;
    } catch (error) {
        console.log(error);
        throw new Error('Error fetching users from DynamoDB');
    }
}

// Fetch a user by email or phone number
const getUserByEmailOrPhone = async (email, phone) => {
    const params = {
        TableName: 'users',
        FilterExpression: 'email = :email OR phone = :phone',
        ExpressionAttributeValues: {
            ':email': email,
            ':phone': phone,
        },
    };

    try {
        const result = await dynamoDb.scan(params).promise();
        return result.Items;
    } catch (error) {
        console.log(error);
        throw new Error('Error checking for existing user');
    }
}

export async function GET() {
    try {
        const users = await getUsersFromDynamoDB();
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// Handle POST request for creating a new user
export async function POST(req) {
    try {
        const { name, phone, email, password, role, imageUrl } = await req.json();

        // Check if the email or phone already exists
        const existingUser = await getUserByEmailOrPhone(email, phone);
        if (existingUser.length > 0) {
            return NextResponse.json({ error: 'Email or phone number must be unique' }, { status: 400 });
        }

        // If email and phone are unique, create the new user
        const newUser = {
            id: new Date().getTime().toString(),
            name,
            phone,
            email,
            password: await bcrypt.hash(password || 'password', 10),
            role: role || 'patient',
            imageUrl: imageUrl || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const params = {
            TableName: 'users',
            Item: newUser,
        };

        // Save user to DynamoDB
        await dynamoDb.put(params).promise();

        // Return the newly created user
        return NextResponse.json(newUser, { status: 201 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
