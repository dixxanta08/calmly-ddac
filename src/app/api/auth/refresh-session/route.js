// /pages/api/auth/refresh-session.js
import { getSession } from "next-auth/react";
import { User } from "@/app/models"; // Your User model

const handler = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    // Get the current session
    const session = await getSession({ req });

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch the latest user data from the database based on the session user
    const user = await User.findOne({ where: { email: session.user.email } });

    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    // Send the updated user data to the client
    return res.status(200).json({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
    });
}

export { handler as GET };  