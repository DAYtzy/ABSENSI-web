const TZ = "Asia/Jakarta"; // WIB, tidak tergantung zona waktu HP siswa
const $ = (id) => document.getElementById(id);

const fJam = new Intl.DateTimeFormat("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
const fMenit = new Intl.DateTimeFormat("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const fTgl = new Intl.DateTimeFormat("id-ID", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }); // YYYY-MM-DD

// Jam & tanggal dihitung ulang tiap detik, jadi otomatis ganti hari tepat 00:00 WIB
function tick() {
  const now = new Date();
  $("jam").textContent = fJam.format(now);
  $("tanggal").textContent = fTgl.format(now);
}
tick();
setInterval(tick, 1000);

// Keterangan hanya muncul kalau status bukan Hadir
const status = () => document.querySelector("input[name=status]:checked").value;
const toggleKet = () => { $("ketBox").hidden = status() === "Hadir"; };
document.querySelectorAll("input[name=status]").forEach((r) => r.addEventListener("change", toggleKet));

// Cegah absen ganda: satu nama hanya sekali per hari (di perangkat ini)
const kunci = () => "absen:" + fKey.format(new Date());
const baca = () => { try { return JSON.parse(localStorage.getItem(kunci()) || "[]"); } catch { return []; } };
const catat = (n) => { try { localStorage.setItem(kunci(), JSON.stringify([...baca(), n.toLowerCase()])); } catch {} };
const pesan = (t) => { $("pesan").textContent = t; };

// --- Kamera: hasil foto disimpan sebagai FILE ASLI di <input type="file">,
// bukan teks base64, supaya email mengirimnya sebagai lampiran sungguhan ---
let stream = null;
let previewUrl = null;
const video = $("video"), fotoImg = $("foto"), canvas = $("canvas"), placeholder = $("camPlaceholder");
const btnCam = $("btnCam"), btnAmbil = $("btnAmbil"), btnUlang = $("btnUlang");
const fotoInput = $("fotoInput");

btnCam.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    video.srcObject = stream;
    video.hidden = false;
    fotoImg.hidden = true;
    placeholder.hidden = true;
    // Tunggu kamera benar-benar mengirim gambar (bukan cuma metadata) supaya foto tidak hitam
    if (video.readyState < 2) {
      await new Promise((resolve) => video.addEventListener("loadeddata", resolve, { once: true }));
    }
    btnCam.hidden = true;
    btnAmbil.hidden = false;
  } catch (err) {
    console.error(err);
    pesan("Tidak bisa membuka kamera. Izinkan akses kamera di browser, lalu coba lagi.");
  }
});

btnAmbil.addEventListener("click", () => {
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
  const maxSisi = 640; // batasi ukuran biar file tidak kebesaran, tanpa mengubah bentuk aslinya
  const skala = Math.min(1, maxSisi / Math.max(vw, vh));
  canvas.width = Math.round(vw * skala);
  canvas.height = Math.round(vh * skala);
  canvas.getContext("2d").drawImage(video, 0, 0, vw, vh, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const file = new File([blob], "foto-absensi.jpg", { type: "image/jpeg" });
      const dt = new DataTransfer();
      dt.items.add(file);
      fotoInput.files = dt.files;

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(blob);
      fotoImg.src = previewUrl;
      fotoImg.hidden = false;
      video.hidden = true;
    },
    "image/jpeg",
    0.7
  );
  if (stream) stream.getTracks().forEach((t) => t.stop());
  btnAmbil.hidden = true;
  btnUlang.hidden = false;
});

btnUlang.addEventListener("click", () => {
  fotoInput.value = "";
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  fotoImg.hidden = true;
  placeholder.hidden = false;
  btnUlang.hidden = true;
  btnCam.hidden = false;
});

function resetKamera() {
  fotoInput.value = "";
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  fotoImg.hidden = true;
  video.hidden = true;
  placeholder.hidden = false;
  btnAmbil.hidden = true;
  btnUlang.hidden = true;
  btnCam.hidden = false;
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nama = $("nama").value.trim().replace(/\s+/g, " ");
  if (nama.length < 3) return pesan("Tulis nama lengkapmu dulu ya (minimal 3 huruf).");
  if (baca().includes(nama.toLowerCase())) return pesan(nama + " sudah absen hari ini.");
  if (!fotoInput.files || !fotoInput.files.length) return pesan("Ambil foto dulu sebagai bukti kehadiran.");

  const now = new Date(); // waktu saat tombol kirim ditekan
  const kelas = $("kelas").value.trim() || "-";
  const ketVal = $("ket").value.trim() || "-";
  $("hTanggal").value = fTgl.format(now);
  $("hJam").value = fMenit.format(now);
  $("hWaktu").value = `${fTgl.format(now)}, pukul ${fMenit.format(now)} WIB`;
  $("kelas").value = kelas;
  $("ket").value = ketVal;

  const ringkas = { nama, status: status(), jam: fMenit.format(now), tanggal: fTgl.format(now) };

  const btn = $("kirim");
  btn.disabled = true;
  btn.textContent = "⏳ Mengirim absensi…";
  pesan("");
  const C = window.CONFIG || {};
  const siap = C.publicKey && !C.publicKey.startsWith("ISI_");
  try {
    if (siap) await emailjs.sendForm(C.serviceId, C.templateId, $("form"), { publicKey: C.publicKey });
    else await new Promise((r) => setTimeout(r, 900)); // mode demo
    catat(nama);
    sukses(ringkas, !siap);
    $("form").reset();
    toggleKet();
    resetKamera();
  } catch (err) {
    console.error(err);
    pesan("Absensi belum terkirim. Cek internetmu lalu tekan Kirim lagi.");
  } finally {
    btn.disabled = false;
    btn.textContent = "🚀 Kirim Absensi";
  }
});

function sukses(d, demo) {
  $("ringkas").textContent = `${d.nama} (${d.status})`;
  $("waktuKirim").textContent = `🕒 Dikirim pukul ${d.jam} WIB, ${d.tanggal}`;
  $("demo").hidden = !demo;
  $("sukses").hidden = false;
  const warna = ["#f472b6", "#facc15", "#22d3ee", "#a78bfa", "#34d399"];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("i");
    c.className = "cf";
    c.style.cssText = `left:${Math.random() * 100}vw;background:${warna[i % 5]};animation-delay:${Math.random() * 0.6}s;animation-duration:${1.8 + Math.random() * 1.5}s`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4000);
  }
}
$("tutup").onclick = () => { $("sukses").hidden = true; };
$("sukses").addEventListener("click", (e) => { if (e.target.id === "sukses") $("sukses").hidden = true; });
