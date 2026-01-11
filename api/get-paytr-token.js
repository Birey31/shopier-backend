const crypto = require("crypto");

module.exports = async function handler(req, res) {
  // CORS İzinleri
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { email, total, name, address } = req.body;

    // 1. ENV KONTROLÜ
    if (!process.env.PAYTR_ID || !process.env.PAYTR_KEY || !process.env.PAYTR_SALT) {
        return res.status(500).json({ status: "failed", err_msg: "API Anahtarları Eksik" });
    }

    const merchant_id = process.env.PAYTR_ID;
    const merchant_key = process.env.PAYTR_KEY;
    const merchant_salt = process.env.PAYTR_SALT;
    
    // 2. IP ADRESİ (Vercel için kritik)
    let user_ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (user_ip && user_ip.indexOf(",") > 0) {
        user_ip = user_ip.split(",")[0].trim();
    }
    // IP boşsa (Localhost hatası almamak için)
    if (!user_ip) user_ip = "88.88.88.88"; 

    // Sipariş No
    const merchant_oid = "SIP-" + Date.now() + Math.floor(Math.random() * 999);
    
    // 3. FİYAT AYARLARI (HATA BURADAYDI)
    const currency = "TL"; 
    // Toplam tutarı kuruşa çevir (Örn: 100.00 -> 10000)
    const payment_amount = Math.round(Number(total) * 100); 

    // 4. SEPET İÇERİĞİ (DÜZELTİLDİ)
    // PayTR fiyatı string ve kuruşlu ister: "100.00" gibi
    const formattedPrice = Number(total).toFixed(2); 
    const user_basket = JSON.stringify([["Reeha Giyim", formattedPrice, 1]]);
    const user_basket_b64 = Buffer.from(user_basket).toString("base64");

    // 5. TEST MODU (1 = Test, 0 = Canlı)
    // Mağazan onaylanana kadar burası "1" kalmalı
    const test_mode = "1"; 

    const no_installment = "0";
    const max_installment = "0";
    const merchant_ok_url = "https://reeha.com.tr";
    const merchant_fail_url = "https://reeha.com.tr";

    // 6. TOKEN OLUŞTURMA
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
    
    console.log("ÜRETİLEN TOKEN:", paytr_token); // Loglara token'ı yazdır
    console.log("GİDEN VERİLER:", { merchant_id, email, payment_amount, user_ip });

    return res.status(200).json({
      status: "success",
      token: paytr_token
    });
    

    return res.status(200).json({
      status: "success",
      token: paytr_token
    });

  } catch (error) {
    console.error("Backend Hatası:", error);
    return res.status(500).json({ status: "failed", err_msg: error.message });
  }
};
