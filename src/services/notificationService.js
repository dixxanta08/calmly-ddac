import AWS from 'aws-sdk';

// Configure AWS SNS
const sns = new AWS.SNS({
    endpoint: process.env.NEXT_PUBLIC_SNS_ENDPOINT || 'http://localhost:4566',
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY
});

/**
 * Send a notification via SNS
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email message content
 * @returns {Promise<boolean>} - Success status
 */
export async function sendNotification(email, subject, message) {
    try {
        // Create SNS message parameters
        console.log("Sending notification to", email, subject, message);
        console.log("Using SNS Topic:", process.env.SNS_TOPIC);

        const params = {
            Message: JSON.stringify({
                subject,
                message,
                email
            }),
            TopicArn: process.env.SNS_TOPIC
        };

        // Publish message to SNS topic
        await sns.publish(params).promise();
        console.log(`Notification sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Failed to send notification:', error);
        console.log("Error TOPIC", process.env.SNS_TOPIC);
        console.log("Error details:", error.message);
        return false;
    }
}

/**
 * Send appointment notification
 * @param {string} email - Recipient email address
 * @param {string} type - Notification type (created, updated, cancelled)
 * @param {Object} appointment - Appointment details
 * @returns {Promise<boolean>} - Success status
 */
export async function sendAppointmentNotification(email, type, appointment) {
    const formattedDate = new Date(appointment.appointmentDateTime).toLocaleString();
    let subject, message;

    switch (type) {
        case 'created':
            subject = 'New Appointment Scheduled';
            message = `Your appointment with ${appointment.therapist_name} has been scheduled for ${formattedDate}.`;
            break;
        case 'updated':
            subject = 'Appointment Status Updated';
            message = `Your appointment with ${appointment.therapist_name} on ${formattedDate} has been ${appointment.status}.`;
            break;
        case 'cancelled':
            subject = 'Appointment Cancelled';
            message = `Your appointment with ${appointment.therapist_name} on ${formattedDate} has been cancelled.`;
            break;
        default:
            throw new Error('Invalid notification type');
    }

    return sendNotification(email, subject, message);
} 