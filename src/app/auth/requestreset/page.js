"use client";
import { requestReset } from "@/services/apiService";
import { useState } from "react";

export default function RequestResetForm() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await requestReset(email);
        const data = await response.json();
        setMessage(data.message);
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="border p-2 w-full"
                />
                <button type="submit" className="bg-blue-500 text-white p-2">
                    Send Reset Link
                </button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}
