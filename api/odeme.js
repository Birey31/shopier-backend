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
        "price": "650",
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
