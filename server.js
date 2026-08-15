const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const feedbackRoutes = require("./routes/feedbackRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// =======================
// Middleware
// =======================

app.use(cors());
app.use(express.json());

// =======================
// Home Route
// =======================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "C++ Inheritance Visualizer Backend is running 🚀",
  });
});

// =======================
// Feedback Routes
// =======================

app.use("/api/feedback", feedbackRoutes);

// =======================
// MongoDB Connection
// =======================

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });