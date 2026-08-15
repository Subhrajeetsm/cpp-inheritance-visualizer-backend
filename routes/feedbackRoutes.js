const express = require("express");
const { Resend } = require("resend");

const Feedback = require("../models/feedback");

const router = express.Router();

/* =====================================================
   RESEND EMAIL CONFIGURATION
===================================================== */

const resend = new Resend(process.env.RESEND_API_KEY);

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

    /* =========================
       SAVE TO MONGODB
    ========================= */

    const feedback = await Feedback.create({
      name,
      email,
      message,
    });

    console.log(
      "Feedback saved:",
      feedback._id
    );

    /* =========================
       SEND EMAIL USING RESEND
    ========================= */

    const { data, error } =
      await resend.emails.send({
        from:
          "C++ Inheritance Visualizer <onboarding@resend.dev>",

        to: [email],

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

            <h2 style="
              color: #4f46e5;
            ">
              Thank You, ${name}! 🎉
            </h2>

            <h1 style="
              text-align:center;
            ">
              🇮🇳
            </h1>

            <h3 style="
              text-align:center;
            ">
              Happy Indian Independence Day!
            </h3>

            <p>
              Thank you for taking the time to give
              feedback about our
              <strong>
                C++ Inheritance Visualizer
              </strong>.
            </p>

            <p>
              Visit our website:
            </p>

            <p>
              <a
                href="https://cpp-inheritance.vercel.app/"
                target="_blank"
                style="
                  color:#4f46e5;
                  text-decoration:none;
                "
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

              <p style="
                color: #475569;
              ">
                ${message}
              </p>

            </div>

            <p>
              Your feedback helps us improve the
              visualizer and make learning C++
              inheritance easier.
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

    console.log(
      "Confirmation email sent:",
      data
    );

    /* =========================
       SUCCESS
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

module.exports = router;