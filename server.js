const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const feedbackRoutes = require("./routes/feedbackRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(
  cors({
    origin: "*",
  })
);

// Parse JSON request body
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

/* =====================================================
   HOME ROUTE
===================================================== */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "C++ Inheritance Visualizer Backend is running 🚀",
  });
});

/* =====================================================
   FEEDBACK ROUTE
===================================================== */

app.use("/api/feedback", feedbackRoutes);

/* =====================================================
   MONGODB CONNECTION
===================================================== */

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
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });