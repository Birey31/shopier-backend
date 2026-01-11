const crypto = require("crypto");

module.exports = async function handler(req, res) {
  // CORS İzinleri
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { email, total, name, address } = req.body;

    // ENV Kontrol
    if (!process.env.PAYTR_ID || !process.env.PAYTR_KEY || !process.env.PAYTR_SALT) {
        return res.status(500).json({ status: "failed", err_msg: "API Anahtarları Eksik" });
    }

    const merchant_id = process.env.PAYTR_ID;
    const merchant_key = process.env.PAYTR_KEY;
    const merchant_salt = process.env.PAYTR_SALT;

    // --- KRİTİK NOKTA: IP ADRESİ TESPİTİ ---
    // Vercel'de kullanıcı IP'si 'x-forwarded-for' başlığında gelir.
    let user_ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    
    // Bazen IP'ler "123.123.123.123, 10.0.0.1" şeklinde virgüllü gelir, ilkini almalıyız.
    if (user_ip && user_ip.indexOf(",") > 0) {
        user_ip = user_ip.split(",")[0].trim();
    }
    
    // Eğer IP hala yoksa (Localhost testlerinde)
    if (!user_ip || user_ip === "::1") {
        user_ip = "127.0.0.1";
    }
    
    console.log("Kullanıcı IP:", user_ip); // Loglardan kontrol edebilirsin

    const merchant_oid = "SIP-" + Date.now() + Math.floor(Math.random() * 999);
    const payment_amount = Math.round(Number(total) * 100);
    const currency = "TL";
    
    // TEST MODU (1=Test, 0=Canlı)
    // PayTR panelin Test modundaysa burası "1" olmalı.
    const test_mode = "1"; 

    const user_basket = JSON.stringify([["Reeha Giyim", String(total), 1]]);
    const user_basket_b64 = Buffer.from(user_basket).toString("base64");
    const no_installment = "0";
    const max_installment = "0";
    const merchant_ok_url = "https://reeha.com.tr";
    const merchant_fail_url = "https://reeha.com.tr";

    // Token Hesaplama
    const hash_str = 
        merchant_id + 
        user_ip + 
        merchant_oid + 
        email + 
        payment_amount + 
        user_basket_b64 + 
        no_installment + 
        max_installment + 
        currency + 
        test_mode;

    const paytr_token = crypto
        .createHmac("sha256", merchant_key)
        .update(hash_str + merchant_salt)
        .digest("base64");

    return res.status(200).json({
      status: "success",
      token: paytr_token
    });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ status: "failed", err_msg: error.message });
  }
};
