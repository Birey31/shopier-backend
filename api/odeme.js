window.startCheckout = function() {
    if (cart.length === 0) return;

    const item = cart[0]; // Sepetteki ilk ürün
    const btn = document.getElementById('checkoutBtnLabel');
    btn.innerText = "bağlanıyor...";

    fetch("https://shopier-backend-1.vercel.app/api/odeme", { // Kendi Vercel linkini yaz
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: item.name,
            price: item.price,
            size: item.size
        })
    })
    .then(res => res.text()) // Gelen veri HTML formudur
    .then(html => {
        // Formu sayfaya gizlice ekle ve otomatik gönder
        const div = document.createElement('div');
        div.style.display = 'none';
        div.innerHTML = html;
        document.body.appendChild(div);
        div.querySelector('form').submit(); // SHOPİER'E UÇUŞ!
    })
    .catch(err => alert("Hata: " + err));
};
