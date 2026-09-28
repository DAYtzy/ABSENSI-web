# Absensi Siswa

Web statis (HTML, CSS, JS). Data absensi dikirim ke email guru lewat EmailJS.

## Coba dulu
Buka `index.html`. Selama `config.js` belum diisi, web berjalan dalam **mode demo** (tampilan dan alur jalan, email belum terkirim).

## Hubungkan ke email guru (EmailJS)
1. Daftar/login di emailjs.com.
2. **Email Services** > Add New Service (misalnya Gmail). Salin **Service ID**.
3. **Email Templates** > Create New Template.
   - To Email: email guru/pengelola
   - Subject: `Absensi {{nama}} - {{status}}`
   - Isi pesan (variabel yang tersedia):
     ```
     Nama: {{nama}}
     Kelas: {{kelas}}
     Status: {{status}}
     Keterangan: {{keterangan}}
     Dikirim: {{waktu_kirim}}
     Jam: {{jam}} {{zona}}
     ```
   Salin **Template ID**.
4. **Account** > **General** > salin **Public Key**.
5. Tempel ketiganya di `config.js`.

Kuota email gratis EmailJS terbatas, jadi cek batasnya di dashboard kalau siswanya banyak.

## Deploy
1. Upload semua file (`index.html`, `style.css`, `script.js`, `config.js`) ke repository GitHub.
2. Di vercel.com pilih **Add New Project**, impor repository itu, lalu **Deploy**.

## Catatan
- Tanggal dan jam memakai zona Asia/Jakarta (WIB) dan berganti hari otomatis tiap 00:00.
- Satu nama hanya bisa absen sekali per hari di perangkat yang sama.
- Rekap tidak ditampilkan ke siswa; semua masuk ke email guru.
