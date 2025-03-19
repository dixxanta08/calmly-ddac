import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";


import { Appointment, User, EducationalMaterial } from "@/app/models/index";


export async function POST(req) {
    try {
        const { email, password, name, phoneNumber: phone } = await req.json();
        console.log("Creating user with email:", email);

        // Validate input fields
        if (!email || !password || !name || !phone) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await User.create({
            email,
            password: hashedPassword,
            name,
            phone,
        });

        return NextResponse.json({ message: "User created successfully", user: newUser }, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
    }
}
