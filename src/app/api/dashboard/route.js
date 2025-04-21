import { NextResponse } from "next/server";
import AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

// Handle the different roles (admin, therapist, patient) and fetch appropriate data from DynamoDB
export async function GET(req) {
    try {
        const role = req.nextUrl.searchParams.get('role');
        const userId = req.nextUrl.searchParams.get('userId');
        console.log("\n\n\\n");

        // Admin Logic
        if (role === "admin") {
            // Get all patients, appointments, and educational materials
            const patientsResult = await dynamoDb.scan({
                TableName: 'users',
                FilterExpression: '#role = :role',
                ExpressionAttributeNames: {
                    '#role': 'role'
                },
                ExpressionAttributeValues: {
                    ':role': 'patient'
                }
            }).promise();

            const appointmentsResult = await dynamoDb.scan({
                TableName: 'appointments'
            }).promise();

            const educationalMaterialsResult = await dynamoDb.scan({
                TableName: 'educationalMaterials',
                Limit: 3
            }).promise();

            const totalPatients = patientsResult.Items.length;
            const upcomingAppointments = appointmentsResult.Items.filter(appointment => appointment.status === 'upcoming').length;
            const pastAppointments = appointmentsResult.Items.filter(appointment => appointment.status === 'past').length;
            const cancelledAppointments = appointmentsResult.Items.filter(appointment => appointment.status === 'cancelled').length;

            const educationalMaterials = educationalMaterialsResult.Items.map(item => ({
                name: item.name,
                description: item.description,
                tags: item.tags,
                fileUrl: item.fileUrl
            }));

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
            const appointmentsResult = await dynamoDb.scan({
                TableName: 'appointments',
                FilterExpression: 'therapist_id = :therapist_id',
                ExpressionAttributeValues: {
                    ':therapist_id': userId
                }
            }).promise();

            const upcomingAppointments = appointmentsResult.Items.filter(appointment => appointment.status === 'upcoming').length;
            const pastAppointments = appointmentsResult.Items.filter(appointment => appointment.status === 'past').length;
            const cancelledAppointments = appointmentsResult.Items.filter(appointment => appointment.status === 'cancelled').length;

            // Fetch the therapist's name
            const therapistResult = await dynamoDb.get({
                TableName: 'users',
                Key: { id: userId }
            }).promise();

            const therapistName = therapistResult.Item ? therapistResult.Item.name : "Unknown";
            console.log("Therapist Name:", therapistName);

            // Fetch educational materials uploaded by the therapist
            const educationalMaterialsResult = await dynamoDb.scan({
                TableName: 'educationalMaterials',
                FilterExpression: 'uploadedBy = :uploadedBy',
                ExpressionAttributeValues: {
                    ':uploadedBy': therapistName
                },
                Limit: 4
            }).promise();

            return NextResponse.json({
                upcomingAppointments,
                pastAppointments,
                cancelledAppointments,
                educationalMaterials: educationalMaterialsResult.Items,
            });
        }

        // Patient Logic
        if (role === "patient") {
            // Fetch patient's appointments
            const appointmentsResult = await dynamoDb.scan({
                TableName: 'appointments',
                FilterExpression: 'patient_id = :patient_id',
                ExpressionAttributeValues: {
                    ':patient_id': userId
                }
            }).promise();

            const upcomingAppointments = appointmentsResult.Items.filter(appointment => appointment.status === 'upcoming').length;
            const pastAppointments = appointmentsResult.Items.filter(appointment => appointment.status === 'past').length;
            const cancelledAppointments = appointmentsResult.Items.filter(appointment => appointment.status === 'cancelled').length;

            // Fetch 4 therapists
            const therapistsResult = await dynamoDb.scan({
                TableName: 'users',
                FilterExpression: '#role = :role',
                ExpressionAttributeNames: {
                    '#role': 'role'
                },
                ExpressionAttributeValues: {
                    ':role': 'therapist'
                },
                Limit: 4
            }).promise();

            // Fetch 4 educational materials
            const educationalMaterialsResult = await dynamoDb.scan({
                TableName: 'educationalMaterials',
                Limit: 4
            }).promise();

            return NextResponse.json({
                upcomingAppointments,
                pastAppointments,
                cancelledAppointments,
                therapists: therapistsResult.Items,
                educationalMaterials: educationalMaterialsResult.Items,
            });
        }

        return NextResponse.json({ error: "Role not recognized" }, { status: 400 });
    } catch (error) {
        console.error("Error fetching data from DynamoDB:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
