<template>
    <div class="hazard-map-container">
        <div class="map-controls">
            <button @click="centerOnAbra" class="control-btn">
                <i class="fas fa-crosshairs"></i> Center on Abra
            </button>
            <div class="layer-controls">
                <div class="legend">
                    <h4>Landslide Potential</h4>
                    <div class="legend-item">
                        <span class="color-box high"></span> High
                    </div>
                    <div class="legend-item">
                        <span class="color-box moderate"></span> Moderate
                    </div>
                    <div class="legend-item">
                        <span class="color-box low"></span> Low
                    </div>
                </div>
            </div>
        </div>
        <div id="hazard-map" class="map-view"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';
import { useNotificationStore } from '../stores/notification';

// Abra province precise boundary coordinates
const ABRA_BOUNDS = {
    north: 18.0922,
    south: 17.2142,
    east: 121.2881,
    west: 120.3133
};

// Create a bounds object for Leaflet
const RESTRICTED_BOUNDS = L.latLngBounds(
    [ABRA_BOUNDS.south, ABRA_BOUNDS.west],
    [ABRA_BOUNDS.north, ABRA_BOUNDS.east]
);

// Neighboring provinces
const NEIGHBORS = [
    { name: 'ILOCOS NORTE', coords: [18.0, 120.7] },
    { name: 'APAYAO', coords: [17.9, 121.2] },
    { name: 'KALINGA', coords: [17.5, 121.2] },
    { name: 'MOUNTAIN PROVINCE', coords: [17.2, 120.9] },
    { name: 'ILOCOS SUR', coords: [17.3, 120.4] }
];

const map = ref(null);
const hazardZones = ref([]);
const notificationStore = useNotificationStore();

const initMap = async () => {
    map.value = L.map('hazard-map', {
        maxBounds: RESTRICTED_BOUNDS,
        maxBoundsViscosity: 1.0,
        minZoom: 10,
        maxZoom: 18
    }).fitBounds(RESTRICTED_BOUNDS);

    // Add base map layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        bounds: RESTRICTED_BOUNDS
    }).addTo(map.value);

    // Add neighboring province labels
    NEIGHBORS.forEach(province => {
        L.marker(province.coords, {
            icon: L.divIcon({
                className: 'province-label',
                html: `<div>${province.name}</div>`
            })
        }).addTo(map.value);
    });

    await loadHazardZones();
};

const loadHazardZones = async () => {
    try {
        const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : 'https://disaster-app-backend.onrender.com';
        const response = await axios.get(`${baseUrl}/api/hazard-zones`);
        
        if (response.data.success) {
            hazardZones.value = response.data.zones;
            displayHazardZones();
        }
    } catch (error) {
        console.error('Error loading hazard zones:', error);
        notificationStore.error('Failed to load hazard zones');
    }
};

const displayHazardZones = () => {
    if (!map.value) return;

    hazardZones.value.forEach(zone => {
        const color = zone.risk_level === 'high' ? 'red' : 
                     zone.risk_level === 'moderate' ? 'pink' : 
                     'white';
        
        L.polygon(zone.coordinates, {
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            weight: 2
        })
        .bindPopup(`
            <div class="hazard-popup">
                <h3>${zone.name}</h3>
                <p>${zone.description}</p>
                <p class="risk-level">Risk Level: ${zone.risk_level}</p>
            </div>
        `)
        .addTo(map.value);
    });
};

onMounted(async () => {
    await initMap();
});

onUnmounted(() => {
    if (map.value) {
        map.value.remove();
    }
});
</script>

<style scoped>
.hazard-map-container {
    position: relative;
    width: 100%;
    height: calc(100vh - 80px);
}

.map-view {
    width: 100%;
    height: 100%;
}

.legend {
    background: white;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    margin-top: 10px;
}

.legend h4 {
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: bold;
}

.legend-item {
    display: flex;
    align-items: center;
    margin: 5px 0;
}

.color-box {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    border: 1px solid #666;
}

.color-box.high {
    background-color: rgba(255, 0, 0, 0.7);
}

.color-box.moderate {
    background-color: rgba(255, 192, 203, 0.7);
}

.color-box.low {
    background-color: rgba(255, 255, 255, 0.7);
}

:deep(.province-label) {
    background: none;
    border: none;
    color: #2c3e50;
    font-weight: bold;
    font-size: 12px;
    text-shadow: 1px 1px 2px white;
    white-space: nowrap;
}

.map-controls {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 1000;
}

.control-btn {
    background: white;
    border: none;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
}

.hazard-popup {
    padding: 10px;
}

.hazard-popup h3 {
    margin: 0 0 8px;
    color: #2c3e50;
}

.hazard-popup p {
    margin: 5px 0;
    color: #666;
}

.risk-level {
    font-weight: bold;
    text-transform: capitalize;
}
</style>
