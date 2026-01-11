const crypto = require("crypto");

module.exports = async function handler(req, res) {
  // CORS Ayarları
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { email, total, name, address } = req.body;

    // ENV Kontrolü
    if (!process.env.PAYTR_ID || !process.env.PAYTR_KEY || !process.env.PAYTR_SALT) {
        return res.status(500).json({ status: "failed", err_msg: "API Anahtarları Eksik" });
    }

    const merchant_id = process.env.PAYTR_ID;
    const merchant_key = process.env.PAYTR_KEY;
    const merchant_salt = process.env.PAYTR_SALT;
    
    // IP Tespiti
    let user_ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (user_ip && user_ip.indexOf(",") > 0) user_ip = user_ip.split(",")[0].trim();
    if (!user_ip) user_ip = "88.88.88.88"; 

    // Sipariş No ve Tutar
    const merchant_oid = "RHA" + Date.now() + Math.floor(Math.random() * 999);
    const currency = "TL"; 
    const payment_amount = Math.round(Number(total) * 100); 

    // Sepet Hazırlığı
    const formattedPrice = Number(total).toFixed(2); 
    const user_basket_json = JSON.stringify([["Reeha Giyim", formattedPrice, 1]]);
    const user_basket_b64 = Buffer.from(user_basket_json).toString("base64");

    // Diğer Parametreler
    const test_mode = "1"; // Canlıya geçince "0" yap
    const no_installment = "0";
    const max_installment = "0";
    const merchant_ok_url = "https://reeha.com.tr";
    const merchant_fail_url = "https://reeha.com.tr";
    const user_name = name || "Musteri";
    const user_address = address || "Adres yok";
    const user_phone = "05555555555";
    const debug_on = "1";
    const timeout_limit = "30";

    // İMZA (TOKEN) HESAPLAMA
    const hash_str = 
        merchant_id + user_ip + merchant_oid + email + payment_amount + 
        user_basket_b64 + no_installment + max_installment + currency + test_mode;

    const paytr_token = crypto
        .createHmac("sha256", merchant_key)
        .update(hash_str + merchant_salt)
        .digest("base64");

    // Backend artık PayTR'ye gitmiyor, verileri Frontend'e veriyor.
    return res.status(200).json({
      status: "success",
      params: {
        merchant_id,
        user_ip,
        merchant_oid,
        email,
        payment_amount,
        paytr_token,
        user_basket: user_basket_json,
        debug_on,
        no_installment,
        max_installment,
        user_name,
        user_address,
        user_phone,
        merchant_ok_url,
        merchant_fail_url,
        timeout_limit,
        currency,
        test_mode
      }
    });

  } catch (error) {
    console.error("Sunucu Hatası:", error);
    return res.status(500).json({ status: "failed", err_msg: error.message });
  }
};
