// import { NextResponse } from "next/server";
// import AWS from "aws-sdk";
// import { APPOINTMENTSTABLENAME, TIME_SLOTS } from "@/constants";

// const dynamoDb = new AWS.DynamoDB.DocumentClient({
//     endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT, // LocalStack endpoint
//     region: process.env.NEXT_PUBLIC_AWS_REGION,
//     accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
//     secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
// });



// export async function GET(req, { params }) {
//     // Extract therapist_id from the dynamic route parameters (URL)
//     const therapist_id = await params.id;  // therapist_id passed in the URL like /api/appointments/[id]

//     // Extract 'date' from the query params
//     const date = req.nextUrl.searchParams.get('date');  // Date passed in query params like ?date=2025-03-08

//     console.log('therapist_id:', therapist_id);
//     console.log('date:', date); // Example: 2025-03-08

//     try {
//         // Parse the date into a YYYY-MM-DD format (removes time part)
//         const formattedDate = new Date(date).toISOString().split('T')[0];  // Extract the date part (YYYY-MM-DD)

//         // Query for appointments on the given date for the therapist
//         const existingAppointments = await dynamoDb
//             .scan({
//                 TableName: APPOINTMENTSTABLENAME,
//                 FilterExpression: "#tid = :therapist_id AND begins_with(#adt, :date)",  // Filter by therapist_id and appointmentDateTime beginning with the date
//                 ExpressionAttributeNames: {
//                     "#tid": "therapist_id",  // therapist_id field in DynamoDB
//                     "#adt": "appointmentDateTime",  // the field storing the appointment timestamp
//                 },
//                 ExpressionAttributeValues: {
//                     ":therapist_id": therapist_id,  // therapist id passed in params
//                     ":date": formattedDate,  // Filter by the date portion (e.g., "2025-03-08")
//                 },
//             })
//             .promise();

//         // Get the booked time slots from existing appointments
//         const bookedSlots = existingAppointments.Items.map(item => {
//             // Extract the time portion from the appointmentDateTime
//             const appointmentTime = new Date(item.appointmentDateTime).toISOString().split('T')[1];  // Extract time part (HH:MM:SS)
//             const hour = appointmentTime.split(':')[0];  // Get the hour (e.g., '09', '10')

//             // Assuming time slots are in hour ranges (e.g., '09:00 - 10:00')
//             return `${hour}:00 - ${parseInt(hour) + 1}:00`;  // Format as '09:00 - 10:00', '10:00 - 11:00', etc.
//         });

//         console.log('existingAppointments:', existingAppointments);
//         console.log('bookedSlots:', bookedSlots);

//         // Assuming TIME_SLOTS is an array like ['09:00 - 10:00', '10:00 - 11:00', ..., '18:00 - 19:00']
//         const slotsStatus = TIME_SLOTS.map(slot => {
//             return {
//                 slot,
//                 status: bookedSlots.includes(slot) ? "booked" : "available"  // Check if slot is booked
//             };
//         });

//         return NextResponse.json(slotsStatus, { status: 200 });  // Return the slots status

//     } catch (error) {
//         console.error("Error fetching available slots:", error);
//         return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
//     }
// }

import { NextResponse } from "next/server";
import { Op } from "sequelize";
import { TIME_SLOTS } from "@/constants";  // Assuming TIME_SLOTS is defined elsewhere

import { Appointment, User, EducationalMaterial } from "@/app/models/index";

export async function GET(req, { params }) {
    const therapist_id = await params.id;  // therapist_id passed in the URL like /api/appointments/[id]
    const date = req.nextUrl.searchParams.get('date');  // Date passed in query params like ?date=2025-03-08

    console.log('therapist_id:', therapist_id);
    console.log('date:', date); // Example: 2025-03-08

    try {
        // Parse the date into a YYYY-MM-DD format (removes time part)
        const formattedDate = new Date(date).toISOString().split('T')[0];  // Extract the date part (YYYY-MM-DD)

        // Query for appointments on the given date for the therapist
        const existingAppointments = await Appointment.findAll({
            where: {
                therapist_id,  // Filter by therapist_id
                appointmentDateTime: {
                    [Op.gte]: new Date(`${formattedDate}T00:00:00.000Z`),  // Start of the day (00:00:00)
                    [Op.lt]: new Date(`${formattedDate}T23:59:59.999Z`),  // End of the day (23:59:59)
                },
            },
        });

        // Log to check the structure of the result
        console.log('existingAppointments:', existingAppointments);

        // Get the booked time slots from existing appointments
        const bookedSlots = existingAppointments.map(item => {
            // Extract the time portion from the appointmentDateTime
            const appointmentTime = new Date(item.appointmentDateTime).toISOString().split('T')[1];  // Extract time part (HH:MM:SS)
            const hour = appointmentTime.split(':')[0];  // Get the hour (e.g., '09', '10')

            // Assuming time slots are in hour ranges (e.g., '09:00 - 10:00')
            return `${hour}:00 - ${parseInt(hour) + 1}:00`;  // Format as '09:00 - 10:00', '10:00 - 11:00', etc.
        });

        // Log the booked slots to verify
        console.log('bookedSlots:', bookedSlots);

        // Assuming TIME_SLOTS is an array like ['09:00 - 10:00', '10:00 - 11:00', ..., '18:00 - 19:00']
        const slotsStatus = TIME_SLOTS.map(slot => {
            return {
                slot,
                status: bookedSlots.includes(slot) ? "booked" : "available"  // Check if slot is booked
            };
        });

        return NextResponse.json(slotsStatus, { status: 200 });  // Return the slots status

    } catch (error) {
        console.error("Error fetching available slots:", error);
        return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
    }
}
