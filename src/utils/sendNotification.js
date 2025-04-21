/**
 * Send a notification via the SNS API
 * @param {string} email - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email message content
 * @returns {Promise<boolean>} - Success status
 */
export async function sendNotification(email, subject, message) {
    try {
        console.log(`Sending notification to ${email}: ${subject} - ${message}`);

        // Call our SNS API route
        const response = await fetch('/api/sns/sendMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                subject,
                message
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send notification');
        }

        const result = await response.json();
        console.log(`Notification sent successfully: ${result.message}`);
        return true;
    } catch (error) {
        console.error("Failed to send notification:", error);
        return false;
    }
} 