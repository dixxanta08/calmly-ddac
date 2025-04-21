import { NextResponse } from "next/server";
import AWS from "aws-sdk";
import { APPOINTMENTSTABLENAME } from "@/constants";
import { sendAppointmentNotification } from "../../../services/notificationService";

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

// Handle GET request for fetching all appointments
export async function GET(req) {
    try {
        const role = req.nextUrl.searchParams.get('role');
        const userId = req.nextUrl.searchParams.get('userId');

        let params = {
            TableName: APPOINTMENTSTABLENAME
        };

        if (role === "therapist") {
            params.FilterExpression = "therapist_id = :userId";
            params.ExpressionAttributeValues = {
                ":userId": userId
            };
        } else if (role === "patient") {
            params.FilterExpression = "patient_id = :userId";
            params.ExpressionAttributeValues = {
                ":userId": userId
            };
        }

        const result = await dynamoDb.scan(params).promise();
        return NextResponse.json(result.Items, { status: 200 });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
    }
}

export async function POST(req) {
    const {
        therapist_id,
        therapist_name,
        patient_id,
        patient_name,
        bookedDateTime,
        appointmentDateTime,
    } = await req.json();

    try {
        // Check if an appointment already exists at the same date/time for the therapist
        const existing = await dynamoDb.scan({
            TableName: APPOINTMENTSTABLENAME,
            FilterExpression: "therapist_id = :therapist_id AND appointmentDateTime = :appointmentDateTime",
            ExpressionAttributeValues: {
                ":therapist_id": therapist_id,
                ":appointmentDateTime": appointmentDateTime
            }
        }).promise();

        if (existing.Items.length > 0) {
            return NextResponse.json(
                { error: "Appointment already exists for this date/time" },
                { status: 400 }
            );
        }

        // Create new appointment object
        const newAppointment = {
            appointmentId: `${therapist_id}-${patient_id}-${new Date().getTime()}`,
            therapist_id,
            therapist_name,
            patient_id,
            patient_name,
            status: "upcoming",
            bookedDateTime,
            appointmentDateTime,
            createdAt: new Date().toISOString()
        };

        // Save to DynamoDB
        await dynamoDb.put({
            TableName: APPOINTMENTSTABLENAME,
            Item: newAppointment
        }).promise();

        // Send notifications to both therapist and patient
        const therapistEmail = await getUserEmail(therapist_id);
        const patientEmail = await getUserEmail(patient_id);

        // Send notification to therapist
        if (therapistEmail) {
            await sendAppointmentNotification(therapistEmail, 'created', {
                ...newAppointment,
                therapist_name: patient_name // Swap names for therapist notification
            });
        }

        // Send notification to patient
        if (patientEmail) {
            await sendAppointmentNotification(patientEmail, 'created', newAppointment);
        }

        return NextResponse.json(newAppointment, { status: 201 });
    } catch (error) {
        console.error("Error creating appointment:", error);
        return NextResponse.json(
            { error: "Failed to create appointment" },
            { status: 500 }
        );
    }
}

// Helper function to get user email by ID
async function getUserEmail(userId) {
    try {
        const params = {
            TableName: "users",
            Key: { id: userId }
        };

        const result = await dynamoDb.get(params).promise();
        return result.Item?.email;
    } catch (error) {
        console.error("Error fetching user email:", error);
        return null;
    }
}
