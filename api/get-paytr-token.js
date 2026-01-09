const crypto = require('crypto');
const axios = require('axios');

module.exports = async function handler(req, res) {
    // 1. CORS BAŞLIKLARI (Tarayıcı engelini aşmak için)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Preflight kontrolü
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Sadece POST kabul edilir' });
    }

    try {
        // --- BURASI EKSİK OLAN VERİ TOPLAMA KISMI ---
        const { email, total, name, address } = req.body;

        const merchant_id = process.env.PAYTR_ID;
        const merchant_key = process.env.PAYTR_KEY;
        const merchant_salt = process.env.PAYTR_SALT;

        // 2. SÖYLEDIĞİM IP DÜZELTMESİ BURADA:
        const user_ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '1.2.3.4').split(',')[0].trim();

        const merchant_oid = "REEHA" + Date.now(); 
        const payment_amount = Math.round(total * 100); 
        const user_basket = Buffer.from(JSON.stringify([["Ürünler", total.toString(), "1"]])).toString('base64');

        // PayTR Güvenlik İmzası (Hash) Hesaplama
        const hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + "0" + "0" + "TL" + "0";
        const paytr_token = crypto.createHmac('sha256', merchant_key).update(hash_str + merchant_salt).digest('base64');

        const params = new URLSearchParams({
            merchant_id, user_ip, merchant_oid, email, payment_amount, paytr_token,
            user_basket, user_name: name, user_address: address, user_phone: '05000000000',
            merchant_ok_url: "https://reeha.com.tr/success",
            merchant_fail_url: "https://reeha.com.tr/fail",
            debug_on: "1", test_mode: "1", no_installment: "0", max_installment: "0", currency: "TL"
        });
        // --- EKSİK KISIM BURADA BİTTİ ---

        const response = await axios.post('https://www.paytr.com/odeme/guvenli/bin', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // PayTR'den gelen cevabı terminale (Vercel Logs) yazdır
        console.log("PayTR Cevabı:", response.data);

        if (response.data.status === 'success') {
            res.status(200).json({ status: 'success', token: response.data.token });
        } else {
            res.status(200).json({ status: 'failed', err_msg: response.data.err_msg });
        }
    } catch (err) {
        console.error("Sistem Hatası:", err.message);
        res.status(500).json({ error: err.message });
    }
};
