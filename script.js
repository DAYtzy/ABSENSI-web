const TZ = "Asia/Jakarta"; // WIB, tidak tergantung zona waktu HP/laptop siswa
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

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nama = $("nama").value.trim().replace(/\s+/g, " ");
  if (nama.length < 3) return pesan("Tulis nama lengkapmu dulu ya (minimal 3 huruf).");
  if (baca().includes(nama.toLowerCase())) return pesan(nama + " sudah absen hari ini.");

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
