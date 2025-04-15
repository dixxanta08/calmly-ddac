// import { NextResponse } from "next/server";
// import AWS from "aws-sdk";

// const dynamoDb = new AWS.DynamoDB.DocumentClient({
//     endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT, // LocalStack endpoint
//     region: process.env.NEXT_PUBLIC_AWS_REGION,
//     accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
//     secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
// });


// const getTherapistsFromDynamoDB = async () => {
//     const params = {
//         TableName: 'users',
//         FilterExpression: '#role = :role',
//         ExpressionAttributeNames: {
//             '#role': 'role',
//         },
//         ExpressionAttributeValues: {
//             ':role': 'therapist',
//         },
//     };

//     try {
//         const result = await dynamoDb.scan(params).promise();
//         return result.Items;
//     } catch (error) {
//         console.log(error);
//         throw new Error('Error fetching therapists from DynamoDB');
//     }
// }

// // Handle GET request for all users
// export async function GET() {

//     try {
//         const users = await getTherapistsFromDynamoDB();  // Fetch all users
//         return NextResponse.json(users, { status: 200 });  // Respond with the list of users
//     } catch (error) {
//         console.log(error);
//         return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });  // Error handling
//     }
// }


import { NextResponse } from "next/server";

import { Appointment, User, EducationalMaterial } from "@/app/models/index";

// Fetch therapists from the database using Sequelize
const getTherapistsFromDatabase = async () => {
    try {
        // Assuming 'role' is a column in the 'users' table and the value for therapists is 'therapist'
        const therapists = await User.findAll({
            where: {
                role: 'therapist',  // Filter users where the role is 'therapist'
            }
        });
        return therapists; // Return the therapists found in the database
    } catch (error) {
        console.log(error);
        throw new Error('Error fetching therapists from the database');
    }
};

// Handle GET request for all therapists
export async function GET() {
    try {
        const therapists = await getTherapistsFromDatabase();  // Fetch all therapists from the database
        return NextResponse.json(therapists, { status: 200 });  // Respond with the list of therapists
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch therapists' }, { status: 500 });  // Error handling
    }
}
