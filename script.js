const kabupatenDataset = [
    { name: "Banggai", lat: 1.35, lng: 122.78 },
    { name: "Banggai Kepulauan", lat: 1.40, lng: 123.23 },
    { name: "Banggai Laut", lat: 1.95, lng: 123.50 },
    { name: "Buol", lat: 1.03, lng: 121.37 },
    { name: "Donggala", lat: -0.40, lng: 119.75 },
    { name: "Morowali", lat: -2.48, lng: 121.90 },
    { name: "Morowali Utara", lat: -1.98, lng: 121.33 },
    { name: "Parigi Moutong", lat: 0.47, lng: 120.25 },
    { name: "Poso", lat: -1.40, lng: 120.75 },
    { name: "Sigi", lat: -1.38, lng: 119.96 },
    { name: "Tojo Una-Una", lat: -1.15, lng: 121.60 },
    { name: "Tolitoli", lat: 1.10, lng: 120.80 }
];

let appState = { category: 'sungai', year: '2026', activeKabupaten: 'ALL' };

const spdabDB = {};
kabupatenDataset.forEach(kab => {
    spdabDB[kab.name] = {};
    ['sungai', 'pantai', 'danau', 'air-baku'].forEach(cat => {
        spdabDB[kab.name][cat] = {};
        ['2024', '2025', '2026'].forEach(yr => {
            spdabDB[kab.name][cat][yr] = {
                title: `Pembangunan/Rehabilitasi ${cat.toUpperCase()} ${kab.name}`,
                coords: [kab.lat + (Math.random() * 0.05), kab.lng + (Math.random() * 0.05)],
                panjang: `${Math.floor(Math.random() * 800) + 200} Meter`,
                catLabel: cat.replace('-', ' ').toUpperCase(),
                informasi: `Data lapangan tervalidasi TA ${yr}. Infrastruktur berfungsi optimal.`
            };
        });
    });
});

const staticMap = L.map('staticMap', { zoomControl: false }).setView([-1.30, 121.40], 7);
L.control.zoom({ position: 'bottomright' }).addTo(staticMap);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
    maxZoom: 19, 
    attribution: '© OpenStreetMap' 
}).addTo(staticMap);
const staticMarkerLayer = L.layerGroup().addTo(staticMap);

const map = L.map('map', { zoomControl: false }).setView([-1.30, 121.40], 7);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20 }).addTo(map);
const markerLayerGroup = L.layerGroup().addTo(map);

AOS.init({ duration: 1000, once: true, offset: 100, easing: 'ease-in-out' });
const heroSwiper = new Swiper('.heroSwiper', {
    loop: true, effect: 'fade', fadeEffect: { crossFade: true }, speed: 1000,
    autoplay: { delay: 6000, disableOnInteraction: false },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
});

const filterModalEl = document.getElementById('filterModal');
let bsFilterModal;
if (filterModalEl) {
    bsFilterModal = new bootstrap.Modal(filterModalEl);
}

function openModal(category) {
    document.getElementById('filterModalLabel').textContent = `Filter Data ${category.replace('-', ' ').toUpperCase()}`;
    
    const regionSelect = document.getElementById('modalRegion');
    if (regionSelect) {
        regionSelect.innerHTML = '<option value="ALL">Semua Kabupaten</option>';
        kabupatenDataset.forEach(kab => {
            const option = document.createElement('option');
            option.value = kab.name;
            option.textContent = kab.name;
            regionSelect.appendChild(option);
        });
    }

    if (bsFilterModal) bsFilterModal.show();
}

function closeModal() {
    if (bsFilterModal) bsFilterModal.hide();
}

function applyFilters() {
    const modalYear = document.getElementById('modalYear');
    const modalRegion = document.getElementById('modalRegion');
    
    if (modalYear) appState.year = modalYear.value;
    if (modalRegion) appState.activeKabupaten = modalRegion.value;
    
    const deskripsiGis = document.getElementById('gisDeskripsiTeks');
    if (deskripsiGis) {
        const lokasiTeks = appState.activeKabupaten === 'ALL' ? 'Provinsi Sulawesi Tengah' : `Kabupaten ${appState.activeKabupaten}`;
        deskripsiGis.innerHTML = `Menampilkan hasil pemetaan <strong>${appState.category.replace('-', ' ').toUpperCase()}</strong> untuk wilayah <strong>${lokasiTeks}</strong> pada Tahun Anggaran <strong>${appState.year}</strong>.`;
    }

    updateSpatialMapLayers();
    
    if (appState.activeKabupaten !== 'ALL') {
        const target = kabupatenDataset.find(k => k.name === appState.activeKabupaten);
        if (target) {
            map.flyTo([target.lat, target.lng], 9, { animate: true, duration: 1.5 });
            staticMap.flyTo([target.lat, target.lng], 9, { animate: true, duration: 1.5 });
        }
    } else {
        map.flyTo([-1.30, 121.40], 7, { animate: true, duration: 1.5 });
        staticMap.flyTo([-1.30, 121.40], 7, { animate: true, duration: 1.5 });
    }
    
    closeModal();
    const mapSection = document.querySelector('#eksplorasi-gis');
    if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('.static-project-card').forEach(card => {
    card.addEventListener('click', (e) => {
        e.preventDefault();
        const labelEl = card.querySelector('h3');
        if (!labelEl) return;
        
        const label = labelEl.textContent;
        const categoryMap = { "Data Sungai": "sungai", "Data Pantai": "pantai", "Data Danau": "danau", "Data Air Baku": "air-baku" };
        
        appState.category = categoryMap[label] || 'sungai';
        openModal(appState.category);
    });
});

const burgerToggle = document.getElementById('burgerToggle');
const navMenuResponsive = document.getElementById('navMenuResponsive');
if (burgerToggle && navMenuResponsive) {
    burgerToggle.addEventListener('click', () => {
        navMenuResponsive.classList.toggle('active');
        const burgerIcon = document.getElementById('burgerIcon');
        if(burgerIcon) {
            burgerIcon.className = navMenuResponsive.classList.contains('active') ? 'bx bx-x' : 'bx bx-menu';
        }
    });
}

function updateSpatialMapLayers() {
    markerLayerGroup.clearLayers();
    staticMarkerLayer.clearLayers();
    
    kabupatenDataset.forEach(kab => {
        if (appState.activeKabupaten !== 'ALL' && appState.activeKabupaten !== kab.name) return;
        
        const dataNode = spdabDB[kab.name]?.[appState.category]?.[appState.year];
        
        if (dataNode) {
            const marker = L.marker(dataNode.coords).addTo(markerLayerGroup);
            marker.on('click', () => openFloatingDataSheet(dataNode));

            L.marker(dataNode.coords).addTo(staticMarkerLayer);
        }
    });
}

const dataSheetEl = document.getElementById('gisDetailSheet');
if (dataSheetEl) {
    const closeBtn = document.getElementById('closeDataSheet');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            dataSheetEl.classList.remove('open');
        });
    }
}

function openFloatingDataSheet(data) {
    if (!dataSheetEl) return;
    
    const titleEl = document.getElementById('sheetTitle');
    const categoryEl = document.getElementById('sheetCategory');
    const coordsEl = document.getElementById('sheetCoordinates');
    const statusEl = document.getElementById('sheetStatus');
    const descEl = document.getElementById('sheetDescription');

    if (titleEl) titleEl.textContent = data.title;
    if (categoryEl) categoryEl.textContent = data.catLabel;
    if (coordsEl) coordsEl.textContent = `${data.coords[0].toFixed(5)}, ${data.coords[1].toFixed(5)}`;
    if (statusEl) statusEl.textContent = `Tervalidasi (${appState.year})`; 
    
    if (descEl) {
        descEl.innerHTML = `<strong>Dimensi/Panjang:</strong> ${data.panjang}<br><br>${data.informasi}`;
    }
    
    dataSheetEl.classList.add('open');
}

function downloadPDF() {
    const element = document.getElementById('pdfExportArea');
    if (!element) return;
    
    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `Laporan_Spasial_${appState.category.toUpperCase()}_${appState.year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save();
}

document.addEventListener("DOMContentLoaded", () => {
    updateSpatialMapLayers();
});

document.addEventListener("DOMContentLoaded", () => {
    const visualCards = document.querySelectorAll('#galeri-progres .horizontal-project-card[data-target]');

    visualCards.forEach(card => {
        card.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            
            if (targetId) {
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    const originalBorder = targetElement.style.border;
                    const originalBoxShadow = targetElement.style.boxShadow;
                    
                    targetElement.style.transition = 'all 0.4s ease';
                    targetElement.style.border = '2px solid #0d6efd';
                    targetElement.style.boxShadow = '0 0 15px rgba(13, 110, 253, 0.4)';
                    
                    setTimeout(() => {
                        targetElement.style.border = originalBorder;
                        targetElement.style.boxShadow = originalBoxShadow;
                    }, 2000);
                }
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const burgerToggle = document.getElementById("burgerToggle");
    const burgerIcon = document.getElementById("burgerIcon");
    const navNavigation = document.querySelector(".nav-navigation");

    if (burgerToggle && navNavigation) {
        burgerToggle.addEventListener("click", () => {
            navNavigation.classList.toggle("active");

            if (navNavigation.classList.contains("active")) {
                burgerIcon.classList.replace("bx-menu", "bx-x");
            } else {
                burgerIcon.classList.replace("bx-x", "bx-menu");
            }
        });

        const navLinks = document.querySelectorAll(".nav-link");
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                navNavigation.classList.remove("active");
                burgerIcon.classList.replace("bx-x", "bx-menu");
            });
        });
    }
});