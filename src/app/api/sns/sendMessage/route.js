import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
});

// Initialize SNS client
const sns = new AWS.SNS({
    endpoint: process.env.NEXT_PUBLIC_SNS_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
});

export async function POST(request) {
    try {
        const { email, subject, message } = await request.json();

        if (!email || !subject || !message) {
            return NextResponse.json(
                { error: "Missing required fields: email, subject, message" },
                { status: 400 }
            );
        }

        console.log(`Sending notification to ${email}: ${subject} - ${message}`);

        // In a production environment, you would use a proper SNS topic
        // For local development, we'll just log the notification
        if (process.env.NODE_ENV === 'development') {
            console.log('SNS notification would be sent in production');
            return NextResponse.json({ success: true, message: "Notification logged (development mode)" });
        }

        // Create SNS publish parameters
        const params = {
            Message: JSON.stringify({
                email,
                subject,
                message,
                timestamp: new Date().toISOString()
            }),
            TopicArn: process.env.NEXT_PUBLIC_SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:123456789012:appointment-notifications'
        };

        // Publish to SNS topic
        await sns.publish(params).promise();
        console.log(`SNS notification sent to ${email}`);

        return NextResponse.json({ success: true, message: "Notification sent successfully" });
    } catch (error) {
        console.error("Error sending notification:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}