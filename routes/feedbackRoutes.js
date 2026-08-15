const express = require("express");
const nodemailer = require("nodemailer");

const Feedback = require("../models/feedback");

const router = express.Router();

/* =====================================================
   EMAIL CONFIGURATION
===================================================== */

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* =====================================================
   POST FEEDBACK
   POST /api/feedback
===================================================== */

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    /* =========================
       VALIDATION
    ========================= */

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields.",
      });
    }

    /* =========================
       SAVE TO MONGODB
    ========================= */

    const feedback = await Feedback.create({
      name,
      email,
      message,
    });

    /* =========================
       SEND CONFIRMATION EMAIL
    ========================= */

    const mailOptions = {
      from: `"C++ Inheritance Visualizer" <${process.env.MAIL_USER}>`,

      to: email,

      subject:
        "Thank you for your feedback ❤️ | Happy Indian Independence Day 🇮🇳",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
          background: #f8fafc;
          border-radius: 12px;
        ">

          <h2 style="color: #4f46e5;">
            Thank You, ${name}! 🎉
          </h2>

          <h1 style="text-align:center;">
            🇮🇳
          </h1>

          <h3 style="text-align:center;">
            Happy Indian Independence Day!
          </h3>

          <p>
            Thank you for taking the time to give feedback
            about our <strong>C++ Inheritance Visualizer</strong>.
          </p>

          <p>
            Visit our website:
          </p>

          <p>
            <a
              href="https://cpp-inheritance.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              style="color:#4f46e5;"
            >
              C++ Inheritance Visualizer
            </a>
          </p>

          <div style="
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          ">

            <p>
              <strong>Your Feedback:</strong>
            </p>

            <p style="color: #475569;">
              ${message}
            </p>

          </div>

          <p>
            Your feedback helps us improve the visualizer
            and make learning C++ inheritance easier.
          </p>

          <p>
            Thanks for visiting! ❤️
          </p>

          <hr />

          <p style="
            font-size: 12px;
            color: #64748b;
          ">
            C++ Inheritance Visualizer
          </p>

        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    /* =========================
       SUCCESS
    ========================= */

    res.status(201).json({
      success: true,
      message:
        "Feedback submitted successfully. Confirmation email sent.",
      feedbackId: feedback._id,
    });

  } catch (error) {
    console.error("Feedback Error:", error);

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while submitting feedback.",
    });
  }
});

/* =====================================================
   GET ALL FEEDBACK
   GET /api/feedback
===================================================== */

router.get("/", async (req, res) => {
  try {
    const feedback = await Feedback
      .find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      feedback,
    });

  } catch (error) {
    console.error("Fetch Feedback Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback.",
    });
  }
});

/* =====================================================
   DELETE FEEDBACK
   DELETE /api/feedback/:id
===================================================== */

router.delete("/:id", async (req, res) => {
  try {
    const deletedFeedback =
      await Feedback.findByIdAndDelete(req.params.id);

    if (!deletedFeedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found.",
      });
    }

    res.json({
      success: true,
      message: "Feedback deleted successfully.",
    });

  } catch (error) {
    console.error("Delete Feedback Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete feedback.",
    });
  }
});

module.exports = router;