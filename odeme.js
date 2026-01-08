export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "https://reeha.com.tr");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST" });
  }

  const { beden } = req.body;

  const params = new URLSearchParams();
  params.append("APIuser", process.env.SHOPIER_USER);
  params.append("APIpassword", process.env.SHOPIER_PASS);
  params.append("order_id", "ORD" + Date.now());
  params.append("product_name", "T-SHIRT - BEDEN: " + beden);
  params.append("price", "499");
  params.append("currency", "TRY");
  params.append("success_url", "https://reeha.com.tr/basarili");
  params.append("fail_url", "https://reeha.com.tr/hata");

  const shopier = await fetch("https://www.shopier.com/api/payment", {
    method: "POST",
    body: params
  });

  const result = await shopier.text();

  res.status(200).json({ url: result });
}
