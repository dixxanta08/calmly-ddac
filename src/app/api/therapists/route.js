import { NextResponse } from "next/server";
import AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

const getTherapistsFromDynamoDB = async () => {
    const params = {
        TableName: 'users',
        FilterExpression: '#role = :role',
        ExpressionAttributeNames: {
            '#role': 'role',
        },
        ExpressionAttributeValues: {
            ':role': 'therapist',
        },
    };

    try {
        const result = await dynamoDb.scan(params).promise();
        return result.Items;
    } catch (error) {
        console.log(error);
        throw new Error('Error fetching therapists from DynamoDB');
    }
}

// Handle GET request for all therapists
export async function GET() {
    try {
        const therapists = await getTherapistsFromDynamoDB();
        return NextResponse.json(therapists, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to fetch therapists' }, { status: 500 });
    }
}
