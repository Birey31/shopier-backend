const crypto = require('crypto');
const axios = require('axios');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { email, total, name, address } = req.body;

        const m_id = process.env.PAYTR_ID.trim();
        const m_key = process.env.PAYTR_KEY.trim();
        const m_salt = process.env.PAYTR_SALT.trim();

        // IP KISMI: PayTR bazen Vercel'in IPv6 adreslerini sevmez. 
        // Burayı en stabil hale getiriyoruz.
        let user_ip = req.headers['x-forwarded-for'] || '1.2.3.4';
        user_ip = user_ip.split(',')[0].trim();

        const merchant_oid = "REEHA" + Date.now();
        const payment_amount = Math.round(total * 100);
        
        // SEPET: Karmaşık sepet yapısı yerine en sade hali (Döküman örneği)
        const user_basket = Buffer.from(JSON.stringify([["Urun", total.toString(), "1"]])).toString('base64');

        // Sabit Ayarlar
        const no_installment = "0";
        const max_installment = "0";
        const currency = "TL";
        const test_mode = "1";

        // --- HASH SIRALAMASI (ASLA DEĞİŞMEMELİ) ---
        const hash_str = m_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode;
        const paytr_token = crypto.createHmac('sha256', m_key).update(hash_str + m_salt).digest('base64');

        const params = new URLSearchParams();
        params.append('merchant_id', m_id);
        params.append('user_ip', user_ip);
        params.append('merchant_oid', merchant_oid);
        params.append('email', email);
        params.append('payment_amount', payment_amount);
        params.append('paytr_token', paytr_token);
        params.append('user_basket', user_basket);
        params.append('user_name', name);
        params.append('user_address', address);
        params.append('user_phone', '5348755760'); // 10 hane, başında 0 yok
        params.append('merchant_ok_url', 'https://reeha.com.tr/success');
        params.append('merchant_fail_url', 'https://reeha.com.tr/fail');
        params.append('debug_on', '1');
        params.append('test_mode', test_mode);
        params.append('no_installment', no_installment);
        params.append('max_installment', max_installment);
        params.append('currency', currency);

        const response = await axios.post('https://www.paytr.com/odeme/guvenli/ucret', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data.status === 'success') {
            res.status(200).json({ status: 'success', token: response.data.token });
        } else {
            // PayTR'den gelen asıl hata mesajını buraya yazdırıyoruz
            res.status(200).json({ status: 'failed', err_msg: response.data.err_msg || "PayTR Token Hatasi" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
