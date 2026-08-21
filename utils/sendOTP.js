const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function sendOTP(email, otp, type = "verification") {
  let subject;
  let title;
  let message;

  if (type === "verification") {
    subject = "Verify your Programming Learning Lab account";
    title = "Email Verification";
    message = "Use the following OTP to verify your email address:";
  } else {
    subject = "Reset your Programming Learning Lab password";
    title = "Password Reset";
    message = "Use the following OTP to reset your password:";
  }

  await transporter.sendMail({
    from: `"Programming Learning Lab" <${process.env.MAIL_USER}>`,
    to: email,
    subject,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 30px;
        border: 1px solid #ddd;
        border-radius: 12px;
      ">

        <h2>${title}</h2>

        <p>${message}</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 20px;
          text-align: center;
          background: #f5f5f5;
          border-radius: 10px;
          margin: 20px 0;
        ">
          ${otp}
        </div>

        <p>
          This OTP will expire in <strong>10 minutes</strong>.
        </p>

        <p>
          If you did not request this, you can safely ignore this email.
        </p>

        <hr>

        <p style="color:#777;">
          Programming Learning Lab
        </p>

      </div>
    `,
  });
}

module.exports = sendOTP;