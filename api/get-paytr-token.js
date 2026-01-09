const crypto = require("crypto");

module.exports = async function handler(req, res) {
  /* ================= CORS ================= */
  res.setHeader("Access-Control-Allow-Origin", "https://reeha.com.tr");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  /* ======================================== */

  try {
    const { email, total, name, address } = req.body || {};

    // ✅ DOĞRU PARAMETRE KONTROLÜ
    if (
      email === undefined ||
      total === undefined ||
      name === undefined ||
      address === undefined
    ) {
      return res.status(400).json({
        error: "Eksik parametre",
        received: { email, total, name, address }
      });
    }

    const m_id = process.env.PAYTR_ID;
    const m_key = process.env.PAYTR_KEY;
    const m_salt = process.env.PAYTR_SALT;

    if (!m_id || !m_key || !m_salt) {
      return res.status(500).json({ error: "ENV eksik" });
    }

    const user_ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const merchant_oid = "REEHA" + Date.now();

    // ✅ total güvenli parse
    const payment_amount = Math.round(Number(total) * 100);
    if (isNaN(payment_amount) || payment_amount <= 0) {
      return res.status(400).json({ error: "Geçersiz tutar" });
    }

    const user_basket = Buffer.from(
      JSON.stringify([
        ["Urun", (payment_amount / 100).toFixed(2), 1]
      ])
    ).toString("base64");

    /* ============ PAYTR HASH ============ */
    const hash_str =
      m_id +
      user_ip +
      merchant_oid +
      email +
      payment_amount +
      user_basket +
      "0" +
      "0" +
      "TL" +
      "1" +
      m_salt;

    const paytr_token = crypto
      .createHmac("sha256", m_key)
      .update(hash_str)
      .digest("base64");
    /* =================================== */

    return res.status(200).json({
      status: "success",
      token: paytr_token,
      merchant_oid
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};
