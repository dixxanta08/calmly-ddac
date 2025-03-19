// import { NextResponse } from "next/server";
// import AWS from "aws-sdk";
// import { APPOINTMENTSTABLENAME } from "@/constants";

// const dynamoDb = new AWS.DynamoDB.DocumentClient({
//     endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT, // LocalStack endpoint
//     region: process.env.NEXT_PUBLIC_AWS_REGION,
//     accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
//     secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
// });

// // Handle GET request for fetching all appointments
// export async function GET(req) {
//     try {
//         const role = req.nextUrl.searchParams.get('role');
//         const userId = req.nextUrl.searchParams.get('userId');

//         let result;

//         if (role === "admin") {
//             // Admin: fetch all appointments
//             result = await dynamoDb.scan({ TableName: APPOINTMENTSTABLENAME }).promise();
//         } else if (role === "therapist") {
//             // Therapist: fetch appointments filtered by therapist_id
//             result = await dynamoDb.scan({
//                 TableName: APPOINTMENTSTABLENAME,
//                 FilterExpression: "therapist_id = :therapist_id",
//                 ExpressionAttributeValues: {
//                     ":therapist_id": userId,
//                 },
//             }).promise();
//         } else if (role === "patient") {
//             // Patient: fetch appointments filtered by patient_id
//             result = await dynamoDb.scan({
//                 TableName: APPOINTMENTSTABLENAME,
//                 FilterExpression: "patient_id = :patient_id",
//                 ExpressionAttributeValues: {
//                     ":patient_id": userId,
//                 },
//             }).promise();
//         } else {
//             // Invalid role or no role specified
//             return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
//         }

//         // Return the result (appointments)
//         return NextResponse.json(result.Items, { status: 200 });

//     } catch (error) {
//         console.error("Error fetching appointments:", error);
//         return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
//     }
// }


// export async function POST(req) {
//     const {
//         therapist_id,
//         therapist_name,
//         patient_id,
//         patient_name,
//         bookedDateTime,
//         appointmentDateTime,
//     } = await req.json();

//     try {
//         // Check if an appointment already exists at the same date/time for the therapist
//         const existing = await dynamoDb
//             .scan({
//                 TableName: APPOINTMENTSTABLENAME,
//                 FilterExpression: "#tid = :therapist_id AND #adt = :appointmentDateTime",
//                 ExpressionAttributeNames: {
//                     "#tid": "therapist_id",
//                     "#adt": "appointmentDateTime",
//                 },
//                 ExpressionAttributeValues: {
//                     ":therapist_id": therapist_id,
//                     ":appointmentDateTime": appointmentDateTime,
//                 },
//             })
//             .promise();

//         if (existing.Items.length > 0) {
//             return NextResponse.json(
//                 { error: "Appointment already exists for this date/time" },
//                 { status: 400 }
//             );
//         }

//         // Create new appointment object
//         const newAppointment = {
//             appointmentId: `${therapist_id}-${patient_id}-${new Date().getTime()}`, // Generate unique ID
//             therapist_id,
//             therapist_name,
//             patient_id,
//             patient_name,
//             status: "upcoming",
//             bookedDateTime,
//             appointmentDateTime,

//             createdAt: new Date().toISOString(),
//         };
//         // title,
//         // meetingLink,
//         // rescheduledDateTime,
//         // rescheduledReason,
//         // rescheduledBy,
//         // cancelledBy,
//         // cancelledReason,
//         // feedback,

//         // Save to DynamoDB
//         await dynamoDb
//             .put({
//                 TableName: APPOINTMENTSTABLENAME,
//                 Item: newAppointment,
//             })
//             .promise();

//         return NextResponse.json(newAppointment, { status: 201 });
//     } catch (error) {
//         console.error("Error creating appointment:", error);
//         return NextResponse.json(
//             { error: "Failed to create appointment" },
//             { status: 500 }
//         );
//     }
// }



import { NextResponse } from "next/server";
import { Appointment, User } from "@/app/models/index";

// Handle GET request for fetching all appointments
export async function GET(req) {
    try {
        const role = req.nextUrl.searchParams.get('role');
        const userId = req.nextUrl.searchParams.get('userId');

        let result;

        if (role === "admin") {
            // Admin: fetch all appointments
            result = await Appointment.findAll();
        } else if (role === "therapist") {
            // Therapist: fetch appointments filtered by therapist_id
            result = await Appointment.findAll({
                where: { therapist_id: userId },
                include: [
                    {
                        model: User,
                        as: 'Therapist', // Alias for therapist
                        attributes: ['id', 'name'], // Include therapist's name and id
                    },
                    {
                        model: User,
                        as: 'Patient', // Alias for patient
                        attributes: ['id', 'name'], // Include patient's name and id
                    }
                ],
            });
        } else if (role === "patient") {
            // Patient: fetch appointments filtered by patient_id
            result = await Appointment.findAll({
                where: { patient_id: userId },
                include: [
                    {
                        model: User,
                        as: 'Therapist', // Alias for therapist
                        attributes: ['id', 'name'], // Include therapist's name and id
                    },
                    {
                        model: User,
                        as: 'Patient', // Alias for patient
                        attributes: ['id', 'name'], // Include patient's name and id
                    }
                ],
            });
        } else {
            // Invalid role or no role specified
            return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
        }

        // Return the result (appointments)
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
    }
}

// Handle POST request for creating new appointments
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
        const existing = await Appointment.findOne({
            where: {
                therapist_id,
                appointmentDateTime,
            }
        });

        if (existing) {
            return NextResponse.json(
                { error: "Appointment already exists for this date/time" },
                { status: 400 }
            );
        }

        // Create new appointment object
        const newAppointment = await Appointment.create({
            appointmentId: `${therapist_id}-${patient_id}-${new Date().getTime()}`, // Generate unique ID
            therapist_id,
            therapist_name,
            patient_id,
            patient_name,
            status: "upcoming",
            bookedDateTime,
            appointmentDateTime,
        });

        return NextResponse.json(newAppointment, { status: 201 });
    } catch (error) {
        console.error("Error creating appointment:", error);
        return NextResponse.json(
            { error: "Failed to create appointment" },
            { status: 500 }
        );
    }
}
