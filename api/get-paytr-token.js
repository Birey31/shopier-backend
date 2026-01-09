const crypto = require('crypto');
const axios = require('axios');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        let { email, total, name, address } = req.body;

        const m_id = process.env.PAYTR_ID.trim();
        const m_key = process.env.PAYTR_KEY.trim();
        const m_salt = process.env.PAYTR_SALT.trim();

        // ADRES VE İSİM TEMİZLEME (Özel karakterleri siliyoruz)
        const cleanName = name.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ ]/g, "");
        const cleanAddress = address.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ ]/g, "");

        const user_ip = '1.2.3.4'; 
        const merchant_oid = "REEHA" + Date.now();
        const payment_amount = Math.round(total * 100);
        
        const user_basket = Buffer.from(JSON.stringify([["Urun", total.toString(), "1"]])).toString('base64');

        // Hash Dizesi
        const hash_str = m_id + user_ip + merchant_oid + email + payment_amount + user_basket + "0" + "0" + "TL" + "1";
        const paytr_token = crypto.createHmac('sha256', m_key).update(hash_str + m_salt).digest('base64');

        const params = new URLSearchParams();
        params.append('merchant_id', m_id);
        params.append('user_ip', user_ip);
        params.append('merchant_oid', merchant_oid);
        params.append('email', email);
        params.append('payment_amount', payment_amount);
        params.append('paytr_token', paytr_token);
        params.append('user_basket', user_basket);
        params.append('user_name', cleanName); // Temizlenmiş isim
        params.append('user_address', cleanAddress); // Temizlenmiş adres
        params.append('user_phone', '5348755760'); 
        params.append('merchant_ok_url', 'https://reeha.com.tr/success');
        params.append('merchant_fail_url', 'https://reeha.com.tr/fail');
        params.append('debug_on', '1');
        params.append('test_mode', '1');
        params.append('no_installment', '0');
        params.append('max_installment', '0');
        params.append('currency', 'TL');

        const response = await axios.post('https://www.paytr.com/odeme/guvenli/ucret', params.toString());

        if (response.data.status === 'success') {
            res.status(200).json({ status: 'success', token: response.data.token });
        } else {
            res.status(200).json({ status: 'failed', err_msg: response.data.err_msg });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
