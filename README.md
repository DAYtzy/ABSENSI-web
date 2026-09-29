# Absensi Siswa + Kamera

## Apa yang baru
Sebelum kirim, siswa wajib buka kamera depan dan ambil foto selfie. Tombol
"Kirim Absensi" akan menolak kalau foto belum diambil. Foto ikut terkirim ke
email guru.

## Cara pasang
1. Buka repo `ABSENSI-web` di GitHub.
2. Upload ulang 4 file ini, timpa yang lama:
   - `index.html`
   - `style.css`
   - `script.js`
   - `config.js` (sudah diisi otomatis dengan data EmailJS-mu sebelumnya:
     Service ID `service_mms925c`, Template ID `template_z6o3eyc`)
3. Commit changes. Tunggu sekitar 30 detik, Vercel akan memperbarui web
   otomatis.

## Supaya foto ikut muncul di email
Buka template EmailJS (`Contact Us`), edit **Content**, lalu tambahkan baris
ini sebelum `</div>` penutup:

```html
<img src="{{foto}}" style="max-width:200px;border-radius:12px;margin-top:12px;">
```

Simpan template. Setelah itu foto siswa akan tampil di badan email.

## Catatan
- Kamera hanya bisa dibuka di halaman HTTPS. Link `.vercel.app` sudah HTTPS,
  jadi aman.
- Browser akan meminta izin kamera setiap kali web dibuka pertama kali.
- Foto dikompres kecil (320x240, kualitas 60%) supaya email tidak gagal
  terkirim karena ukuran terlalu besar.
- Fitur anti absen ganda tetap berlaku: satu nama hanya bisa kirim sekali per
  hari, di perangkat yang sama.
