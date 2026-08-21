const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const sendOTP = require("../utils/sendOTP");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   HELPERS
===================================================== */

function generateOTP() {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

function generateToken(userId) {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

function validatePassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8
  );
}

/* =====================================================
   SIGN UP
   POST /api/auth/signup
===================================================== */

router.post("/signup", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const normalizedUsername = username.trim();

    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const existingUsername = await User.findOne({
      username: normalizedUsername,
    });

    if (existingUsername) {
      return res.status(409).json({
        message: "Username is already taken",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    const otp = generateOTP();

    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    const user = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      isEmailVerified: false,
      emailOTP: otp,
      emailOTPExpires: otpExpires,
      authProvider: "local",
    });

    await user.save();

    await sendOTP(
      normalizedEmail,
      otp,
      "verification"
    );

    res.status(201).json({
      message:
        "Account created. OTP sent to your email.",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      message: "Server error during signup",
    });
  }
});

/* =====================================================
   VERIFY EMAIL
   POST /api/auth/verify-email
===================================================== */

router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    if (
      !user.emailOTP ||
      !user.emailOTPExpires
    ) {
      return res.status(400).json({
        message: "No OTP available",
      });
    }

    if (user.emailOTPExpires < new Date()) {
      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    if (user.emailOTP !== otp.toString()) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    user.isEmailVerified = true;
    user.emailOTP = null;
    user.emailOTPExpires = null;

    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Verify email error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

/* =====================================================
   LOGIN
   POST /api/auth/login
===================================================== */

router.post("/login", async (req, res) => {
  try {
    const {
      identifier,
      password,
    } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message:
          "Username/email and password are required",
      });
    }

    const trimmedIdentifier =
      identifier.trim();

    const user = await User.findOne({
      $or: [
        {
          email:
            trimmedIdentifier.toLowerCase(),
        },
        {
          username: trimmedIdentifier,
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid username/email or password",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message:
          "This account uses Google login",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Invalid username/email or password",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in",
        email: user.email,
      });
    }

    const token = generateToken(user._id);

    res.json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error during login",
    });
  }
});

/* =====================================================
   FORGOT PASSWORD
   POST /api/auth/forgot-password
===================================================== */

router.post(
  "/forgot-password",
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const user = await User.findOne({
        email: normalizedEmail,
      });

      if (!user) {
        return res.status(404).json({
          message: "No account found with this email",
        });
      }

      const otp = generateOTP();

      user.resetOTP = otp;

      user.resetOTPExpires = new Date(
        Date.now() + 10 * 60 * 1000
      );

      await user.save();

      await sendOTP(
        normalizedEmail,
        otp,
        "reset"
      );

      res.json({
        message:
          "Password reset OTP sent to your email",
      });
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

/* =====================================================
   VERIFY RESET OTP
   POST /api/auth/verify-reset-otp
===================================================== */

router.post(
  "/verify-reset-otp",
  async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          message:
            "Email and OTP are required",
        });
      }

      const user = await User.findOne({
        email: email.trim().toLowerCase(),
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (
        !user.resetOTP ||
        !user.resetOTPExpires
      ) {
        return res.status(400).json({
          message: "No reset OTP available",
        });
      }

      if (
        user.resetOTPExpires < new Date()
      ) {
        return res.status(400).json({
          message: "OTP has expired",
        });
      }

      if (
        user.resetOTP !== otp.toString()
      ) {
        return res.status(400).json({
          message: "Invalid OTP",
        });
      }

      res.json({
        message:
          "OTP verified successfully",
      });
    } catch (error) {
      console.error(
        "Verify reset OTP error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

/* =====================================================
   RESET PASSWORD
   POST /api/auth/reset-password
===================================================== */

router.post(
  "/reset-password",
  async (req, res) => {
    try {
      const {
        email,
        otp,
        password,
        confirmPassword,
      } = req.body;

      if (
        !email ||
        !otp ||
        !password ||
        !confirmPassword
      ) {
        return res.status(400).json({
          message:
            "All fields are required",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          message:
            "Passwords do not match",
        });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters long",
        });
      }

      const user = await User.findOne({
        email: email.trim().toLowerCase(),
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (
        !user.resetOTP ||
        !user.resetOTPExpires
      ) {
        return res.status(400).json({
          message: "Invalid reset request",
        });
      }

      if (
        user.resetOTPExpires < new Date()
      ) {
        return res.status(400).json({
          message: "OTP has expired",
        });
      }

      if (
        user.resetOTP !== otp.toString()
      ) {
        return res.status(400).json({
          message: "Invalid OTP",
        });
      }

      const hashedPassword =
        await bcrypt.hash(password, 12);

      user.password = hashedPassword;
      user.resetOTP = null;
      user.resetOTPExpires = null;

      await user.save();

      res.json({
        message:
          "Password changed successfully",
      });
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

/* =====================================================
   CURRENT USER
   GET /api/auth/me
===================================================== */

router.get(
  "/me",
  authMiddleware,
  async (req, res) => {
    try {
      res.json({
        user: {
          id: req.user._id,
          username: req.user.username,
          email: req.user.email,
          isEmailVerified:
            req.user.isEmailVerified,
          authProvider:
            req.user.authProvider,
        },
      });
    } catch (error) {
      console.error(
        "Get current user error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;