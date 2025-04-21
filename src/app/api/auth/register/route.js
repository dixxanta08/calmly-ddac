import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

export async function POST(req) {
    try {
        const { email, password, name, phoneNumber: phone } = await req.json();
        console.log("Creating user with email:", email);

        // Validate input fields
        if (!email || !password || !name || !phone) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Check if user already exists
        const existingUserParams = {
            TableName: 'users',
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
            }
        };

        const existingUserResult = await dynamoDb.scan(existingUserParams).promise();
        const existingUser = existingUserResult.Items[0];

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: new Date().getTime().toString(),
            email,
            password: hashedPassword,
            name,
            phone,
            role: 'patient',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const params = {
            TableName: 'users',
            Item: newUser
        };

        await dynamoDb.put(params).promise();

        return NextResponse.json({ message: "User created successfully", user: newUser }, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
    }
}
