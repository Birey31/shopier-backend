const crypto = require("crypto");
const axios = require("axios");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://reeha.com.tr");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (!email || !email.includes("@")) {
  return res.status(400).json({
    status: "failed",
    error: "email invalid",
    received: email
  });
}


  try {
    const { email, total, name = "Musteri", address = "Adres" } = req.body;

    if (!email || !total) {
      return res.status(400).json({ error: "Eksik parametre" });
    }

    const merchant_id = process.env.PAYTR_ID;
    const merchant_key = process.env.PAYTR_KEY;
    const merchant_salt = process.env.PAYTR_SALT;

    const user_ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    const merchant_oid = "REEHA" + Date.now();
    const payment_amount = Math.round(Number(total) * 100);
    if (!Number.isFinite(payment_amount) || payment_amount <= 0) {
  return res.status(400).json({
    status: "failed",
    error: "payment_amount invalid",
    received: total
  });
}


    const user_basket = Buffer.from(
      JSON.stringify([
        ["Urun", (payment_amount / 100).toFixed(2), 1]
      ])
    ).toString("base64");

    const hash_str =
      merchant_id +
      user_ip +
      merchant_oid +
      email +
      payment_amount +
      user_basket +
      "0" +
      "0" +
      "TL" +
      "1";

    const paytr_token = crypto
      .createHmac("sha256", merchant_key)
      .update(hash_str + merchant_salt)
      .digest("base64");

    const params = {
      merchant_id,
      user_ip,
      merchant_oid,
      email,
      payment_amount,
      paytr_token,
      user_basket,
      user_name: name,
      user_address: address,
      user_phone: "5555555555",
      merchant_ok_url: "https://reeha.com.tr/success",
      merchant_fail_url: "https://reeha.com.tr/fail",
      test_mode: 1,
      debug_on: 1,
      no_installment: 0,
      max_installment: 0,
      currency: "TL"
    };

    const paytrRes = await axios.post(
      "https://www.paytr.com/odeme/api/get-token",
      params
    );

    if (paytrRes.data.status !== "success") {
      return res.status(400).json(paytrRes.data);
    }

    return res.status(200).json({
      status: "success",
      token: paytrRes.data.token
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};
