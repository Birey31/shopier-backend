const crypto = require("crypto");
const axios = require("axios");

module.exports = async function handler(req, res) {
  try {
    const { email, total, name, address } = req.body;

    const m_id = process.env.PAYTR_ID.trim();
    const m_key = process.env.PAYTR_KEY.trim();
    const m_salt = process.env.PAYTR_SALT.trim();

    const user_ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    const merchant_oid = "REEHA" + Date.now();
    const payment_amount = Math.round(total * 100);

    const user_basket = Buffer.from(
      JSON.stringify([
        ["Urun", (payment_amount / 100).toFixed(2), 1]
      ])
    ).toString("base64");

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

    const params = new URLSearchParams({
      merchant_id: m_id,
      user_ip,
      merchant_oid,
      email,
      payment_amount,
      paytr_token,
      user_basket,
      user_name: name,
      user_address: address,
      user_phone: "5348755760",
      merchant_ok_url: "https://reeha.com.tr/success",
      merchant_fail_url: "https://reeha.com.tr/fail",
      test_mode: "1",
      no_installment: "0",
      max_installment: "0",
      currency: "TL",
      debug_on: "1"
    });

    const response = await axios.post(
      "https://www.paytr.com/odeme/guvenli/ucret",
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
