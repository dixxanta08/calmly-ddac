// /pages/api/auth/refresh-session.js
import { getSession } from "next-auth/react";
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

const handler = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    // Get the current session
    const session = await getSession({ req });

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch the latest user data from the database based on the session user
    const params = {
        TableName: 'users',
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': session.user.email
        }
    };

    const result = await dynamoDb.scan(params).promise();
    const user = result.Items[0];

    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    // Send the updated user data to the client
    return res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
    });
}

export default handler;  