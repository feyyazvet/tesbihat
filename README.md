# Tesbihat

Günlük virdler, dualar, zikirmatik ve okunacak sûreler. Tek sayfalık, telefona kurulabilen (PWA) ve internetsiz çalışan bir web uygulaması.

## Dosyalar

| Dosya / Klasör | Ne işe yarar |
|---|---|
| `index.html` | Uygulamanın tamamı: tasarım, dualar, zikirler, sûreler ve kod |
| `sw.js` | Service worker — uygulamayı telefona kaydeder, internetsiz çalıştırır |
| `manifest.webmanifest` | Uygulama adı, renkleri, simgeleri (ana ekrana ekleme için) |
| `icons/` | Uygulama simgeleri |
| `ses/` | Sesli dualar (`.m4a` iPhone + Android, `.ogg` yedek) |
| `vercel.json`, `.vercelignore` | Vercel yayın ayarları |
| `görüntü/`, `notlar.md` | Kaynak fotoğraflar ve derleme notları (yayına çıkmaz) |

**Kur'an sayfaları:** Cüz ve sûreler uygulama içinde, Quran.com API'sinden gelen Uthmânî hat + tecvid işaretleri ve Diyanet meali ile gösterilir. İlk açılışta internet gerekir; açılan sayfalar `tesbihat-quran` önbelleğinde saklanır ve sonra internetsiz okunur.

**Tilavet (kurra sesleri):** Kur'an sayfalarında ve tam âyetlerden oluşan dua bölümlerinde âyet âyet tilavet dinlenir (everyayah.com). Kurra seçimi (Abdülbâsıt ve Minşâvî mücevved/makamlı dahil 11 kurra), tekrar (3×, 7×, sürekli), hız ve kilit ekranı kontrolleri vardır. Dinlenen âyetler `tesbihat-tilavet` önbelleğinde saklanır (en fazla 600 âyet) ve sonra internetsiz çalar.

**Tecvid renkleri:** Dualardaki Arapça metinler `index.html` içindeki `tajweed()` fonksiyonuyla otomatik renklendirilir (gunne, ihfâ, idgâm, iklâb, kalkale, med, okunmayan harf). Ayarlar'dan kapatılabilir.

## ⚠️ Güncelleme yaparken (önemli)

Dualar, zikirler, sûreler, tasarım, ses veya simge dosyalarında **her değişiklikten sonra**, yayınlamadan önce:

1. `sw.js` dosyasını açın.
2. En üstteki `VERSION` değerini bir artırın:

   ```js
   const VERSION = "tesbihat-v1";   // →  "tesbihat-v2"  →  "tesbihat-v3" …
   ```

3. Yeni bir ses veya simge dosyası eklediyseniz, aynı dosyadaki `PRECACHE` listesine de ekleyin.
4. Yayınlayın.

Bunu yapmazsanız telefona kurulu uygulama eski kopyayı göstermeye devam edebilir. Sürüm değişince telefonlar eski kopyayı silip yenisini indirir.

> Kullanıcıların sayaçları, işaretleri ve 40 günlük takipleri sürüm değişiminden etkilenmez; telefonun hafızasında kalır.

## Yerelde çalıştırma

```bash
python -m http.server 8765
```

Ardından tarayıcıda `http://localhost:8765` adresini açın.

## Vercel'e yayınlama

```bash
npx vercel --prod
```

Ya da vercel.com/new adresinden klasörü sürükleyip bırakın.

## Telefona kurma

- **Android (Chrome):** Siteyi açın → Ayarlar → **Yükle**.
- **iPhone (Safari):** Siteyi açın → **Paylaş** → **Ana Ekrana Ekle**.
