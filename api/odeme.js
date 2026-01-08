export default async function handler(req, res) {
    // 1. ADIM: KESİN CORS İZİNLERİ
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Tarayıcı ön-kontrolü (Preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Sadece POST isteği atabilirsin knk." });
    }

    try {
        const { name, size } = req.body;

        // Vercel'deki Environment Variables'dan çekiyoruz
        const apiUser = process.env.SHOPIER_USER;
        const apiPass = process.env.SHOPIER_PASS;

        const data = {
            "APIuser": apiUser,
            "APIpassword": apiPass,
            "order_id": "REEHA" + Date.now(),
            "product_name": String(name + " " + size),
            "price": "650", 
            "currency": "TRY",
            "buyer_name": "Reeha",
            "buyer_surname": "Customer",
            "buyer_email": "info@reeha.com.tr",
            "buyer_phone": "05320000000",
            "callback_url": "https://reeha.com.tr/success.html"
        };

        const response = await fetch("https://www.shopier.com/api/v1/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.text();

        if (result.includes('<form')) {
            res.status(200).send(result);
        } else {
            res.status(400).send(result); // Shopier'den gelen hata mesajı (örn: geçersiz şifre)
        }

    } catch (err) {
        res.status(500).json({ error: "Backend Hatası", detay: err.message });
    }
}
