const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5
});

async function sendEmail(to, subject, html) {
    const mailOptions = {
        from: {
            name: 'JobGenie App',
            address: process.env.EMAIL_USER
        },
        to,
        subject,
        html,
        headers: {
            'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}>`,
            'Precedence': 'Bulk'
        },
        priority: 'normal'
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error);
    }
}

module.exports = { sendEmail };
