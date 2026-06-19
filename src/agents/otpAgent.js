// ============================================================
//  WASI — OTP / AUTH AGENT
//  SRS Ref: Section 3.2, FR-C02, FR-C03
//
//  Responsibilities:
//  - Generate OTPs for new sessions
//  - Validate OTP input from customer
//  - Manage retries (max 3) and expiry (5 minutes)
//  - Return verified/unverified status to Supervisor
//
//  No LLM needed here — pure logic.
//  Notification Agent sends the actual OTP message.
// ============================================================

const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────
//  OTP STORE (in-memory for now)
//  Later: move to Redis for multi-instance support (SRS stack)
// ─────────────────────────────────────────────────────────────
const otpStore = {};
// Structure: { phoneNumber: { otp, expiresAt, attempts } }

const OTP_EXPIRY_MS  = 5 * 60 * 1000; // 5 minutes (FR-C03)
const MAX_ATTEMPTS   = 3;              // FR-C03


// ─────────────────────────────────────────────────────────────
//  GENERATE OTP
//  Creates a 6-digit OTP for the customer's phone number
// ─────────────────────────────────────────────────────────────
function generateOTP(phoneNumber) {
  const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit
  otpStore[phoneNumber] = {
    otp,                                          // plain for now; hash before DB in prod
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  };
  console.log(`[OTPAgent] Generated OTP for ${phoneNumber}: ${otp}`); // remove in prod
  return otp;
}


// ─────────────────────────────────────────────────────────────
//  VALIDATE OTP
//  Returns: { valid, reason, attemptsLeft }
// ─────────────────────────────────────────────────────────────
function validateOTP(phoneNumber, inputOTP) {
  const record = otpStore[phoneNumber];

  if (!record) {
    return { valid: false, reason: 'NO_OTP', attemptsLeft: 0 };
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[phoneNumber];
    return { valid: false, reason: 'EXPIRED', attemptsLeft: 0 };
  }

  record.attempts += 1;

  if (record.otp !== inputOTP.trim()) {
    const attemptsLeft = MAX_ATTEMPTS - record.attempts;
    if (attemptsLeft <= 0) {
      delete otpStore[phoneNumber]; // reset after max attempts
      return { valid: false, reason: 'MAX_ATTEMPTS', attemptsLeft: 0 };
    }
    return { valid: false, reason: 'INVALID', attemptsLeft };
  }

  // OTP matched
  delete otpStore[phoneNumber]; // consume OTP — single use
  return { valid: true, reason: 'OK', attemptsLeft: MAX_ATTEMPTS };
}


// ─────────────────────────────────────────────────────────────
//  CHECK IF OTP IS PENDING FOR A NUMBER
// ─────────────────────────────────────────────────────────────
function hasPendingOTP(phoneNumber) {
  const record = otpStore[phoneNumber];
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    delete otpStore[phoneNumber];
    return false;
  }
  return true;
}


// ─────────────────────────────────────────────────────────────
//  CLEAR OTP (for session reset)
// ─────────────────────────────────────────────────────────────
function clearOTP(phoneNumber) {
  delete otpStore[phoneNumber];
}

// ─────────────────────────────────────────────────────────────
//  GET LATEST OTP (For simulation / testing)
// ─────────────────────────────────────────────────────────────
function getLatestOTP(phoneNumber) {
  return otpStore[phoneNumber] ? otpStore[phoneNumber].otp : null;
}


module.exports = { generateOTP, validateOTP, hasPendingOTP, clearOTP, getLatestOTP };