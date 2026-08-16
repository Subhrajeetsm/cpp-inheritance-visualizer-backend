const express = require("express");
const { Resend } = require("resend");

const Feedback = require("../models/feedback");

const router = express.Router();

/* =====================================================
   RESEND CONFIGURATION
===================================================== */

const resend = new Resend(process.env.RESEND_API_KEY);

/* =====================================================
   HELPER FUNCTIONS
===================================================== */

// Escape user input before inserting it into HTML email
const escapeHtml = (text) => {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Basic email validation
const isValidEmail = (email) => {
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};

/* =====================================================
   POST FEEDBACK
   POST /api/feedback
===================================================== */

router.post("/", async (req, res) => {
  try {
    console.log("Request body:", req.body);

    /* =========================
       GET REQUEST DATA
    ========================= */

    const {
      name,
      email,
      message,
    } = req.body || {};

    /* =========================
       VALIDATION
    ========================= */

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    /* =========================
       CLEAN INPUT
    ========================= */

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanMessage = String(message).trim();

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanMessage
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields.",
      });
    }

    /* =========================
       LIMIT INPUT SIZE
    ========================= */

    if (cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name is too long.",
      });
    }

    if (cleanMessage.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long.",
      });
    }

    /* =========================
       SAVE TO MONGODB
    ========================= */

    const feedback = await Feedback.create({
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
    });

    console.log(
      "Feedback saved:",
      feedback._id
    );

    /* =========================
       ESCAPE HTML
    ========================= */

    const safeName =
      escapeHtml(cleanName);

    const safeEmail =
      escapeHtml(cleanEmail);

    const safeMessage =
      escapeHtml(cleanMessage);

    /* =========================
       SEND CONFIRMATION EMAIL
       TO USER
    ========================= */

    const { data, error } =
      await resend.emails.send({
        from:
          "C++ Inheritance Visualizer <onboarding@resend.dev>",

        to: [cleanEmail],

        subject:
          "Thank you for your feedback ❤️ | C++ Inheritance Visualizer",

        html: `
          <!DOCTYPE html>

          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport"
              content="width=device-width,
              initial-scale=1.0">
          </head>

          <body style="
            margin: 0;
            padding: 0;
            background: #f1f5f9;
            font-family: Arial, sans-serif;
          ">

            <div style="
              max-width: 600px;
              margin: 30px auto;
              padding: 30px;
              background: #ffffff;
              border-radius: 16px;
              box-shadow:
                0 4px 20px
                rgba(0,0,0,0.08);
            ">

              <div style="
                text-align: center;
                margin-bottom: 25px;
              ">

                <div style="
                  font-size: 50px;
                  margin-bottom: 10px;
                ">
                  🇮🇳
                </div>

                <h2 style="
                  margin: 0;
                  color: #4f46e5;
                ">
                  Thank You, ${safeName}! 🎉
                </h2>

              </div>

              <h3 style="
                text-align: center;
                color: #1e293b;
              ">
                Happy Indian Independence Day! 🇮🇳
              </h3>

              <p style="
                color: #475569;
                line-height: 1.7;
              ">
                Thank you for taking the time to
                share your feedback about our
                <strong>
                  C++ Inheritance Visualizer
                </strong>.
              </p>

              <p style="
                color: #475569;
                line-height: 1.7;
              ">
                We have successfully received
                your feedback.
              </p>

              <div style="
                background: #f8fafc;
                padding: 20px;
                border-radius: 12px;
                margin: 25px 0;
                border-left: 4px solid #4f46e5;
              ">

                <p style="
                  margin-top: 0;
                  font-weight: bold;
                  color: #1e293b;
                ">
                  Your Feedback
                </p>

                <p style="
                  color: #475569;
                  line-height: 1.7;
                  white-space: pre-wrap;
                ">
                  ${safeMessage}
                </p>

              </div>

              <div style="
                text-align: center;
                margin: 30px 0;
              ">

                <a
                  href="https://cpp-inheritance.vercel.app/"
                  target="_blank"
                  style="
                    display: inline-block;
                    padding: 12px 24px;
                    background: #4f46e5;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                  "
                >
                  Visit C++ Visualizer
                </a>

              </div>

              <p style="
                color: #475569;
                line-height: 1.7;
              ">
                Your feedback helps us improve
                the visualizer and make learning
                C++ inheritance easier.
              </p>

              <p style="
                color: #475569;
              ">
                Thanks for visiting! ❤️
              </p>

              <hr style="
                border: none;
                border-top: 1px solid #e2e8f0;
                margin: 25px 0;
              ">

              <p style="
                text-align: center;
                font-size: 12px;
                color: #64748b;
                margin-bottom: 0;
              ">
                C++ Inheritance Visualizer
              </p>

            </div>

          </body>
          </html>
        `,
      });

    /* =========================
       RESEND ERROR
    ========================= */

    if (error) {
      console.error(
        "Resend Email Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Feedback was saved, but confirmation email could not be sent.",
        feedbackId: feedback._id,
      });
    }

    /* =========================
       EMAIL SUCCESS
    ========================= */

    console.log(
      "Confirmation email sent:",
      data
    );

    /* =========================
       SUCCESS RESPONSE
    ========================= */

    return res.status(201).json({
      success: true,
      message:
        "Feedback submitted successfully. Confirmation email sent.",
      feedbackId: feedback._id,
      emailId: data?.id,
    });

  } catch (error) {
    console.error(
      "Feedback Error:",
      error
    );

    return res.status(500).json({
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
    const feedback =
      await Feedback
        .find()
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: feedback.length,
      feedback,
    });

  } catch (error) {
    console.error(
      "Fetch Feedback Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch feedback.",
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
      await Feedback.findByIdAndDelete(
        req.params.id
      );

    if (!deletedFeedback) {
      return res.status(404).json({
        success: false,
        message:
          "Feedback not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Feedback deleted successfully.",
    });

  } catch (error) {
    console.error(
      "Delete Feedback Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete feedback.",
    });
  }
});

/* =====================================================
   EXPORT ROUTER
===================================================== */

module.exports = router;const express = require("express");
const { Resend } = require("resend");

const Feedback = require("../models/feedback");

const router = express.Router();

/* =====================================================
   RESEND CONFIGURATION
===================================================== */

const resend = new Resend(process.env.RESEND_API_KEY);

/* =====================================================
   HELPER FUNCTIONS
===================================================== */

// Escape user input before inserting it into HTML email
const escapeHtml = (text) => {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Basic email validation
const isValidEmail = (email) => {
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};

/* =====================================================
   POST FEEDBACK
   POST /api/feedback
===================================================== */

router.post("/", async (req, res) => {
  try {
    console.log("Request body:", req.body);

    /* =========================
       GET REQUEST DATA
    ========================= */

    const {
      name,
      email,
      message,
    } = req.body || {};

    /* =========================
       VALIDATION
    ========================= */

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    /* =========================
       CLEAN INPUT
    ========================= */

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanMessage = String(message).trim();

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanMessage
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields.",
      });
    }

    /* =========================
       LIMIT INPUT SIZE
    ========================= */

    if (cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name is too long.",
      });
    }

    if (cleanMessage.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long.",
      });
    }

    /* =========================
       SAVE TO MONGODB
    ========================= */

    const feedback = await Feedback.create({
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
    });

    console.log(
      "Feedback saved:",
      feedback._id
    );

    /* =========================
       ESCAPE HTML
    ========================= */

    const safeName =
      escapeHtml(cleanName);

    const safeEmail =
      escapeHtml(cleanEmail);

    const safeMessage =
      escapeHtml(cleanMessage);

    /* =========================
       SEND CONFIRMATION EMAIL
       TO USER
    ========================= */

    const { data, error } =
      await resend.emails.send({
        from:
          "C++ Inheritance Visualizer <onboarding@resend.dev>",

        to: [cleanEmail],

        subject:
          "Thank you for your feedback ❤️ | C++ Inheritance Visualizer",

        html: `
          <!DOCTYPE html>

          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport"
              content="width=device-width,
              initial-scale=1.0">
          </head>

          <body style="
            margin: 0;
            padding: 0;
            background: #f1f5f9;
            font-family: Arial, sans-serif;
          ">

            <div style="
              max-width: 600px;
              margin: 30px auto;
              padding: 30px;
              background: #ffffff;
              border-radius: 16px;
              box-shadow:
                0 4px 20px
                rgba(0,0,0,0.08);
            ">

              <div style="
                text-align: center;
                margin-bottom: 25px;
              ">

                <div style="
                  font-size: 50px;
                  margin-bottom: 10px;
                ">
                  🇮🇳
                </div>

                <h2 style="
                  margin: 0;
                  color: #4f46e5;
                ">
                  Thank You, ${safeName}! 🎉
                </h2>

              </div>

              <h3 style="
                text-align: center;
                color: #1e293b;
              ">
                Happy Indian Independence Day! 🇮🇳
              </h3>

              <p style="
                color: #475569;
                line-height: 1.7;
              ">
                Thank you for taking the time to
                share your feedback about our
                <strong>
                  C++ Inheritance Visualizer
                </strong>.
              </p>

              <p style="
                color: #475569;
                line-height: 1.7;
              ">
                We have successfully received
                your feedback.
              </p>

              <div style="
                background: #f8fafc;
                padding: 20px;
                border-radius: 12px;
                margin: 25px 0;
                border-left: 4px solid #4f46e5;
              ">

                <p style="
                  margin-top: 0;
                  font-weight: bold;
                  color: #1e293b;
                ">
                  Your Feedback
                </p>

                <p style="
                  color: #475569;
                  line-height: 1.7;
                  white-space: pre-wrap;
                ">
                  ${safeMessage}
                </p>

              </div>

              <div style="
                text-align: center;
                margin: 30px 0;
              ">

                <a
                  href="https://cpp-inheritance.vercel.app/"
                  target="_blank"
                  style="
                    display: inline-block;
                    padding: 12px 24px;
                    background: #4f46e5;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                  "
                >
                  Visit C++ Visualizer
                </a>

              </div>

              <p style="
                color: #475569;
                line-height: 1.7;
              ">
                Your feedback helps us improve
                the visualizer and make learning
                C++ inheritance easier.
              </p>

              <p style="
                color: #475569;
              ">
                Thanks for visiting! ❤️
              </p>

              <hr style="
                border: none;
                border-top: 1px solid #e2e8f0;
                margin: 25px 0;
              ">

              <p style="
                text-align: center;
                font-size: 12px;
                color: #64748b;
                margin-bottom: 0;
              ">
                C++ Inheritance Visualizer
              </p>

            </div>

          </body>
          </html>
        `,
      });

    /* =========================
       RESEND ERROR
    ========================= */

    if (error) {
      console.error(
        "Resend Email Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Feedback was saved, but confirmation email could not be sent.",
        feedbackId: feedback._id,
      });
    }

    /* =========================
       EMAIL SUCCESS
    ========================= */

    console.log(
      "Confirmation email sent:",
      data
    );

    /* =========================
       SUCCESS RESPONSE
    ========================= */

    return res.status(201).json({
      success: true,
      message:
        "Feedback submitted successfully. Confirmation email sent.",
      feedbackId: feedback._id,
      emailId: data?.id,
    });

  } catch (error) {
    console.error(
      "Feedback Error:",
      error
    );

    return res.status(500).json({
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
    const feedback =
      await Feedback
        .find()
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: feedback.length,
      feedback,
    });

  } catch (error) {
    console.error(
      "Fetch Feedback Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch feedback.",
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
      await Feedback.findByIdAndDelete(
        req.params.id
      );

    if (!deletedFeedback) {
      return res.status(404).json({
        success: false,
        message:
          "Feedback not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Feedback deleted successfully.",
    });

  } catch (error) {
    console.error(
      "Delete Feedback Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete feedback.",
    });
  }
});

/* =====================================================
   EXPORT ROUTER
===================================================== */

module.exports = router;
