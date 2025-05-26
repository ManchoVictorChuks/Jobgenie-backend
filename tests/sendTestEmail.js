require('dotenv').config();
const { sendEmail } = require('../utils/emailUtils');

// Test email sending
(async () => {
    try {
        const to = 'infomancho@gmail.com';
        const subject = 'Test Email from JobGenie';
        const html = `
            <h1>Test Email</h1>
            <p>This is a test email to verify the email notification system.</p>
            <p>If you received this email, the system is working correctly.</p>
            <p>Regards,<br>JobGenie Team</p>
        `;

        await sendEmail(to, subject, html);
        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('Failed to send test email:', error.message);
    }
})();
