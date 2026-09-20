// ==========================================
// KONFIGURASI SUPABASE (KHUSUS TAMU)
// ==========================================
const SUPABASE_URL = 'https://jsyumznqizpcdfrandhh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzeXVtem5xaXpwY2RmcmFuZGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTI3OTQsImV4cCI6MjEwNTI4ODc5NH0.K5_OsvlUkQHr2j_1FtkEx0PPUcBXL5hsjBbwjZHsX4U';

let _supabase = null;
let isDbConnected = false;

try {
    if (SUPABASE_URL.startsWith('http')) {
        _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isDbConnected = true;
    }
} catch (err) {
    console.error("Gagal menghubungkan Supabase:", err);
}

// ==========================================
// VARIABEL KAMERA
// ==========================================
let streamKamera = null;
let fotoBase64 = "";

// ==========================================
// KONTROL NAVIGASI (FORM TAMU)
// ==========================================
function nextStep(stepId) {
    // Sembunyikan semua tahap
    ['step-login', 'step-camera', 'step-print'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('show-transition');
            el.classList.add('hidden-transition');
        }
    });
    
    // Munculkan tahap yang dituju
    setTimeout(() => {
        const target = document.getElementById(stepId);
        if(target) {
            target.classList.remove('hidden-transition');
            target.classList.add('show-transition');
            // Pastikan layar bergulir tepat ke form
            document.getElementById('app-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 150);
}

function resetForm() {
    document.getElementById('inputNama').value = '';
    document.getElementById('inputTujuan').value = '';
    document.getElementById('inputDituju').value = '';
    fotoBase64 = "";
    
    document.getElementById('kamera').classList.add('hidden');
    document.getElementById('hasilFoto').classList.add('hidden');
    document.getElementById('placeholderFoto').classList.remove('hidden');
    
    document.getElementById('btnBukaKamera').classList.remove('hidden');
    document.getElementById('btnAmbilFoto').classList.add('hidden');
    
    nextStep('step-camera');
}

// ==========================================
// FITUR KAMERA
// ==========================================
async function bukaKamera() {
    const video = document.getElementById('kamera');
    try {
        streamKamera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = streamKamera;
        
        video.classList.remove('hidden');
        document.getElementById('placeholderFoto').classList.add('hidden');
        document.getElementById('btnBukaKamera').classList.add('hidden');
        document.getElementById('btnAmbilFoto').classList.remove('hidden');
        document.getElementById('hasilFoto').classList.add('hidden');
    } catch (err) {
        alert("Gagal mengakses kamera: " + err.message);
    }
}

function ambilFoto() {
    const video = document.getElementById('kamera');
    const canvas = document.getElementById('kanvas');
    const hasil = document.getElementById('hasilFoto');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    fotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
    hasil.src = fotoBase64;
    
    video.classList.add('hidden');
    hasil.classList.remove('hidden');
    document.getElementById('btnAmbilFoto').textContent = "Foto Ulang";
    
    if (streamKamera) {
        streamKamera.getTracks().forEach(track => track.stop());
    }
}

// ==========================================
// SUBMIT KE DATABASE SUPABASE
// ==========================================
async function submitTamu() {
    const nama = document.getElementById('inputNama').value;
    const tujuan = document.getElementById('inputTujuan').value;
    const dituju = document.getElementById('inputDituju').value;
    
    const now = new Date();
    const jamMasuk = now.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
    now.setHours(now.getHours() + 2); // Batas waktu 2 jam
    const jamBatas = now.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
    const tanggalFull = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const btn = document.getElementById('btnSubmit');
    btn.innerHTML = `<span class="animate-pulse">Menyimpan...</span>`;
    btn.disabled = true;

    if (isDbConnected) {
        try {
            const { data, error } = await _supabase.from('tamu').insert([
                { 
                    nama: nama, 
                    tujuan: tujuan, 
                    dituju: dituju, 
                    tanggal: tanggalFull,
                    waktu_masuk: jamMasuk,
                    batas_waktu: jamBatas,
                    foto_url: fotoBase64 || '',
                    status: 'Di Dalam'
                }
            ]).select();

            if (error) throw error;
            const newId = data[0].id;
            tampilkanIDCard(nama, tujuan, dituju, jamMasuk, jamBatas, newId, fotoBase64);
            
        } catch (error) {
            console.error("Gagal simpan:", error);
            alert("Gagal menyimpan ke database. ID Card tetap dicetak offline.");
            tampilkanIDCard(nama, tujuan, dituju, jamMasuk, jamBatas, Math.floor(Math.random()*9000)+1000, fotoBase64);
        }
    } else {
        tampilkanIDCard(nama, tujuan, dituju, jamMasuk, jamBatas, Math.floor(Math.random()*9000)+1000, fotoBase64);
    }
    
    btn.innerHTML = `<span>Terbitkan ID Card</span><svg class="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>`;
    btn.disabled = false;
}

function tampilkanIDCard(nama, tujuan, dituju, jamMasuk, jamBatas, id, foto) {
    document.getElementById('idCardNama').textContent = nama;
    document.getElementById('idCardTujuan').textContent = tujuan;
    document.getElementById('idCardDituju').textContent = dituju;
    document.getElementById('idCardWaktu').textContent = jamMasuk;
    document.getElementById('idCardBatas').textContent = jamBatas;
    document.getElementById('idCardNomor').textContent = `VST-${id}`;
    
    if (foto) {
        document.getElementById('idCardFoto').src = foto;
    } else {
        document.getElementById('idCardFoto').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nama)}&background=1e3a8a&color=fff&size=200`;
    }
    
    nextStep('step-print');
}

