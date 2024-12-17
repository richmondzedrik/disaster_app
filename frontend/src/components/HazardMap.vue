<template>
    <div class="hazard-map-container">
        <div id="hazard-map" class="map-view"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const map = ref(null);
const userMarker = ref(null);
const accuracyCircle = ref(null);

// Initialize map with basic functionality
const initMap = async () => {
    if ('geolocation' in navigator) {
        try {
            const position = await getCurrentPosition();
            const { latitude, longitude, accuracy } = position.coords;
            
            map.value = L.map('hazard-map', {
                scrollWheelZoom: true,
                dragging: true,
                maxBounds: [
                    [-90, -180],
                    [90, 180]
                ],
                minZoom: 2,
                maxZoom: 19,
                zoomControl: true,
                tap: false,
                preferCanvas: true,
                wheelDebounceTime: 150,
                wheelPxPerZoomLevel: 120
            }).setView([latitude, longitude], 16);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
                maxNativeZoom: 18,
                tileSize: 256,
                zoomOffset: 0,
                minZoom: 2,
                subdomains: 'abc'
            }).addTo(map.value);

            // Create user marker
            userMarker.value = L.marker([latitude, longitude], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: '<i class="fas fa-user-circle"></i>'
                })
            }).addTo(map.value);

            // Create accuracy circle
            accuracyCircle.value = L.circle([latitude, longitude], {
                radius: accuracy,
                color: '#42b983',
                fillColor: '#42b98333',
                fillOpacity: 0.3,
                weight: 2
            }).addTo(map.value);

        } catch (error) {
            console.error('Error getting location:', error);
            initializeDefaultMap();
        }
    } else {
        initializeDefaultMap();
    }
};

const initializeDefaultMap = () => {
    map.value = L.map('hazard-map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        maxNativeZoom: 18,
        tileSize: 256,
        zoomOffset: 0,
        minZoom: 2,
        subdomains: 'abc'
    }).addTo(map.value);
};

const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        const options = {
            enableHighAccuracy: true,  // Force high accuracy
            timeout: 20000,            // 20 second timeout
            maximumAge: 0              // Disable caching
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Log full coordinates object
                console.log('Position details:', {
                    accuracy: position.coords.accuracy,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: position.timestamp
                });
                resolve(position);
            },
            (error) => {
                console.error('Geolocation error:', error.code, error.message);
                reject(error);
            },
            options
        );
    });
};

const updateUserLocation = (position) => {
    const { latitude, longitude, accuracy } = position.coords;
    
    if (map.value && userMarker.value && accuracyCircle.value) {
        const newLatLng = [latitude, longitude];
        
        // Log accuracy changes
        console.log('Updating location - Accuracy:', accuracy, 'meters');
        
        userMarker.value.setLatLng(newLatLng);
        accuracyCircle.value.setLatLng(newLatLng);
        accuracyCircle.value.setRadius(accuracy);
        
        // Only center map if accuracy is good
        if (accuracy <= 50) { // Tightened accuracy threshold
            console.log('High accuracy position achieved - centering map');
            map.value.setView(newLatLng, 16);
        }
    }
};

const startLocationTracking = () => {
    if (!navigator.geolocation) return null;

    const options = {
        enableHighAccuracy: true,  // Force high accuracy
        timeout: 20000,            // 20 second timeout
        maximumAge: 0              // Disable caching
    };

    return navigator.geolocation.watchPosition(
        (position) => {
            // Log full coordinates object for tracking updates
            console.log('Location update:', {
                accuracy: position.coords.accuracy,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: position.timestamp
            });
            updateUserLocation(position);
        },
        (error) => {
            console.error('Location tracking error:', error.code, error.message);
        },
        options
    );
};

let locationWatchId = null;

onMounted(() => {
    initMap();
    locationWatchId = startLocationTracking();
});

onUnmounted(() => {
    if (map.value) {
        map.value.remove();
    }
    if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
    }
});
</script>

<style scoped>
.hazard-map-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
}

.map-view {
    width: 100%;
    height: 100%;
    touch-action: none;
}

:deep(.user-location-marker) {
    color: #42b983;
    font-size: 24px;
    text-align: center;
    line-height: 24px;
    margin-left: -12px;
    margin-top: -12px;
}
</style> 