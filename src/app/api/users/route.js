// import AWS from 'aws-sdk';
// import { NextResponse } from 'next/server';
// const bcrypt = require('bcryptjs');

// const dynamoDb = new AWS.DynamoDB.DocumentClient({
//     endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT, // LocalStack endpoint
//     region: process.env.NEXT_PUBLIC_AWS_REGION,
//     accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
//     secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
// });


// const s3 = new AWS.S3({
//     endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT,
//     accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
//     secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY,
//     s3ForcePathStyle: true,
// });

// // Fetch all users from DynamoDB
// const getUsersFromDynamoDB = async () => {
//     const params = {
//         TableName: 'users',
//     };

//     try {
//         const result = await dynamoDb.scan(params).promise(); // Use scan to get all users
//         return result.Items;  // Return all user items
//     } catch (error) {
//         console.log(error);
//         throw new Error('Error fetching users from DynamoDB');
//     }
// }


// // Fetch a user by email or phone number
// const getUserByEmailOrPhone = async (email, phone) => {
//     const params = {
//         TableName: 'users',
//         FilterExpression: 'email = :email OR phone = :phone',  // Search for email or phone
//         ExpressionAttributeValues: {
//             ':email': email,
//             ':phone': phone,
//         },
//     };

//     try {
//         const result = await dynamoDb.scan(params).promise();
//         return result.Items;  // Return matching items if any
//     } catch (error) {
//         console.log(error);
//         throw new Error('Error checking for existing user');
//     }
// }
// export async function GET() {

//     try {
//         const users = await getUsersFromDynamoDB();  // Fetch all users
//         return NextResponse.json(users, { status: 200 });  // Respond with the list of users
//     } catch (error) {
//         console.log(error);
//         return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });  // Error handling
//     }
// }


// // Handle POST request for creating a new user
// export async function POST(req) {
//     try {
//         const { name, phone, email, password, role } = await req.json();

//         // Check if the email or phone already exists
//         const existingUser = await getUserByEmailOrPhone(email, phone);
//         if (existingUser.length > 0) {
//             return NextResponse.json({ error: 'Email or phone number must be unique' }, { status: 400 });
//         }

//         // If email and phone are unique, create the new user
//         const newUser = {
//             id: new Date().toISOString(),
//             name,
//             phone,
//             email,
//             password: await bcrypt.hash(password, 10),
//             role,
//         };

//         const params = {
//             TableName: 'users',
//             Item: newUser,
//         };

//         // Save user to DynamoDB
//         await dynamoDb.put(params).promise();

//         // Return the newly created user
//         return NextResponse.json(newUser, { status: 201 });

//     } catch (error) {
//         console.log(error);
//         return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });  // Error handling
//     }
// }
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { Appointment, User, EducationalMaterial } from "@/app/models/index";

// Fetch all users from Sequelize
const getUsersFromDB = async () => {
    try {
        const users = await User.findAll();
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Error fetching users from database');
    }
};

// Fetch a user by email or phone number
const getUserByEmailOrPhone = async (email, phone) => {
    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [{ email }, { phone }],
            },
        });
        return user;
    } catch (error) {
        console.error('Error checking for existing user:', error);
        throw new Error('Error checking for existing user');
    }
};

// Handle GET request for fetching users
export async function GET() {
    try {
        const users = await getUsersFromDB();
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// Handle POST request for creating a new user
export async function POST(req) {
    try {
        const { name, phone, email, password, role } = await req.json();

        // Check if the email or phone already exists
        const existingUser = await getUserByEmailOrPhone(email, phone);
        if (existingUser) {
            return NextResponse.json({ error: 'Email or phone number must be unique' }, { status: 400 });
        }

        // Create a new user
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            phone,
            email,
            password: hashedPassword,
            role,
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
