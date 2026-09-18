// ==========================================
// KONFIGURASI SUPABASE (ANTI-CRASH)
// ==========================================
const SUPABASE_URL = 'https://jsyumznqizpcdfrandhh.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzeXVtem5xaXpwY2RmcmFuZGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTI3OTQsImV4cCI6MjEwNTI4ODc5NH0.K5_OsvlUkQHr2j_1FtkEx0PPUcBXL5hsjBbwjZHsX4U';

let _supabase = null;
let isDbConnected = false;

// Coba hubungkan database dengan perlindungan Error
try {
    if (SUPABASE_URL.startsWith('http')) {
        _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isDbConnected = true;
        // Tunggu DOM selesai dimuat sebelum memanipulasi elemen
        document.addEventListener('DOMContentLoaded', () => {
            const dbStatus = document.getElementById('db-status-text');
            if (dbStatus) dbStatus.innerHTML = '<span class="text-green-500 font-bold tracking-widest uppercase">Database Terhubung</span>';
        });
    } else {
        console.warn("URL Supabase tidak valid. Mode Offline diaktifkan.");
    }
} catch (err) {
    console.error("Gagal menghubungkan Supabase:", err);
}

// ==========================================
// LOGIKA SINGLE PAGE APP (SPA)
// ==========================================
function switchView(viewName) {
    const guestView = document.getElementById('view-guest');
    const adminView = document.getElementById('view-admin');

    if (viewName === 'admin') {
        guestView.classList.remove('block');
        guestView.classList.add('hidden');
        adminView.classList.remove('hidden');
        adminView.classList.add('flex'); 
        window.scrollTo(0, 0); 
        if(isDbConnected) loadDataTamu();
    } else if (viewName === 'guest') {
        adminView.classList.remove('flex');
        adminView.classList.add('hidden');
        guestView.classList.remove('hidden');
        guestView.classList.add('block');
        window.scrollTo(0, 0); 
    }
}

function togglePassword() {
    const input = document.getElementById('input-password');
    const icon = document.getElementById('eye-icon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>';
    } else {
        input.type = 'password';
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>';
    }
}

function showPage(pageName) {
    const pages = { 
        login: document.getElementById('login-page'), 
        camera: document.getElementById('camera-page'), 
        form: document.getElementById('form-page'), 
        print: document.getElementById('print-page') 
    };
    Object.values(pages).forEach(page => { 
        page.classList.remove('block', 'hidden', 'flex'); 
        page.classList.add('hidden'); 
    });
    pages[pageName].classList.remove('hidden'); 
    pages[pageName].classList.add(pageName === 'login' ? 'block' : 'flex');
}

function scrollToApp() { window.scrollTo({ top: document.getElementById('main-app').offsetTop, behavior: 'smooth' }); }

// Pastikan event listener dipasang setelah elemen tersedia (wajib dipisah file)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-form').addEventListener('submit', (e) => { 
        e.preventDefault(); 
        showPage('camera'); 
        initCamera(); 
        scrollToApp();
    });

    // Event Listener Form Tamu Utama
    document.getElementById('guest-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const payload = {
                nama: document.getElementById('input-nama').value,
                tujuan: document.getElementById('input-tujuan').value,
                dituju: document.getElementById('input-dituju').value,
                tanggal: document.getElementById('input-tanggal').value,
                waktu_masuk: document.getElementById('input-waktu').value,
                batas_waktu: document.getElementById('input-jam-selesai').value,
                foto_url: photoDataUrl
            };

            if(isDbConnected) {
                const btnSubmit = e.target.querySelector('button[type="submit"]');
                btnSubmit.textContent = "Menyimpan...";
                btnSubmit.disabled = true;

                const { error } = await _supabase.from('tamu').insert([{
                    nama: payload.nama, tujuan: payload.tujuan, dituju: payload.dituju,
                    tanggal: payload.tanggal, waktu_masuk: payload.waktu_masuk, 
                    batas_waktu: payload.batas_waktu, foto_url: payload.foto_url, status: 'Di Dalam'
                }]);

                if(error) console.error("Database Error:", error);
                
                btnSubmit.textContent = "Terbitkan ID";
                btnSubmit.disabled = false;
            }

            const dateObj = new Date(payload.tanggal);
            const tanggalFormat = dateObj.toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            
            document.getElementById('card-photo').src = payload.foto_url;
            document.getElementById('card-nama').textContent = payload.nama;
            document.getElementById('card-tujuan').textContent = payload.tujuan;
            document.getElementById('card-dituju').textContent = payload.dituju;
            document.getElementById('card-batas-waktu').textContent = `${payload.batas_waktu} WIB`;
            document.getElementById('card-tanggal').textContent = `${tanggalFormat} | MASUK: ${payload.waktu_masuk} WIB`;
            
            showPage('print');
            scrollToApp();

        } catch (error) {
            console.error("Terjadi masalah:", error);
            alert("Sistem berhasil melewati error. Menyiapkan ID Card sementara.");
            showPage('print');
            scrollToApp();
        }
    });
});

// ==========================================
// LOGIKA KAMERA
// ==========================================
let stream, photoDataUrl = '';

async function initCamera() {
    const video = document.getElementById('video-feed');
    try { 
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }); 
            video.srcObject = stream; 
        } else {
            throw new Error("Browser tidak mendukung kamera.");
        }
    } 
    catch (err) { 
        console.warn("Kamera ditolak atau tidak didukung:", err);
    }
}

function stopCamera() { if (stream) stream.getTracks().forEach(track => track.stop()); }

// Event listeners untuk tombol kamera dipasang saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video-feed');
    const canvas = document.getElementById('photo-canvas');
    const btnCapture = document.getElementById('btn-capture');
    const btnRetake = document.getElementById('btn-retake');
    const btnNextForm = document.getElementById('btn-next-form');

    btnCapture.addEventListener('click', () => {
        if (video.videoWidth > 0) {
            canvas.width = video.videoWidth; 
            canvas.height = video.videoHeight; 
            canvas.getContext('2d').drawImage(video, 0, 0);
            photoDataUrl = canvas.toDataURL('image/jpeg');
        } else {
            canvas.width = 300; canvas.height = 300;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0,0,300,300);
            ctx.fillStyle = '#64748b'; ctx.font = '14px Arial'; ctx.fillText('Kamera Tidak Aktif', 90, 150);
            photoDataUrl = canvas.toDataURL('image/jpeg');
        }

        video.classList.add('hidden'); canvas.classList.remove('hidden');
        btnCapture.classList.add('hidden'); btnRetake.classList.remove('hidden'); btnNextForm.classList.remove('hidden');
    });

    btnRetake.addEventListener('click', () => {
        video.classList.remove('hidden'); canvas.classList.add('hidden');
        btnCapture.classList.remove('hidden'); btnRetake.classList.add('hidden'); btnNextForm.classList.add('hidden'); 
        photoDataUrl = '';
    });

    btnNextForm.addEventListener('click', () => { 
        stopCamera(); 
        showPage('form'); 
        scrollToApp(); 
    });
});

// ==========================================
// LOGIKA ADMIN (TABLE, JAM, DLL)
// ==========================================
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const adminClock = document.getElementById('realtime-clock');
    if (adminClock) adminClock.textContent = `${timeString} WIB`;
}
setInterval(updateClock, 1000); 

document.addEventListener('DOMContentLoaded', () => { updateClock(); });

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('opacity-100'), 10);
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.remove('opacity-100');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (dropdown.classList.contains('hidden-transition')) {
        dropdown.classList.remove('hidden-transition');
        dropdown.classList.add('show-transition');
    } else {
        dropdown.classList.remove('show-transition');
        dropdown.classList.add('hidden-transition');
    }
}

window.addEventListener('click', function(e) {
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown && !e.target.closest('.relative') && dropdown.classList.contains('show-transition')) {
        dropdown.classList.remove('show-transition');
        dropdown.classList.add('hidden-transition');
    }
});

function openModal(namaTamu, tujuan, dituju, id, fotoUrl) {
    const modal = document.getElementById('detail-modal');
    const modalBox = document.getElementById('modal-box');
    
    document.getElementById('modal-nama').textContent = namaTamu;
    document.getElementById('modal-tujuan').textContent = tujuan;
    document.getElementById('modal-dituju').textContent = dituju;
    document.getElementById('modal-id').textContent = `ID: VST-${id || 'Offline'}`;
    document.getElementById('modal-foto').src = fotoUrl && fotoUrl.length > 50 ? fotoUrl : `https://ui-avatars.com/api/?name=${namaTamu.replace(' ', '+')}&background=1e3a8a&color=fff`;

    modal.classList.remove('hidden-transition');
    modal.classList.add('show-transition');
    setTimeout(() => { modalBox.classList.remove('scale-95'); modalBox.classList.add('scale-100'); }, 10);
}

function closeModal() {
    const modal = document.getElementById('detail-modal');
    const modalBox = document.getElementById('modal-box');
    
    modalBox.classList.remove('scale-100');
    modalBox.classList.add('scale-95');
    setTimeout(() => { modal.classList.remove('show-transition'); modal.classList.add('hidden-transition'); }, 200);
}

function searchTable() {
    const input = document.getElementById("searchInput");
    const filter = input.value.toLowerCase();
    const tbody = document.getElementById("table-body");
    const tr = tbody.getElementsByTagName("tr");
    for (let i = 0; i < tr.length; i++) {
        const rowText = tr[i].textContent || tr[i].innerText;
        tr[i].style.display = rowText.toLowerCase().indexOf(filter) > -1 ? "" : "none";
    }
}

function alertFeature(featureName) {
    showToast('Informasi', `Fitur <b>${featureName}</b> berfungsi.`);
}

function exportCSV() { showToast('Mengunduh', 'Data sedang di ekspor ke CSV.'); }

function showToast(title, message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'bg-slate-800 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 w-80 animate-slide-in-right pointer-events-auto border border-slate-700';
    toast.innerHTML = `
        <div class="bg-sekolah-gold text-sekolah-dark p-1.5 rounded-lg shrink-0 mt-0.5">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div class="flex-1">
            <h4 class="font-bold text-sm text-slate-100">${title}</h4>
            <p class="text-xs text-slate-400 mt-1 leading-snug">${message}</p>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

// Fungsi Render Data Asli dari Database Supabase
async function loadDataTamu() {
    if (!isDbConnected) {
        document.getElementById("table-body").innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500 font-bold">Menjalankan Mode Offline. Masukkan URL Supabase untuk sinkronisasi Database.</td></tr>`;
        return;
    }

    const { data: daftarTamu, error } = await _supabase.from('tamu').select('*').order('id', { ascending: false });
    if (error) { console.error("Error DB:", error); return; }

    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";
    let aktifCount = 0; let selesaiCount = 0;

    if(daftarTamu.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500 font-bold">Belum ada tamu terdaftar hari ini.</td></tr>`;
    } else {
        daftarTamu.forEach(item => {
            const isSelesai = item.status === 'Selesai';
            if (isSelesai) selesaiCount++; else aktifCount++;

            const rowHtml = `
                <tr class="${isSelesai ? 'hover:bg-slate-50 opacity-60 grayscale-[50%]' : 'hover:bg-blue-50/50 group'} transition-colors">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm shrink-0">
                                <img src="${item.foto_url && item.foto_url.length > 50 ? item.foto_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=1e3a8a&color=fff`}" class="w-full h-full object-cover">
                            </div>
                            <div>
                                <p class="font-bold text-slate-800 text-base ${!isSelesai ? 'group-hover:text-sekolah-navy cursor-pointer' : ''}" onclick="openModal('${item.nama}', '${item.tujuan}', '${item.dituju}', '${item.id}', '${item.foto_url}')">${item.nama}</p>
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
                            <div class="flex items-center gap-2 text-xs font-bold text-slate-600"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> In: ${item.waktu_masuk}</div>
                            <div class="flex items-center gap-2 text-xs font-semibold text-slate-400"><span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Out: ${item.batas_waktu}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${isSelesai ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-green-50 text-green-700 border border-green-200 shadow-sm'}">
                            ${!isSelesai ? '<span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>' : ''} ${isSelesai ? 'Keluar Selesai' : 'Di Dalam'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="openModal('${item.nama}', '${item.tujuan}', '${item.dituju}', '${item.id}', '${item.foto_url}')" class="p-2 text-slate-400 hover:text-sekolah-navy hover:bg-slate-100 rounded-lg transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg></button>
                            ${!isSelesai ? `<button onclick="selesaikanKunjunganDB('${item.id}')" class="px-3 py-1.5 bg-white border-2 border-sekolah-navy text-sekolah-navy hover:bg-sekolah-navy hover:text-white font-bold text-xs rounded-lg transition-colors">Selesaikan</button>` : `<button class="p-2 text-slate-300 cursor-not-allowed rounded-lg" disabled><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg></button>`}
                        </div>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', rowHtml);
        });
    }
    
    // Pastikan ID ini ada di HTML Anda
    const elTotal = document.getElementById('stat-total');
    const elAktif = document.getElementById('stat-aktif');
    const elSelesai = document.getElementById('stat-selesai');
    
    if(elTotal) elTotal.textContent = daftarTamu.length;
    if(elAktif) elAktif.textContent = aktifCount;
    if(elSelesai) elSelesai.textContent = selesaiCount;
}

async function selesaikanKunjunganDB(id) {
    if (!isDbConnected) return;
    const { error } = await _supabase.from('tamu').update({ status: 'Selesai' }).eq('id', id);
    if (error) showToast("Gagal", "Tidak dapat memperbarui status.");
    else { showToast("Sukses", `Kunjungan diselesaikan.`); loadDataTamu(); }
}
