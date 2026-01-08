export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { name, price, size } = req.body;

    // ÖNEMLİ: Shopier API kullanıcısı ve şifresi Vercel Environment Variables'da tanımlı olmalı.
    const data = {
        "APIuser": process.env.SHOPIER_USER,
        "APIpassword": process.env.SHOPIER_PASS,
        "order_id": "REEHA" + Math.floor(Math.random() * 1000000), // Benzersiz ID
        "product_name": String(name + " " + size),
        "price": "650", // Paneldeki fiyatla kuruşu kuruşuna aynı olmalı
        "currency": "TRY",
        "buyer_name": "Reeha",
        "buyer_surname": "Customer",
        "buyer_email": "info@reeha.com.tr",
        "buyer_phone": "05320000000", // Gerçekçi formatta bir numara
        "callback_url": "https://reeha.com.tr/success.html"
    };

    try {
        const response = await fetch("https://www.shopier.com/api/v1/payment", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "text/html" // Form beklediğimizi belirtiyoruz
            },
            body: JSON.stringify(data)
        });

        const result = await response.text();

        // Eğer gelen cevapta <form tagı yoksa Shopier hata döndürmüştür
        if (!result.includes('<form')) {
            console.error("Shopier Hata Yanıtı:", result);
            return res.status(400).send("Shopier Hatası: " + result);
        }

        res.status(200).send(result);

    } catch (error) {
        console.error("Catch Hatası:", error);
        res.status(500).json({ error: "Sistemsel bir hata oluştu." });
    }
}
