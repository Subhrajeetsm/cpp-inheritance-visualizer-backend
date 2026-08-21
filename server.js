require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

/* ===============================
   DATABASE
================================ */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error(
      "MongoDB connection error:",
      error
    );
  });

/* ===============================
   ROUTES
================================ */

app.get("/", (req, res) => {
  res.json({
    message:
      "Programming Learning Lab Backend Running",
  });
});

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/feedback",
  feedbackRoutes
);

/* ===============================
   SERVER
================================ */

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});