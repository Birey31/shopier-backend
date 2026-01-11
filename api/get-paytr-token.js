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

        // 1. ENV Kontrolü (Boşlukları temizleyerek alıyoruz)
        const merchant_id = process.env.PAYTR_ID?.trim();
        const merchant_key = process.env.PAYTR_KEY?.trim();
        const merchant_salt = process.env.PAYTR_SALT?.trim();

        if (!merchant_id || !merchant_key || !merchant_salt) {
            return res.status(500).json({ status: "failed", err_msg: "API Anahtarları Eksik" });
        }

        // 2. IP Tespiti (Vercel IP'sini değil, kullanıcınınkini almalıyız)
        let user_ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        if (user_ip.includes(',')) user_ip = user_ip.split(',')[0].trim();
        if (!user_ip || user_ip === "::1") user_ip = "85.105.1.1"; // Test IP'si

        const merchant_oid = "RHA" + Date.now();
        const payment_amount = Math.round(Number(total) * 100);
        const currency = "TL";
        const test_mode = "1"; // EĞER MAĞAZAN CANLIYSA BURAYI "0" YAP

        // 3. Sepet Hazırlığı
        const user_basket = Buffer.from(JSON.stringify([["Reeha Giyim", String(total), 1]])).toString("base64");

        const no_installment = "0";
        const max_installment = "0";
        const debug_on = "1"; // PayTR'den detaylı hata almak için
        const merchant_ok_url = "https://reeha.com.tr";
        const merchant_fail_url = "https://reeha.com.tr";

        // 4. İMZA (TOKEN) HESAPLAMA
        const hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode;
        const paytr_token = crypto.createHmac("sha256", merchant_key).update(hash_str + merchant_salt).digest("base64");

        const postData = querystring.stringify({
            merchant_id, user_ip, merchant_oid, email, payment_amount, paytr_token, user_basket,
            debug_on, no_installment, max_installment, user_name: name || "Musteri",
            user_address: address || "Adres", user_phone: "05555555555", merchant_ok_url,
            merchant_fail_url, timeout_limit: "30", currency, test_mode
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

        // --- PAYTR İLE CANLI KONUŞMA ---
        const paytrResponse = await new Promise((resolve, reject) => {
            const payReq = https.request(options, (payRes) => {
                let data = "";
                payRes.on("data", (chunk) => (data += chunk));
                payRes.on("end", () => resolve(data));
            });
            payReq.on("error", (e) => reject(e));
            payReq.write(postData);
            payReq.end();
        });

        console.log("PayTR'den Gelen Cevap:", paytrResponse);

        // PayTR cevabı JSON mı yoksa hata sayfası mı?
        try {
            const result = JSON.parse(paytrResponse);
            if (result.status === "success") {
                return res.status(200).json({ status: "success", token: result.token });
            } else {
                return res.status(400).json({ status: "failed", err_msg: result.reason || "PayTR hata verdi." });
            }
        } catch (e) {
            // Eğer PayTR JSON dönmek yerine hata sayfası dönüyorsa (404 gibi)
            return res.status(500).json({ status: "failed", err_msg: "PayTR Servis Hatası (HTML döndü). Link veya ID yanlış olabilir." });
        }

    } catch (error) {
        return res.status(500).json({ status: "failed", err_msg: error.message });
    }
};
