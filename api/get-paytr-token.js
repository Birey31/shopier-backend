export default async function handler(req, res) {
    // CORS İzinlerini en başa ekliyoruz
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Shopier Verisi
    const data = {
        "APIuser": process.env.SHOPIER_USER,
        "APIpassword": process.env.SHOPIER_PASS,
        "order_id": "REEHA" + Date.now(),
        "product_name": "Reeha Ürün",
        "price": "650", export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const data = {
        "APIuser": process.env.SHOPIER_USER,
        "APIpassword": process.env.SHOPIER_PASS,
        "order_id": "REEHA" + Date.now(),
        "product_name": "Reeha Tshirt",
        "price": "650",
        "currency": "TRY",
        "buyer_name": "Adem",
        "buyer_surname": "Customer",
        "buyer_email": "test@reeha.com.tr",
        "buyer_phone": "05320000000",
        "callback_url": "https://reeha.com.tr/success.html"
    };

    try {
        const response = await fetch("https://www.shopier.com/api/v1/payment", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                // İŞTE KRİTİK NOKTA: Kendimizi Chrome tarayıcı gibi tanıtıyoruz
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3"
            },
            body: JSON.stringify(data)
        });

        const result = await response.text();

        if (result.includes('<form')) {
            res.status(200).send(result);
        } else {
            // Eğer hala bot engeline takılırsak hatayı görelim
            res.status(403).send(result); 
        }

    } catch (err) {
        res.status(500).json({ error: "Server Hatası" });
    }
}
        "currency": "TRY",
        "buyer_name": "Müşteri",
        "buyer_surname": "Test",
        "buyer_email": "test@reeha.com.tr",
        "buyer_phone": "05555555555",
        "callback_url": "https://reeha.com.tr/success.html"
    };

    try {
        const response = await fetch("https://www.shopier.com/api/v1/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.text();
        res.status(200).send(result);

    } catch (err) {
        res.status(500).send("Hata: " + err.message);
    }
}
