import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient({
    endpoint: process.env.NEXT_PUBLIC_DYNAMODB_ENDPOINT,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    accessKeyId: process.env.NEXT_PUBLIC_DYNAMODB_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_DYNAMODB_SECRET_ACCESS_KEY,
});

export async function GET(request) {
    try {
        // Check authentication and admin role
        const session = await getServerSession();
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get total users count by role
        const usersResult = await dynamoDb.scan({
            TableName: 'users'
        }).promise();

        const userStats = {};
        usersResult.Items.forEach(user => {
            userStats[user.role] = (userStats[user.role] || 0) + 1;
        });

        // Get total appointments count and stats
        const appointmentsResult = await dynamoDb.scan({
            TableName: 'appointments'
        }).promise();

        const appointments = appointmentsResult.Items;
        const totalAppointments = appointments.length;
        const upcomingAppointments = appointments.filter(apt => apt.status === 'upcoming').length;
        const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;

        // Get appointments for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const monthlyAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDateTime);
            return aptDate >= startOfMonth && aptDate <= endOfMonth;
        }).length;

        // Get educational materials stats
        const materialsResult = await dynamoDb.scan({
            TableName: 'educationalMaterials'
        }).promise();

        const totalMaterials = materialsResult.Items.length;

        // Analyze tags to create category stats
        const tagStats = {};
        materialsResult.Items.forEach(material => {
            const tags = material.tags || [];
            tags.forEach(tag => {
                tagStats[tag] = (tagStats[tag] || 0) + 1;
            });
        });

        const report = {
            users: {
                total: Object.values(userStats).reduce((a, b) => a + b, 0),
                byRole: userStats
            },
            appointments: {
                total: totalAppointments,
                upcoming: upcomingAppointments,
                completed: completedAppointments,
                thisMonth: monthlyAppointments
            },
            educationalMaterials: {
                total: totalMaterials,
                byTags: tagStats
            },
            generatedAt: new Date().toISOString()
        };

        return NextResponse.json(report);
    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}