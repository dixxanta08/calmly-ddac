import { NextResponse } from "next/server";
import AWS from "aws-sdk";
import { APPOINTMENTSTABLENAME, TIME_SLOTS } from "@/constants";

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

export async function GET(req, { params }) {
    const { id: therapist_id } = await params;
    const date = req.nextUrl.searchParams.get('date');

    try {
        // Create a date object and adjust for timezone
        const inputDate = new Date(date);
        // Add timezone offset to get the correct date
        inputDate.setMinutes(inputDate.getMinutes() + inputDate.getTimezoneOffset());


        console.log("THERAPIST ID:", therapist_id);
        console.log("Input date:", date);

        // Get all appointments for this therapist on this date
        const result = await dynamoDb.scan({
            TableName: APPOINTMENTSTABLENAME,
            FilterExpression: "therapist_id = :therapist_id AND begins_with(appointmentDateTime, :date)",
            ExpressionAttributeValues: {
                ":therapist_id": therapist_id,
                ":date": date
            }
        }).promise();

        console.log("Found appointments:", result.Items);

        // Map the appointments to time slots
        const bookedSlots = result.Items.map(appointment => {
            const appointmentTime = new Date(appointment.appointmentDateTime);
            const hour = appointmentTime.getHours();
            const formattedHour = hour.toString().padStart(2, '0');
            const nextHour = ((hour + 1) % 24).toString().padStart(2, '0');
            const slot = `${formattedHour}:00 - ${nextHour}:00`;
            console.log(`Appointment at ${appointment.appointmentDateTime} maps to slot: ${slot}`);
            return slot;
        });

        console.log("Booked slots:", bookedSlots);

        // Create a status array for each time slot
        const slotsStatus = TIME_SLOTS.map(slot => {
            const isBooked = bookedSlots.includes(slot);
            console.log(`Slot ${slot} is ${isBooked ? 'booked' : 'available'}`);
            return {
                slot,
                status: isBooked ? "booked" : "available"
            };
        });

        return NextResponse.json(slotsStatus);
    } catch (error) {
        console.error("Error fetching therapist availability:", error);
        return NextResponse.json(
            { error: "Failed to fetch therapist availability" },
            { status: 500 }
        );
    }
}
