const crypto = require("crypto");

module.exports = async function handler(req, res) {
  // 1. CORS AYARLARI (Frontend ile iletişim için şart)
  res.setHeader("Access-Control-Allow-Origin", "*"); // Güvenlik için * yerine site adresini yazabilirsin
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight (OPTIONS) isteği gelirse hemen onayla
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 2. ENV KONTROLLERİ
    const merchant_id = process.env.PAYTR_ID;
    const merchant_key = process.env.PAYTR_KEY;
    const merchant_salt = process.env.PAYTR_SALT;

    if (!merchant_id || !merchant_key || !merchant_salt) {
      console.error("ENV Değişkenleri Eksik!");
      return res.status(500).json({ status: "failed", err_msg: "Sunucu ayarları eksik (ENV)." });
    }

    // 3. FRONTEND'DEN GELEN VERİYİ AL
    const { email, total, name, address } = req.body;

    if (!email || !total) {
      return res.status(400).json({ status: "failed", err_msg: "E-posta veya tutar eksik." });
    }

    // 4. PAYTR GEREKSİNİMLERİ
    const merchant_oid = "SIP-" + Date.now() + Math.floor(Math.random() * 999); // Benzersiz Sipariş ID
    const payment_amount = Math.round(Number(total) * 100); // Kuruş cinsinden (Örn: 100 TL -> 10000)
    const currency = "TL";
    const test_mode = "1"; // Test için 1, Canlı için 0
    
    // IP Adresi Bulma (Vercel arkasında x-forwarded-for kullanılır)
    const user_ip = req.headers["x-forwarded-for"] 
      ? req.headers["x-forwarded-for"].split(",")[0] 
      : "127.0.0.1";

    // Sepet Oluşturma (Tek kalem olarak gösteriyoruz)
    // PayTR, sepet içeriğini base64 array string ister.
    const basketData = [["Genel Sipariş", String(total), 1]];
    const user_basket = JSON.stringify(basketData);
    const user_basket_b64 = Buffer.from(user_basket).toString("base64");

    // Diğer Zorunlu Alanlar
    const no_installment = "0"; // Taksit yok
    const max_installment = "0";
    const user_name = name || "Misafir Kullanici";
    const user_address = address || "Teslimat Adresi Girilmedi";
    const user_phone = "05555555555"; // Zorunlu olduğu için dummy veri
    const merchant_ok_url = "https://reeha.com.tr/basarili"; // Başarılı dönüş sayfası
    const merchant_fail_url = "https://reeha.com.tr/basarisiz"; // Hata dönüş sayfası
    const timeout_limit = "30"; // Dakika

    // 5. TOKEN OLUŞTURMA (EN ÖNEMLİ KISIM)
    // PayTR dokümantasyonuna göre sıralama çok önemlidir.
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

    // 6. BAŞARILI YANIT DÖN
    return res.status(200).json({
      status: "success",
      token: paytr_token
    });

  } catch (error) {
    console.error("Backend Hatası:", error);
    return res.status(500).json({ status: "failed", err_msg: "Sunucu hatası oluştu." });
  }
};
