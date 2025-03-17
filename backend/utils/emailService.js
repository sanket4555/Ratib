const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Function to generate random password
const generatePassword = () => {
    const length = 10;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};

// Function to generate unique agency code
const generateAgencyCode = async (Agency) => {
    const prefix = 'AGN';
    let code;
    let isUnique = false;

    while (!isUnique) {
        const random = Math.floor(1000 + Math.random() * 9000); // 4-digit number
        code = `${prefix}${random}`;
        
        // Check if code exists
        const existing = await Agency.findOne({ agencyCode: code });
        if (!existing) {
            isUnique = true;
        }
    }
    return code;
};

// Send credentials email
const sendAgencyCredentials = async (agencyEmail, agencyName, agencyCode, password) => {
    try {
        await transporter.sendMail({
            from: `"Ratib Admin" <${process.env.SMTP_USER}>`,
            to: agencyEmail,
            subject: "Welcome to Ratib - Your Agency Credentials",
            html: `
                <h2>Welcome to Ratib!</h2>
                <p>Dear ${agencyName},</p>
                <p>Your agency account has been created successfully. Here are your credentials:</p>
                <p><strong>Agency Code:</strong> ${agencyCode}</p>
                <p><strong>Email:</strong> ${agencyEmail}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p>Please keep these credentials safe and change your password after first login.</p>
                <p>Your agency code will be required for customer registrations.</p>
                <br>
                <p>Best regards,</p>
                <p>Ratib Admin Team</p>
            `
        });
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

module.exports = {
    generatePassword,
    generateAgencyCode,
    sendAgencyCredentials
}; 