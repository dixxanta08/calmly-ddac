import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';


// Configure AWS
AWS.config.update({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY
});

const sns = new AWS.SNS();

export async function POST(request) {
    try {

        const { email } = await request.json();

        const params = {
            TopicArn: process.env.SNS_TOPIC,
            Protocol: "email",
            Endpoint: email
        };

        await sns.subscribe(params).promise();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to add subscription:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    const email = request.nextUrl.searchParams.get('email');
    try {
        const data = await sns.listSubscriptionsByTopic({
            TopicArn: process.env.SNS_TOPIC
        }).promise();
        console.log("Subscriptions:", JSON.stringify(data, null, 2));
        const isSubscribed = data.Subscriptions.some(sub => sub.Endpoint === email && sub.SubscriptionArn !== 'PendingConfirmation');
        return NextResponse.json({ isSubscribed });
    } catch (error) {
        console.error("Failed to check subscription:", error);
        return NextResponse.json({ isSubscribed: false, error: error.message }, { status: 500 });
    }
}
