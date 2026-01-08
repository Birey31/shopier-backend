export default async function handler(req, res) {
    // 1. ADIM: TÜM DÜNYAYA VE REEHA.COM.TR'YE KAPIYI AÇ (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // '*' her yere izin verir
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Tarayıcının "Geleyim mi?" sorusuna (OPTIONS) "Gel" cevabı ver
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).send('Sadece POST istekleri kabul edilir.');
    }

    const { name, size } = req.body;

    const data = {
        "APIuser": process.env.SHOPIER_USER,
        "APIpassword": process.env.SHOPIER_PASS,
        "order_id": "REEHA" + Math.floor(Math.random() * 1000000),
        "product_name": String(name + " " + size),
        "price": "650", 
        "currency": "TRY",
        "buyer_name": "Reeha",
        "buyer_surname": "Customer",
        "buyer_email": "test@reeha.com.tr",
        "buyer_phone": "05320000000",
        "callback_url": "https://reeha.com.tr/success.html"
    };

    try {
        const response = await fetch("https://www.shopier.com/api/v1/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.text();

        if (result.includes('<form')) {
            res.status(200).send(result);
        } else {
            // Eğer Shopier hata verirse, hatayı frontend'e şeffafça gönder
            res.status(400).send("Shopier Yanıtı: " + result);
        }

    } catch (error) {
        res.status(500).json({ error: "Sunucu Hatası", details: error.message });
    }
}
