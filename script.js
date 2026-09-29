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

// --- Kamera: siswa wajib ambil selfie sebagai bukti kehadiran ---
let stream = null;
let fotoData = null;
const video = $("video"), fotoImg = $("foto"), canvas = $("canvas"), placeholder = $("camPlaceholder");
const btnCam = $("btnCam"), btnAmbil = $("btnAmbil"), btnUlang = $("btnUlang");

btnCam.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    video.srcObject = stream;
    video.hidden = false;
    fotoImg.hidden = true;
    placeholder.hidden = true;
    btnCam.hidden = true;
    btnAmbil.hidden = false;
  } catch (err) {
    console.error(err);
    pesan("Tidak bisa membuka kamera. Izinkan akses kamera di browser, lalu coba lagi.");
  }
});

btnAmbil.addEventListener("click", () => {
  canvas.width = 320;
  canvas.height = 240;
  canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
  fotoData = canvas.toDataURL("image/jpeg", 0.6);
  fotoImg.src = fotoData;
  fotoImg.hidden = false;
  video.hidden = true;
  if (stream) stream.getTracks().forEach((t) => t.stop());
  btnAmbil.hidden = true;
  btnUlang.hidden = false;
});

btnUlang.addEventListener("click", () => {
  fotoData = null;
  fotoImg.hidden = true;
  placeholder.hidden = false;
  btnUlang.hidden = true;
  btnCam.hidden = false;
});

function resetKamera() {
  fotoData = null;
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
  if (!fotoData) return pesan("Ambil foto dulu sebagai bukti kehadiran.");

  const now = new Date(); // waktu saat tombol kirim ditekan
  const data = {
    nama,
    kelas: $("kelas").value.trim() || "-",
    status: status(),
    keterangan: $("ket").value.trim() || "-",
    tanggal: fTgl.format(now),
    jam: fMenit.format(now),
    zona: "WIB",
    waktu_kirim: `${fTgl.format(now)}, pukul ${fMenit.format(now)} WIB`,
    foto: fotoData,
  };

  const btn = $("kirim");
  btn.disabled = true;
  btn.textContent = "⏳ Mengirim absensi…";
  pesan("");
  const C = window.CONFIG || {};
  const siap = C.publicKey && !C.publicKey.startsWith("ISI_");
  try {
    if (siap) await emailjs.send(C.serviceId, C.templateId, data, { publicKey: C.publicKey });
    else await new Promise((r) => setTimeout(r, 900)); // mode demo
    catat(nama);
    sukses(data, !siap);
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
