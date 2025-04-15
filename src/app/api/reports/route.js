import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { User, Appointment, EducationalMaterial } from '@/app/models';
import Sequelize from 'sequelize';
import { Op } from 'sequelize';

export async function GET(request) {
    try {
        // Check authentication and admin role


        // Get total users count by role
        const userStats = await User.findAll({
            attributes: [
                'role',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['role']
        });

        // Get total appointments count and stats
        const totalAppointments = await Appointment.count();
        const upcomingAppointments = await Appointment.count({
            where: { status: 'upcoming' }
        });
        const completedAppointments = await Appointment.count({
            where: { status: 'completed' }
        });

        // Get appointments for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const monthlyAppointments = await Appointment.count({
            where: {
                appointmentDateTime: {
                    [Op.between]: [startOfMonth, endOfMonth]
                }
            }
        });

        // Get educational materials stats
        const totalMaterials = await EducationalMaterial.count();

        // Get all materials to analyze tags
        const allMaterials = await EducationalMaterial.findAll({
            attributes: ['tags']
        });

        // Analyze tags to create category stats
        const tagStats = {};
        allMaterials.forEach(material => {
            const tags = material.tags || [];
            tags.forEach(tag => {
                tagStats[tag] = (tagStats[tag] || 0) + 1;
            });
        });

        // Format user stats
        const formattedUserStats = {};
        userStats.forEach(stat => {
            formattedUserStats[stat.role] = stat.getDataValue('count');
        });

        const report = {
            users: {
                total: Object.values(formattedUserStats).reduce((a, b) => a + b, 0),
                byRole: formattedUserStats
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