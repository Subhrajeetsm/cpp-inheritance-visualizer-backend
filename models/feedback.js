const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// =======================
// Feedback Schema
// =======================

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

// =======================
// POST Feedback
// =======================

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const feedback = new Feedback({
      name,
      email,
      message,
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully ❤️",
    });
  } catch (error) {
    console.error("Feedback error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
    });
  }
});

module.exports = router;