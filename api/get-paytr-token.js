const crypto = require('crypto');
const axios = require('axios');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { email, total, name, address } = req.body;

        const m_id = (process.env.PAYTR_ID || "").trim();
        const m_key = (process.env.PAYTR_KEY || "").trim();
        const m_salt = (process.env.PAYTR_SALT || "").trim();

        // 1. DÜZELTME: IP adresi PayTR için çok kritiktir. 
        // Vercel'den gelen IP'yi en temiz haliyle alıyoruz.
        let user_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '1.2.3.4';
        if (user_ip.includes(',')) user_ip = user_ip.split(',')[0].trim();

        const merchant_oid = "REEHA" + Date.now(); 
        const payment_amount = Math.round(total * 100); 
        const user_basket = Buffer.from(JSON.stringify([["Siparis", total.toString(), "1"]])).toString('base64');

        const no_installment = "0"; 
        const max_installment = "0";
        const currency = "TL";
        const test_mode = "1"; 

        // 2. DÜZELTME: Hash dizilimi PayTR'nin en güncel dökümanına göredir.
        // Sıralama: id + ip + oid + email + amount + basket + no_inst + max_inst + curr + test_mode
        const hash_str = m_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode;
        const paytr_token = crypto.createHmac('sha256', m_key).update(hash_str + m_salt).digest('base64');

        const params = new URLSearchParams({
            merchant_id: m_id,
            user_ip: '1.2.3.4';,
            merchant_oid: merchant_oid,
            email: email,
            payment_amount: payment_amount,
            paytr_token: paytr_token,
            user_basket: user_basket,
            user_name: name,
            user_address: address,
            user_phone: '05348755760',
            merchant_ok_url: "https://reeha.com.tr/success",
            merchant_fail_url: "https://reeha.com.tr/fail",
            debug_on: "1", // Bunu 1 tutuyoruz ki hata mesajı gelsin
            test_mode: test_mode,
            no_installment: no_installment,
            max_installment: max_installment,
            currency: currency
        });

        const response = await axios.post('https://www.paytr.com/odeme/guvenli/get_token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        // PayTR bazen hatayı objenin içinde err_msg olarak değil, 
        // doğrudan response olarak dönebilir.
        if (response.data.status === 'success') {
            res.status(200).json({ status: 'success', token: response.data.token });
        } else {
            // PAYTR'NİN DÖNDÜRDÜĞÜ GERÇEK HATA MESAJINI YAKALAMA
            const errorReason = response.data.err_msg || response.data.reason || "PayTR Hatası (Parametreleri kontrol edin)";
            res.status(200).json({ status: 'failed', err_msg: errorReason });
        }

    } catch (err) {
        console.error("Sistem Hatası:", err.message);
        res.status(500).json({ error: "Sunucu hatası: " + err.message });
    }
};
