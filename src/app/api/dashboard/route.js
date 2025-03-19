// import { NextResponse } from "next/server";
// import AWS from "aws-sdk";
// import { EDUCATIONALMATERIALSTABLENAME, APPOINTMENTSTABLENAME, USERTABLENAME } from "@/constants";

// const dynamoDb = new AWS.DynamoDB.DocumentClient({
//     endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT, // LocalStack endpoint
//     region: process.env.NEXT_PUBLIC_AWS_REGION,
//     accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
//     secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
// });

// export async function GET(req) {
//     try {
//         const role = req.nextUrl.searchParams.get('role');
//         const userId = req.nextUrl.searchParams.get('userId');
//         // Admin Logic
//         if (role === "admin") {
//             // Get all patients, appointments, and educational materials
//             const patientsData = await dynamoDb.scan({ TableName: USERTABLENAME }).promise();
//             const appointmentsData = await dynamoDb.scan({ TableName: APPOINTMENTSTABLENAME }).promise();
//             const educationalMaterialsData = await dynamoDb.scan({ TableName: EDUCATIONALMATERIALSTABLENAME }).promise();

//             const totalPatients = patientsData.Items.length;
//             const upcomingAppointments = appointmentsData.Items.filter(appointment => appointment.status === 'upcoming').length;

//             const pastAppointments = appointmentsData.Items.filter(appointment => appointment.status === 'past').length;
//             const cancelledAppointments = appointmentsData.Items.filter(appointment => appointment.status === 'cancelled').length;
//             const educationalMaterials = educationalMaterialsData.Items.map(item => ({
//                 name: item.name,
//                 description: item.description,
//                 tags: item.tags,
//                 fileUrl: item.fileUrl
//             }));

//             return NextResponse.json({
//                 totalPatients,
//                 upcomingAppointments,
//                 pastAppointments,
//                 cancelledAppointments,
//                 educationalMaterials: educationalMaterials.slice(0, 3) // Limit to 3 items
//             });
//         }

//         // Therapist Logic
//         if (role === "therapist") {
//             // Count appointments by status
//             const appointmentsData = await dynamoDb.scan({
//                 TableName: APPOINTMENTSTABLENAME,
//                 FilterExpression: "therapist_id = :therapist_id",
//                 ExpressionAttributeValues: { ":therapist_id": userId }
//             }).promise();
//             const upcomingAppointments = appointmentsData.Items.filter(appointment => appointment.status === 'upcoming').length;
//             const pastAppointments = appointmentsData.Items.filter(appointment => appointment.status === 'past').length;
//             const cancelledAppointments = appointmentsData.Items.filter(appointment => appointment.status === 'cancelled').length;

//             // Fetch the therapist's name (assuming you have a 'name' field in your user table)
//             const therapistData = await dynamoDb.query({
//                 TableName: USERTABLENAME,
//                 KeyConditionExpression: "id = :userId", // Assuming 'id' is the primary key or indexed field
//                 ExpressionAttributeValues: { ":userId": userId }
//             }).promise();

//             const therapistName = therapistData.Items[0] ? therapistData.Items[0].name : "Unknown"; // Default to "Unknown" if no name is found

//             // Fetch educational materials uploaded by the therapist
//             const educationalMaterialsData = await dynamoDb.scan({
//                 TableName: EDUCATIONALMATERIALSTABLENAME,
//                 FilterExpression: "uploadedBy = :uploadedBy",
//                 ExpressionAttributeValues: { ":uploadedBy": therapistName }
//             }).promise();


//             return NextResponse.json({
//                 upcomingAppointments,
//                 pastAppointments,
//                 cancelledAppointments,
//                 educationalMaterials: educationalMaterialsData.Items.slice(0, 4),

//             });
//         }


//         // Patient Logic
//         if (role === "patient") {
//             // Fetch patient's appointments
//             const appointmentsData = await dynamoDb.scan({
//                 TableName: APPOINTMENTSTABLENAME,
//                 FilterExpression: "patient_id = :patient_id",
//                 ExpressionAttributeValues: {
//                     ":patient_id": userId,
//                 },
//             }).promise();
//             const upcomingAppointments = appointmentsData.Items.filter(appointment => appointment.status === 'upcoming').length;
//             const pastAppointments = appointmentsData.Items.filter(appointment => appointment.status === 'past').length;
//             const cancelledAppointments = appointmentsData.Items.filter(appointment => appointment.status === 'cancelled').length;

//             // Fetch 4 therapists
//             const therapistsData = await dynamoDb.scan({
//                 TableName: USERTABLENAME,
//                 FilterExpression: "#role = :role", // Use a placeholder for the reserved keyword
//                 ExpressionAttributeNames: {
//                     "#role": "role", // Map the placeholder to the 'role' attribute
//                 },
//                 ExpressionAttributeValues: {
//                     ":role": "therapist", // The value to filter by
//                 },
//             }).promise();


//             // Fetch 4 educational materials
//             const educationalMaterialsData = await dynamoDb.scan({
//                 TableName: EDUCATIONALMATERIALSTABLENAME,
//             }).promise();

//             return NextResponse.json({
//                 upcomingAppointments,
//                 pastAppointments,
//                 cancelledAppointments,
//                 therapists: therapistsData.Items.slice(0, 4), // Limit to 4 therapists
//                 educationalMaterials: educationalMaterialsData.Items.slice(0, 4), // Limit to 4 items
//             });
//         }

//         return NextResponse.json({ error: "Role not recognized" }, { status: 400 });
//     } catch (error) {
//         console.error("Error fetching data from DynamoDB:", error);
//         return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
//     }
// }
import { NextResponse } from "next/server";
import { Op } from "sequelize";


import { Appointment, User, EducationalMaterial } from "@/app/models/index";

// Handle the different roles (admin, therapist, patient) and fetch appropriate data from SQL database
export async function GET(req) {
    try {
        const role = req.nextUrl.searchParams.get('role');
        const userId = req.nextUrl.searchParams.get('userId');
        console.log("\n\n\\n");


        // Admin Logic
        if (role === "admin") {
            // Get all patients, appointments, and educational materials
            const totalPatients = await User.count({ where: { role: 'patient' } });
            const upcomingAppointments = await Appointment.count({ where: { status: 'upcoming' } });
            const pastAppointments = await Appointment.count({ where: { status: 'past' } });
            const cancelledAppointments = await Appointment.count({ where: { status: 'cancelled' } });

            const educationalMaterials = await EducationalMaterial.findAll({
                limit: 3, // Limit to 3 items
                attributes: ['name', 'description', 'tags', 'fileUrl'],
            });

            return NextResponse.json({
                totalPatients,
                upcomingAppointments,
                pastAppointments,
                cancelledAppointments,
                educationalMaterials,
            });
        }

        // Therapist Logic
        if (role === "therapist") {
            // Count appointments by status for the therapist
            const upcomingAppointments = await Appointment.count({
                where: {
                    therapist_id: userId,
                    status: 'upcoming',
                },
            });
            const pastAppointments = await Appointment.count({
                where: {
                    therapist_id: userId,
                    status: 'past',
                },
            });
            const cancelledAppointments = await Appointment.count({
                where: {
                    therapist_id: userId,
                    status: 'cancelled',
                },
            });

            // Fetch the therapist's name
            const therapist = await User.findOne({
                where: { id: userId },
                attributes: ['name'],
            });
            const therapistName = therapist ? therapist.name : "Unknown";

            console.log("Therapist Name:", therapistName);
            // Fetch educational materials uploaded by the therapist
            const educationalMaterials = await EducationalMaterial.findAll({
                where: { uploadedBy: therapistName },
                limit: 4, // Limit to 4 items
            });

            return NextResponse.json({
                upcomingAppointments,
                pastAppointments,
                cancelledAppointments,
                educationalMaterials,
            });
        }

        // Patient Logic
        if (role === "patient") {
            // Fetch patient's appointments
            const upcomingAppointments = await Appointment.count({
                where: {
                    patient_id: userId,
                    status: 'upcoming',
                },
            });
            const pastAppointments = await Appointment.count({
                where: {
                    patient_id: userId,
                    status: 'past',
                },
            });
            const cancelledAppointments = await Appointment.count({
                where: {
                    patient_id: userId,
                    status: 'cancelled',
                },
            });

            // Fetch 4 therapists
            const therapists = await User.findAll({
                where: { role: 'therapist' },
                limit: 4, // Limit to 4 therapists
            });

            // Fetch 4 educational materials
            const educationalMaterials = await EducationalMaterial.findAll({
                limit: 4, // Limit to 4 items
            });

            return NextResponse.json({
                upcomingAppointments,
                pastAppointments,
                cancelledAppointments,
                therapists,
                educationalMaterials,
            });
        }

        return NextResponse.json({ error: "Role not recognized" }, { status: 400 });
    } catch (error) {
        console.error("Error fetching data from Sequelize:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
