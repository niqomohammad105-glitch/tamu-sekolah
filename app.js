// ==========================================
// KONFIGURASI SUPABASE (FINAL)
// ==========================================
const SUPABASE_URL = 'https://jsyumznqizpcdfrandhh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzeXVtem5xaXpwY2RmcmFuZGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTI3OTQsImV4cCI6MjEwNTI4ODc5NH0.K5_OsvlUkQHr2j_1FtkEx0PPUcBXL5hsjBbwjZHsX4U';

let _supabase = null;
let isDbConnected = false;

try {
    if (SUPABASE_URL.startsWith('http')) {
        _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isDbConnected = true;
    } else {
        console.warn("URL Supabase tidak valid.");
    }
} catch (err) {
    console.error("Gagal menghubungkan Supabase:", err);
}

// ==========================================
// VARIABEL GLOBAL & INISIALISASI
// ==========================================
let streamKamera = null;
let fotoBase64 = "";

document.addEventListener('DOMContentLoaded', () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('adminTanggal').textContent = new Date().toLocaleDateString('id-ID', options);
    
    // Tampilkan tabel admin di latar belakang jika web online
    if (isDbConnected) fetchDataAdmin();
});

// ==========================================
// KONTROL NAVIGASI UI (YANG BARU & FLEKSIBEL)
// ==========================================
function nextStep(stepId) {
    // 1. Sembunyikan semua langkah dengan rapi (tanpa merusak desain HTML)
    ['step-login', 'step-camera', 'step-print'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('show-transition');
            el.classList.add('hidden-transition');
        }
    });
    
    // 2. Munculkan langkah yang dituju dengan animasi meluncur
    setTimeout(() => {
        const target = document.getElementById(stepId);
        if(target) {
            target.classList.remove('hidden-transition');
            target.classList.add('show-transition');
            
            // Gulir layar otomatis agar pas di tengah HP
            document.getElementById('app-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 150);
}

function toggleAdmin() {
    const adminView = document.getElementById('view-admin');
    if (adminView.classList.contains('hidden-transition')) {
        // Buka halaman Admin secara penuh
        adminView.classList.remove('hidden-transition');
        adminView.classList.add('flex'); 
        if (isDbConnected) fetchDataAdmin();
    } else {
        // Tutup halaman Admin
        adminView.classList.add('hidden-transition');
        setTimeout(() => { adminView.classList.remove('flex'); }, 400); // Tunggu animasi tutup selesai
    }
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
            alert("Gagal menyimpan ke database. Menampilkan mode cetak offline.");
            tampilkanIDCard(nama, tujuan, dituju, jamMasuk, jamBatas, Math.floor(Math.random()*9000)+1000, fotoBase64);
        }
    } else {
        // Mode Offline
        tampilkanIDCard(nama, tujuan, dituju, jamMasuk, jamBatas, Math.floor(Math.random()*9000)+1000, fotoBase64);
    }
    
    btn.innerHTML = `<span>Terbitkan ID Card</span><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>`;
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

// ==========================================
// RENDER TABEL ADMIN
// ==========================================
async function fetchDataAdmin() {
    const tbody = document.getElementById('tabelAdmin');
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-slate-500 animate-pulse">Menghubungkan ke Database...</td></tr>`;

    try {
        const { data, error } = await _supabase.from('tamu').select('*').order('id', { ascending: false });
        if (error) throw error;

        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-slate-500">Belum ada tamu terdaftar.</td></tr>`;
            return;
        }

        renderTabelHTML(data, tbody);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-red-500 font-bold">Gagal memuat data dari Database.</td></tr>`;
    }
}

function renderTabelHTML(dataArray, tbody) {
    dataArray.forEach((item, index) => {
        const isSelesai = item.status === 'Selesai';
        const delay = index * 0.08; 
        
        const rowHtml = `
            <tr class="animate-fade-in ${isSelesai ? 'hover:bg-slate-50 opacity-60 grayscale-[50%]' : 'hover:bg-blue-50/50 group hover:-translate-y-0.5 hover:shadow-md'} transition-all duration-300" 
                style="animation-delay: ${delay}s; opacity: 0;">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm shrink-0 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
                            <img src="${item.foto_url && item.foto_url.length > 50 ? item.foto_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=1e3a8a&color=fff`}" class="w-full h-full object-cover">
                        </div>
                        <div>
                            <p class="font-bold text-slate-800 text-base ${!isSelesai ? 'group-hover:text-sekolah-navy transition-colors' : ''}">${item.nama}</p>
                            <p class="text-xs text-slate-500 font-mono tracking-wide">ID: VST-${item.id}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="font-bold text-slate-700">${item.tujuan}</p>
                    <div class="flex items-center gap-1 mt-1 text-xs text-slate-500 font-medium">Menemui: ${item.dituju}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2 text-xs font-bold text-slate-600"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> In: ${item.waktu_masuk}</div>
                        <div class="flex items-center gap-2 text-xs font-semibold text-slate-400"><span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Out: ${item.batas_waktu}</div>
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${isSelesai ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-green-50 text-green-700 border border-green-200 shadow-sm group-hover:shadow-md group-hover:bg-green-100'}">
                        ${!isSelesai ? '<span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>' : ''} ${isSelesai ? 'Keluar Selesai' : 'Di Dalam'}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                        ${!isSelesai ? `<button onclick="selesaikanKunjunganDB('${item.id}', this)" class="px-3 py-1.5 bg-white border-2 border-sekolah-navy text-sekolah-navy hover:bg-sekolah-navy hover:text-white font-bold text-xs rounded-lg transition-all hover:shadow-lg active:scale-95 hover:-translate-y-1">Selesaikan</button>` : `<button class="px-3 py-1.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-lg cursor-not-allowed border-2 border-transparent" disabled>Selesai</button>`}
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', rowHtml);
    });
}

async function selesaikanKunjunganDB(id, btnElement) {
    if (!isDbConnected) return alert("Database tidak terhubung.");
    
    const row = btnElement.closest('tr');
    btnElement.innerHTML = "Memproses...";
    
    try {
        const { error } = await _supabase.from('tamu').update({ status: 'Selesai' }).eq('id', id);
        if (error) throw error;
        fetchDataAdmin(); // Muat ulang tabel 
    } catch (error) {
        alert("Gagal memperbarui status.");
        btnElement.innerHTML = "Selesaikan";
    }
}
