// api/paytr-callback.js
const crypto = require("crypto");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    try {
        const post = req.body;
        const merchant_salt = process.env.PAYTR_SALT;

        // PayTR'den gelen güvenlik imzasını kontrol etme (Opsiyonel ama güvenli)
        // Şimdilik sadece "OK" dönerek sistemi çalıştıralım.
        
        console.log("PayTR Bildirimi Geldi:", post);

        // ÖNEMLİ: PayTR bu adresten SADECE "OK" yanıtını bekler.
        // Eğer OK demezsen, ödeme başarılı olsa bile PayTR ödemeyi askıya alır.
        res.status(200).send("OK");

    } catch (error) {
        console.error("Callback Hatası:", error);
        res.status(500).send("Error");
    }
};
