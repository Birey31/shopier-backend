const crypto = require("crypto");
const https = require("https");
const querystring = require("querystring");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { email, total, name, address } = req.body;

    // 1. ENV KONTROLLERİ
    if (!process.env.PAYTR_ID || !process.env.PAYTR_KEY || !process.env.PAYTR_SALT) {
        return res.status(500).json({ status: "failed", err_msg: "API Anahtarları Eksik" });
    }

    const merchant_id = process.env.PAYTR_ID;
    const merchant_key = process.env.PAYTR_KEY;
    const merchant_salt = process.env.PAYTR_SALT;
    
    // 2. IP ADRESİ
    let user_ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (user_ip && user_ip.indexOf(",") > 0) {
        user_ip = user_ip.split(",")[0].trim();
    }
    if (!user_ip) user_ip = "88.88.88.88"; 

    // 3. SİPARİŞ NO (DÜZELTİLDİ: TİRE KALDIRILDI)
    // PayTR sadece harf ve rakam ister. "SIP-" yerine "RHA" yaptık.
    const merchant_oid = "RHA" + Date.now() + Math.floor(Math.random() * 999);
    
    const currency = "TL"; 
    const payment_amount = Math.round(Number(total) * 100); 

    // Sepet Formatı
    const formattedPrice = Number(total).toFixed(2); 
    const user_basket = JSON.stringify([["Reeha Giyim", formattedPrice, 1]]);
    
    // Ayarlar
    const test_mode = "1"; // Canlıya geçtiğinde "0" yap
    const no_installment = "0";
    const max_installment = "0";
    const merchant_ok_url = "https://reeha.com.tr";
    const merchant_fail_url = "https://reeha.com.tr";
    const user_name = name || "Musteri";
    const user_address = address || "Adres yok";
    const user_phone = "05555555555";
    const debug_on = "1";

    // 4. PAYTR TOKEN İSTEĞİ (Get Token)
    // Bu aşamada user_basket base64 OLMADAN gönderilir, PayTR kendisi kodlar.
    // Ancak token imzasını oluştururken base64 yapmamız lazım.
    
    const user_basket_b64 = Buffer.from(user_basket).toString("base64");

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

    // PayTR API'ye POST edilecek veriler
    const postData = querystring.stringify({
        merchant_id,
        user_ip,
        merchant_oid,
        email,
        payment_amount,
        paytr_token,
        user_basket, // API isteğinde normal JSON string gider
        debug_on,
        no_installment,
        max_installment,
        user_name,
        user_address,
        user_phone,
        merchant_ok_url,
        merchant_fail_url,
        timeout_limit: "30",
        currency,
        test_mode
    });

    const options = {
        hostname: "www.paytr.com",
        path: "/odeme/api/get-token",
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(postData),
        },
    };

    const paytrResponse = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => resolve(JSON.parse(data)));
        });
        req.on("error", (e) => reject(e));
        req.write(postData);
        req.end();
    });

    if (paytrResponse.status === "success") {
        return res.status(200).json({ status: "success", token: paytrResponse.token });
    } else {
        return res.status(400).json({ status: "failed", err_msg: paytrResponse.reason });
    }

  } catch (error) {
    console.error("Sunucu Hatası:", error);
    return res.status(500).json({ status: "failed", err_msg: error.message });
  }
};
