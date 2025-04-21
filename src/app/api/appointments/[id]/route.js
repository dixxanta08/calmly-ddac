import { NextResponse } from "next/server";
import AWS from "aws-sdk";
import { APPOINTMENTSTABLENAME } from "@/constants";
import { sendAppointmentNotification } from "../../../../services/notificationService";

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

// Get appointment by ID
export async function GET(req, { params }) {
    const { id } = params;

    try {
        const params = {
            TableName: APPOINTMENTSTABLENAME,
            Key: { appointmentId: id }
        };

        const result = await dynamoDb.get(params).promise();

        if (!result.Item) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }

        return NextResponse.json(result.Item, { status: 200 });
    } catch (error) {
        console.error("Error fetching appointment:", error);
        return NextResponse.json({ error: "Failed to fetch appointment" }, { status: 500 });
    }
}

// Update appointment status
export async function PUT(req, { params }) {
    const { id } = params;
    const { status } = await req.json();

    try {
        // Get current appointment
        const result = await dynamoDb.get({
            TableName: APPOINTMENTSTABLENAME,
            Key: { appointmentId: id }
        }).promise();

        if (!result.Item) {
            return NextResponse.json(
                { error: "Appointment not found" },
                { status: 404 }
            );
        }

        const appointment = result.Item;

        // Update appointment status
        await dynamoDb.update({
            TableName: APPOINTMENTSTABLENAME,
            Key: { appointmentId: id },
            UpdateExpression: "set #status = :status",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":status": status
            }
        }).promise();

        // Send notifications if status has changed
        if (appointment.status !== status) {
            const therapistEmail = await getUserEmail(appointment.therapist_id);
            const patientEmail = await getUserEmail(appointment.patient_id);

            console.log("THERAPIST EMAIL", therapistEmail);
            console.log("PATIENT EMAIL", patientEmail);
            // Send notification to therapist
            if (therapistEmail) {
                await sendAppointmentNotification(therapistEmail, 'updated', {
                    ...appointment,
                    status,
                    therapist_name: appointment.patient_name // Swap names for therapist notification
                });
            }

            // Send notification to patient
            if (patientEmail) {
                await sendAppointmentNotification(patientEmail, 'updated', {
                    ...appointment,
                    status
                });
            }
        }

        return NextResponse.json({ status });
    } catch (error) {
        console.error("Error updating appointment:", error);
        return NextResponse.json(
            { error: "Failed to update appointment" },
            { status: 500 }
        );
    }
}

// Delete appointment
export async function DELETE(req, { params }) {
    const { id } = params;

    try {
        // Get appointment details before deletion
        const result = await dynamoDb.get({
            TableName: APPOINTMENTSTABLENAME,
            Key: { appointmentId: id }
        }).promise();

        if (!result.Item) {
            return NextResponse.json(
                { error: "Appointment not found" },
                { status: 404 }
            );
        }

        const appointment = result.Item;

        // Delete appointment
        await dynamoDb.delete({
            TableName: APPOINTMENTSTABLENAME,
            Key: { appointmentId: id }
        }).promise();

        // Send notifications about cancellation
        const therapistEmail = await getUserEmail(appointment.therapist_id);
        const patientEmail = await getUserEmail(appointment.patient_id);

        // Send notification to therapist
        if (therapistEmail) {
            await sendAppointmentNotification(therapistEmail, 'cancelled', {
                ...appointment,
                therapist_name: appointment.patient_name // Swap names for therapist notification
            });
        }

        // Send notification to patient
        if (patientEmail) {
            await sendAppointmentNotification(patientEmail, 'cancelled', appointment);
        }

        return NextResponse.json({ message: "Appointment deleted successfully" });
    } catch (error) {
        console.error("Error deleting appointment:", error);
        return NextResponse.json(
            { error: "Failed to delete appointment" },
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

export async function PATCH(req, { params }) {
    const { id } = await params;
    const updates = await req.json();

    try {
        // Get current appointment
        const result = await dynamoDb.get({
            TableName: APPOINTMENTSTABLENAME,
            Key: { appointmentId: id }
        }).promise();

        if (!result.Item) {
            return NextResponse.json(
                { error: "Appointment not found" },
                { status: 404 }
            );
        }

        const appointment = result.Item;
        const previousStatus = appointment.status;

        // Prepare update expression parts
        const updateParts = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        // Handle each update field
        Object.entries(updates).forEach(([key, value]) => {
            if (key !== 'appointmentId') { // Don't allow updating the ID
                updateParts.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = value;
            }
        });

        // Add updatedAt timestamp
        updateParts.push("#updatedAt = :updatedAt");
        expressionAttributeNames["#updatedAt"] = "updatedAt";
        expressionAttributeValues[":updatedAt"] = new Date().toISOString();

        // Combine all update parts
        const updateExpression = "set " + updateParts.join(", ");

        // Update appointment
        await dynamoDb.update({
            TableName: APPOINTMENTSTABLENAME,
            Key: { appointmentId: id },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        }).promise();

        // Send notifications if status has changed
        if (updates.status && previousStatus !== updates.status) {
            const therapistEmail = await getUserEmail(appointment.therapist_id);
            const patientEmail = await getUserEmail(appointment.patient_id);

            // Send notification to therapist
            if (therapistEmail) {
                await sendAppointmentNotification(therapistEmail, 'updated', {
                    ...appointment,
                    ...updates,
                    therapist_name: appointment.patient_name // Swap names for therapist notification
                });
            }

            // Send notification to patient
            if (patientEmail) {
                await sendAppointmentNotification(patientEmail, 'updated', {
                    ...appointment,
                    ...updates
                });
            }
        }

        return NextResponse.json({ message: "Appointment updated successfully" });
    } catch (error) {
        console.error("Error updating appointment:", error);
        return NextResponse.json(
            { error: "Failed to update appointment" },
            { status: 500 }
        );
    }
}

