export default async function handler(req, res) {
    // 1. CORS BAŞLIKLARINI EKLE (HER İSTEKTE ÇALIŞMALI)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Tüm sitelere izin verir
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // 2. PREFLIGHT (ÖN KONTROL) İSTEĞİNİ YANITLA
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // ... Mevcut PayTR kodların buradan aşağıda devam etsin ...
    if (req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST' });
    
    // const { email, total, ... } = req.body;
    // ...
}
}
const crypto = require('crypto');
const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST kabul edilir' });

    const { email, total, name, address } = req.body;

    // Vercel panelinden ekleyeceğimiz gizli anahtarlar
    const merchant_id = process.env.PAYTR_ID;
    const merchant_key = process.env.PAYTR_KEY;
    const merchant_salt = process.env.PAYTR_SALT;

    const merchant_oid = "REEHA" + Date.now(); 
    const payment_amount = Math.round(total * 100); 
    const user_ip = req.headers['x-forwarded-for'] || '127.0.0.1';
    const user_basket = Buffer.from(JSON.stringify([["Ürünler", total.toString(), "1"]])).toString('base64');

    // PayTR Güvenlik İmzası (Hash)
    const hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + "0" + "0" + "TL" + "0";
    const paytr_token = crypto.createHmac('sha256', merchant_key).update(hash_str + merchant_salt).digest('base64');

    const params = new URLSearchParams({
        merchant_id, user_ip, merchant_oid, email, payment_amount, paytr_token,
        user_basket, user_name: name, user_address: address, user_phone: '05000000000',
        merchant_ok_url: "https://reeha.vercel.app/success",
        merchant_fail_url: "https://reeha.vercel.app/fail",
        debug_on: "1", test_mode: "1", no_installment: "0", max_installment: "0", currency: "TL"
    });

    try {
        const response = await axios.post('https://www.paytr.com/odeme/guvenli/bin', params);
        res.status(200).json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
