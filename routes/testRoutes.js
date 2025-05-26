const express = require('express');
const { sendEmail } = require('../utils/emailUtils');
const router = express.Router();

router.get('/test-email', async (req, res) => {
    try {
        await sendEmail(
            'infomancho@gmail.com',
            'Test Email from Live Server',
            '<h1>Live Server Test</h1><p>If you receive this, the live server email system is working!</p>'
        );
        res.send('Test email sent! Check your inbox/spam folder.');
    } catch (error) {
        res.status(500).send('Failed to send test email: ' + error.message);
    }
});

module.exports = router;
