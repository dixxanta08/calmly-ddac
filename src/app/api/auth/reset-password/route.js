import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { User } from '@/app/models/index';

// Fetch user by email
const getUserByEmail = async (email) => {
    try {
        return await User.findOne({ where: { email } });
    } catch (error) {
        console.error('Error fetching user by email:', error);
        throw new Error('Failed to fetch user by email');
    }
};

// Handle reset password
export async function PUT(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const existingUser = await getUserByEmail(email);
        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Hash the new password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Update the password in the database
        await existingUser.update({ password: hashedPassword });

        return NextResponse.json(
            { message: 'Password updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Failed to update password:', error);
        return NextResponse.json(
            { error: 'Failed to update password' },
            { status: 500 }
        );
    }
}
