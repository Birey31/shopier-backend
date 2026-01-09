const crypto = require('crypto');
const axios = require('axios');

module.exports = async function handler(req, res) {
    // 1. CORS AYARLARI
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { email, total, name, address } = req.body;

        // DEĞİŞKENLERİ KONTROL ET VE BOŞLUKLARI TEMİZLE
        const m_id = (process.env.PAYTR_ID || "").trim();
        const m_key = (process.env.PAYTR_KEY || "").trim();
        const m_salt = (process.env.PAYTR_SALT || "").trim();

        // IP VE ÖDEME DETAYLARI
        const user_ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '1.2.3.4').split(',')[0].trim();
        const merchant_oid = "REEHA" + Date.now(); 
        const payment_amount = Math.round(total * 100); 
        
        // Sepet (Türkçe karakter içermemeli)
        const user_basket = Buffer.from(JSON.stringify([["Order", total.toString(), "1"]])).toString('base64');

        // AYARLAR
        const no_installment = "0"; 
        const max_installment = "0";
        const currency = "TL";
        const test_mode = "1"; 

        // --- HASH DİZİLİMİ (PAYTR STANDARDI) ---
        const hash_str = m_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode;
        const paytr_token = crypto.createHmac('sha256', m_key).update(hash_str + m_salt).digest('base64');

        const params = new URLSearchParams({
            merchant_id: m_id,
            user_ip: user_ip,
            merchant_oid: merchant_oid,
            email: email,
            payment_amount: payment_amount,
            paytr_token: paytr_token,
            user_basket: user_basket,
            user_name: name,
            user_address: address,
            user_phone: '5348755760', // Başında 0 olmadan 10 hane
            merchant_ok_url: "https://reeha.com.tr/success",
            merchant_fail_url: "https://reeha.com.tr/fail",
            debug_on: "1",
            test_mode: test_mode,
            no_installment: no_installment,
            max_installment: max_installment,
            currency: currency
        });

        // EN GARANTİ URL: get_token
        const response = await axios.post('https://www.paytr.com/odeme/guvenli/get_token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data.status === 'success') {
            res.status(200).json({ status: 'success', token: response.data.token });
        } else {
            // PayTR'nin verdiği gerçek hatayı döndür (Örn: "Geçersiz Hash")
            res.status(200).json({ status: 'failed', err_msg: response.data.err_msg || "Token alınamadı" });
        }

    } catch (err) {
        console.error("Sistem Hatası:", err.message);
        res.status(500).json({ error: "Sunucu hatası: " + err.message });
    }
};
