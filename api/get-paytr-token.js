const crypto = require("crypto");
const axios = require("axios");

module.exports = async function handler(req, res) {
  // ✅ CORS EN BAŞTA
  res.setHeader("Access-Control-Allow-Origin", "https://reeha.com.tr");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 🔥 BODY GÜVENLİ OKUMA
    const body = req.body || {};
    console.log("REQ BODY:", body);

    const email = body.email;
    const total = body.total;

    if (!email || !total) {
      return res.status(400).json({
        status: "failed",
        error: "email veya total yok",
        body
      });
    }

    const merchant_id = process.env.PAYTR_ID;
    const merchant_key = process.env.PAYTR_KEY;
    const merchant_salt = process.env.PAYTR_SALT;

    if (!merchant_id || !merchant_key || !merchant_salt) {
      return res.status(500).json({
        status: "failed",
        error: "ENV eksik"
      });
    }

    const user_ip =
      req.headers["x-forwarded-for"]?.split(",")[0] || "127.0.0.1";

    const merchant_oid = "REEHA" + Date.now();
    const payment_amount = Math.round(Number(total) * 100);

    if (!Number.isFinite(payment_amount) || payment_amount <= 0) {
      return res.status(400).json({
        status: "failed",
        error: "Geçersiz payment_amount",
        received: total
      });
    }

    const user_basket = Buffer.from(
      JSON.stringify([["Urun", (payment_amount / 100).toFixed(2), 1
