export default async function handler(req, res) {
    // --- CORS AYARLARI BAŞLANGIÇ ---
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Tüm originlere izin ver
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // OPTIONS isteğini (Preflight) hemen yanıtla
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    // --- CORS AYARLARI BİTİŞ ---

    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { name, price, size } = req.body;

    const data = {
        "APIuser": process.env.SHOPIER_USER,
        "APIpassword": process.env.SHOPIER_PASS,
        "order_id": "REEHA-" + Date.now(),
        "product_name": `${name} (${size})`,
        "price": "650",
        "currency": "TRY",
        "buyer_name": "Reeha",
        "buyer_surname": "Customer",
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

        const formHtml = await response.text();
        res.status(200).send(formHtml);
    } catch (error) {
        res.status(500).json({ error: "Shopier baglanti hatasi" });
    }
}
