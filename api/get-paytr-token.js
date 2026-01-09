const crypto = require("crypto");
const https = require("https");

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "https://reeha.com.tr");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { email, total } = req.body;

    if (!email || !total) {
      return res.status(400).json({ error: "Eksik parametre" });
    }

    const merchant_id = process.env.PAYTR_ID;
    const merchant_key = process.env.PAYTR_KEY;
    const merchant_salt = process.env.PAYTR_SALT;

    const user_ip =
      req.headers["x-forwarded-for"]?.split(",")[0] || "127.0.0.1";

    const merchant_oid = "REEHA" + Date.now();
    const payment_amount = Math.round(Number(total) * 100);

    const user_basket = Buffer.from(
      JSON.stringify([["Ürün", total, 1]])
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
      "1" +
      merchant_salt;

    const paytr_token = crypto
      .createHmac("sha256", merchant_key)
      .update(hash_str)
      .digest("base64");

    const postData = new URLSearchParams({
      merchant_id,
      user_ip,
      merchant_oid,
      email,
      payment_amount,
      paytr_token,
      user_basket,
      no_installment: "0",
      max_installment: "0",
      currency: "TL",
      test_mode: "1", // canlıda 0 yap
      merchant_ok_url: "https://reeha.com.tr/odeme-basarili",
      merchant_fail_url: "https://reeha.com.tr/odeme-hata"
    }).toString();

    const paytrReq = https.request(
      {
        hostname: "www.paytr.com",
        path: "/odeme/api/get-token",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": postData.length
        }
      },
      (paytrRes) => {
        let data = "";
        paytrRes.on("data", (chunk) => (data += chunk));
        paytrRes.on("end", () => {
          res.status(200).json(JSON.parse(data));
        });
      }
    );

    paytrReq.write(postData);
    paytrReq.end();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
