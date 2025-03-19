import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
const dotenv = require("dotenv");
dotenv.config();

const sesClient = new SESClient({
    region: process.env.RE, // Change to your AWS region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export async function sendResetEmail({ to, resetLink }) {
    const params = {
        Source: process.env.FROM_EMAIL, // Must be a verified email
        Destination: {
            ToAddresses: [to],
        },
        Message: {
            Subject: { Data: "Password Reset Request" },
            Body: {
                Html: {
                    Data: `
            <h1>Password Reset</h1>
            <p>Click the link below to reset your password:</p>
            <a href="${resetLink}" target="_blank" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#ffffff;text-decoration:none;border-radius:5px;">
              Reset Password
            </a>
            <p>If you did not request this, please ignore this email.</p>
          `,
                },
            },
        },
    };

    const command = new SendEmailCommand(params);
    try {
        await sesClient.send(command);
        console.log("Password reset email sent");
    } catch (error) {
        console.error("Failed to send email:", error);
        throw error;
    }
}
