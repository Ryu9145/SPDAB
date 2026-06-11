const kabupatenDataset = [
    { name: "Banggai", lat: -1.35, lng: 122.78 },
    { name: "Banggai Kepulauan", lat: -1.40, lng: 123.23 },
    { name: "Banggai Laut", lat: -1.95, lng: 123.50 },
    { name: "Buol", lat: 1.03, lng: 121.37 },
    { name: "Donggala", lat: -0.40, lng: 119.75 },
    { name: "Morowali", lat: -2.48, lng: 121.90 },
    { name: "Morowali Utara", lat: -1.98, lng: 121.33 },
    { name: "Parigi Moutong", lat: -0.47, lng: 120.25 },
    { name: "Poso", lat: -1.40, lng: 120.75 },
    { name: "Sigi", lat: -1.38, lng: 119.96 },
    { name: "Tojo Una-Una", lat: -1.15, lng: 121.60 },
    { name: "Tolitoli", lat: 1.10, lng: 120.80 }
];

let appState = {
    category: 'sungai',
    year: '2026',
    activeKabupaten: 'ALL'
};

const spdabDB = {};
kabupatenDataset.forEach(kab => {
    spdabDB[kab.name] = {};
    ['sungai', 'pantai', 'danau', 'air-baku'].forEach(cat => {
        spdabDB[kab.name][cat] = {};
        ['2023', '2024', '2025', '2026'].forEach(yr => {
            const seedLat = kab.lat + (Math.sin(kab.lat + yr) * 0.04);
            const seedLng = kab.lng + (Math.cos(kab.lng + yr) * 0.04);
            spdabDB[kab.name][cat][yr] = {
                title: `Pekerjaan Konstruksi Fasilitas ${cat.replace('-', ' ').toUpperCase()} — Wilayah ${kab.name}`,
                coords: [seedLat, seedLng],
                volume: `${Math.floor(Math.random() * 3) + 1} Titik Struktur Selesai`,
                catLabel: cat.replace('-', ' '),
                notes: `Data spasial divalidasi oleh tim lapangan CIKASDA Provinsi Sulawesi Tengah untuk Tahun Anggaran ${yr}.`
            };
        });
    });
});

const map = L.map('map', { zoomControl: false }).setView([-1.30, 121.40], 7);
L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: '&copy; Google Maps Infrastructure'
}).addTo(map);

const markerLayerGroup = L.layerGroup().addTo(map);

function updateSpatialMapLayers() {
    markerLayerGroup.clearLayers();
    if (appState.year !== '2026') return;

    kabupatenDataset.forEach(kab => {
        if (appState.activeKabupaten !== 'ALL' && appState.activeKabupaten !== kab.name) return;

        const dataNode = spdabDB[kab.name]?.[appState.category]?.[appState.year];
        if (dataNode) {
            const isHighlighted = appState.activeKabupaten === kab.name;
            const customDivIcon = L.divIcon({
                className: `gis-premium-marker ${isHighlighted ? 'active-pin' : ''}`,
                iconSize: isHighlighted ? [16, 16] : [12, 12],
                iconAnchor: isHighlighted ? [8, 8] : [6, 6]
            });

            const currentMarker = L.marker(dataNode.coords, { icon: customDivIcon }).addTo(markerLayerGroup);
            
            currentMarker.on('click', () => {
                document.getElementById('regionSelectDropdown').value = kab.name;
                appState.activeKabupaten = kab.name;
                updateSpatialMapLayers();
                openFloatingDataSheet(dataNode);
                map.flyTo(dataNode.coords, 10, { animate: true, duration: 0.8 });
            });

            if (isHighlighted) openFloatingDataSheet(dataNode);
        }
    });
}

function buildRegionDropdown() {
    const selectEl = document.getElementById('regionSelectDropdown');
    kabupatenDataset.forEach(kab => {
        const option = document.createElement('option');
        option.value = kab.name;
        option.textContent = `Kabupaten ${kab.name}`;
        selectEl.appendChild(option);
    });
}

document.getElementById('regionSelectDropdown').addEventListener('change', (e) => {
    const value = e.target.value;
    appState.activeKabupaten = value;
    if (value === 'ALL') {
        closeFloatingDataSheet();
        map.flyTo([-1.30, 121.40], 7, { animate: true, duration: 1 });
    } else {
        const findKab = kabupatenDataset.find(k => k.name === value);
        if (findKab) map.flyTo([findKab.lat, findKab.lng], 10, { animate: true, duration: 1 });
    }
    updateSpatialMapLayers();
});

document.querySelectorAll('.segment-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.segment-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.category = btn.getAttribute('data-category');
        closeFloatingDataSheet();
        updateSpatialMapLayers();
    });
});

const modalEl = document.getElementById('requestDataModal');
function triggerOpenModal() { modalEl.classList.add('active'); closeFloatingDataSheet(); }
function triggerCloseModal() { modalEl.classList.remove('active'); }

document.getElementById('closeModalBtn').addEventListener('click', triggerCloseModal);
document.getElementById('cancelModalBtn').addEventListener('click', triggerCloseModal);
document.getElementById('btnNavPermohonan').addEventListener('click', triggerOpenModal);

document.getElementById('yearSelectDropdown').addEventListener('change', (e) => {
    const selectedYr = e.target.value;
    appState.year = selectedYr;
    if (selectedYr !== '2026') {
        triggerOpenModal();
        updateSpatialMapLayers();
    } else {
        triggerCloseModal();
        updateSpatialMapLayers();
    }
});

const dataSheetEl = document.getElementById('gisDetailSheet');
document.getElementById('closeSheetBtn').addEventListener('click', () => {
    closeFloatingDataSheet();
    appState.activeKabupaten = 'ALL';
    document.getElementById('regionSelectDropdown').value = 'ALL';
    updateSpatialMapLayers();
});

function openFloatingDataSheet(data) {
    document.getElementById('sheetCategoryBadge').textContent = data.catLabel;
    document.getElementById('sheetProjectTitle').textContent = data.title;
    document.getElementById('sheetVolumeValue').textContent = data.volume;
    document.getElementById('sheetCoordsValue').textContent = `${data.coords[0].toFixed(5)}, ${data.coords[1].toFixed(5)}`;
    document.getElementById('sheetDescriptionValue').textContent = data.notes;
    dataSheetEl.classList.add('open');
}
function closeFloatingDataSheet() { dataSheetEl.classList.remove('open'); }

buildRegionDropdown();
updateSpatialMapLayers();

// ==========================================================================
// LOGIKA BURGER MENU RESPONSIVE MOBILE
// ==========================================================================
const burgerToggle = document.getElementById('burgerToggle');
const navMenuResponsive = document.getElementById('navMenuResponsive');
const burgerIcon = document.getElementById('burgerIcon');
const navLinks = document.querySelectorAll('.nav-link');

burgerToggle.addEventListener('click', () => {
    navMenuResponsive.classList.toggle('active');
    
    if (navMenuResponsive.classList.contains('active')) {
        burgerIcon.className = 'bx bx-x';
        burgerToggle.style.transform = 'rotate(90deg)';
    } else {
        burgerIcon.className = 'bx bx-menu';
        burgerToggle.style.transform = 'rotate(0deg)';
    }
});


navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenuResponsive.classList.remove('active');
        burgerIcon.className = 'bx bx-menu';
        burgerToggle.style.transform = 'rotate(0deg)';
    });
});

   AOS.init({
       duration: 1000,
       once: true,
       offset: 100,
       easing: 'ease-in-out'
   });