<template>
    <div class="hazard-map-container">
        <div class="map-controls">
            <button @click="addMarker" class="control-btn">
                <i class="fas fa-map-marker-alt"></i> Add Marker
            </button>
            <button @click="addEvacZone" class="control-btn">
                <i class="fas fa-circle"></i> Add Evacuation Zone
            </button>
            <button @click="centerOnUser" class="control-btn">
                <i class="fas fa-crosshairs"></i> Find Me
            </button>
        </div>
        <div id="hazard-map" class="map-view"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const map = ref(null);
const userMarker = ref(null);
const accuracyCircle = ref(null);
const isAddingMarker = ref(false);
const isAddingZone = ref(false);
const markers = ref([]);
const evacuationZones = ref([]);
const authStore = useAuthStore();

// Add these constants at the top of your script
const GEOLOCATION_OPTIONS = {
    enableHighAccuracy: true,    // Request highest accuracy
    timeout: 10000,             // 10 second timeout
    maximumAge: 0               // Force fresh location data
};

// Initialize map with basic functionality
const initMap = async () => {
    try {
        const position = await getCurrentPosition().catch(() => ({ coords: { latitude: 17.5907, longitude: 120.6856 } })); // Default to Bangued, Abra
        const { latitude, longitude } = position.coords;
        
        map.value = L.map('hazard-map', {
            scrollWheelZoom: true,
            dragging: true,
            maxBounds: [[-90, -180], [90, 180]],
            minZoom: 2,
            maxZoom: 19,
            zoomControl: true
        }).setView([latitude, longitude], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map.value);

        // Add click handler for the map
        map.value.on('click', handleMapClick);

        // Initialize user location marker
        initializeUserMarker(position);
    } catch (error) {
        console.error('Map initialization error:', error);
    }
};

const initializeUserMarker = (position) => {
    const { latitude, longitude } = position.coords;
    
    userMarker.value = L.marker([latitude, longitude], {
        icon: L.divIcon({
            className: 'user-location-marker',
            html: '<div class="location-dot"></div>'
        })
    }).addTo(map.value);
};

const addMarker = () => {
    isAddingMarker.value = true;
    isAddingZone.value = false;
    map.value.getContainer().style.cursor = 'crosshair';
};

const addEvacZone = () => {
    isAddingZone.value = true;
    isAddingMarker.value = false;
    map.value.getContainer().style.cursor = 'crosshair';
};

const handleMapClick = (e) => {
    if (isAddingMarker.value) {
        createMarker(e.latlng);
        isAddingMarker.value = false;
        map.value.getContainer().style.cursor = '';
    } else if (isAddingZone.value) {
        createEvacZone(e.latlng);
        isAddingZone.value = false;
        map.value.getContainer().style.cursor = '';
    }
};

const calculateDistance = (point1, point2) => {
    return map.value.distance(point1, point2);
};

const calculateTime = (distanceInMeters) => {
    const walkingSpeedMPS = 1.4; // Average walking speed 5 km/h = 1.4 m/s
    const seconds = distanceInMeters / walkingSpeedMPS;
    const minutes = Math.round(seconds / 60);
    return minutes;
};

const loadMarkers = async () => {
    try {
        const token = authStore.token;
        const response = await axios.get(`${API_URL}/api/markers`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.data.success) {
            response.data.markers.forEach(markerData => {
                createMarkerFromData(markerData);
            });
        }
    } catch (error) {
        console.error('Error loading markers:', error);
    }
};

const createMarkerFromData = (markerData) => {
    const marker = L.marker([markerData.latitude, markerData.longitude]).addTo(map.value);
    let routingControl = null;
    
    marker.on('click', () => {
        if (userMarker.value) {
            const userLatLng = userMarker.value.getLatLng();
            const markerLatLng = marker.getLatLng();
            
            const distance = calculateDistance(userLatLng, markerLatLng);
            const timeToWalk = calculateTime(distance);
            
            const popupContent = document.createElement('div');
            popupContent.className = 'custom-popup';
            popupContent.innerHTML = `
                <h3>${markerData.title}</h3>
                ${markerData.description ? `<p>${markerData.description}</p>` : ''}
                <div class="distance-info">
                    <p><i class="fas fa-route"></i> Distance: ${Math.round(distance)} meters</p>
                    <p><i class="fas fa-walking"></i> Est. time: ${timeToWalk} minutes</p>
                </div>
            `;
            
            // Add route button
            const routeButton = document.createElement('button');
            routeButton.className = 'route-btn';
            routeButton.textContent = 'Show Route';
            routeButton.onclick = () => {
                if (routingControl) {
                    map.value.removeControl(routingControl);
                    routingControl = null;
                    routeButton.textContent = 'Show Route';
                } else {
                    routingControl = L.Routing.control({
                        waypoints: [
                            L.latLng(userLatLng.lat, userLatLng.lng),
                            L.latLng(markerLatLng.lat, markerLatLng.lng)
                        ],
                        router: L.Routing.osrmv1({
                            serviceUrl: 'https://router.project-osrm.org/route/v1'
                        }),
                        lineOptions: {
                            styles: [{ color: '#00D1D1', weight: 4 }]
                        },
                        addWaypoints: false,
                        draggableWaypoints: false,
                        fitSelectedRoutes: true,
                        showAlternatives: false
                    }).addTo(map.value);
                    routeButton.textContent = 'Hide Route';
                }
            };
            popupContent.appendChild(routeButton);
            
            // Add remove button if user created the marker
            if (authStore.user?.id === markerData.created_by) {
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove Marker';
                removeButton.onclick = async () => {
                    try {
                        const token = authStore.token;
                        await axios.delete(`${API_URL}/api/markers/${markerData.id}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (routingControl) {
                            map.value.removeControl(routingControl);
                        }
                        map.value.removeLayer(marker);
                        markers.value = markers.value.filter(m => m !== marker);
                    } catch (error) {
                        console.error('Error removing marker:', error);
                        alert('Failed to remove marker');
                    }
                };
                popupContent.appendChild(removeButton);
            }
            
            marker.bindPopup(popupContent).openPopup();
        }
    });
    
    markers.value.push(marker);
};

const createMarker = async (latlng) => {
    if (!authStore.isAuthenticated) {
        alert('Please login to add markers');
        return;
    }

    const title = prompt('Enter marker title:');
    const description = prompt('Enter marker description:');
    
    if (title) {
        try {
            const token = authStore.token;
            const response = await axios.post(
                `${API_URL}/api/markers`,
                {
                    title,
                    description,
                    latitude: latlng.lat,
                    longitude: latlng.lng
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.success) {
                createMarkerFromData(response.data.marker);
            }
        } catch (error) {
            console.error('Error saving marker:', error);
            if (error.response?.status === 401) {
                alert('Please login to add markers');
            } else {
                alert('Failed to save marker. Please try again.');
            }
        }
    }
};

const createEvacZone = (latlng) => {
    const radius = prompt('Enter evacuation zone radius (in meters):', '500');
    const description = prompt('Enter zone description:');
    
    if (radius) {
        const zone = L.circle(latlng, {
            radius: parseInt(radius),
            color: '#ff4444',
            fillColor: '#ff444433',
            fillOpacity: 0.3,
            weight: 2
        }).addTo(map.value);
        
        const popupContent = document.createElement('div');
        popupContent.className = 'custom-popup';
        popupContent.innerHTML = `
            <h3>Evacuation Zone</h3>
            <p>Radius: ${radius}m</p>
            ${description ? `<p>${description}</p>` : ''}
        `;
        
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove Zone';
        removeButton.onclick = () => {
            map.value.removeLayer(zone);
            evacuationZones.value = evacuationZones.value.filter(z => z !== zone);
        };
        
        popupContent.appendChild(removeButton);
        zone.bindPopup(popupContent);
        evacuationZones.value.push(zone);
    }
};

const centerOnUser = async () => {
    try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        if (map.value) {
            map.value.setView([latitude, longitude], 16);
            updateUserLocation(position);
        }
    } catch (error) {
        console.error('Error centering on user:', error);
        // You might want to show a notification to the user here
    }
};

const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Log position details for debugging
                console.log('Position acquired:', {
                    accuracy: position.coords.accuracy,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: new Date(position.timestamp).toISOString()
                });

                // Only accept positions with good accuracy
                if (position.coords.accuracy > 100) { // 100 meters threshold
                    reject(new Error('Location accuracy too low'));
                    return;
                }

                resolve(position);
            },
            (error) => {
                console.error('Geolocation error:', {
                    code: error.code,
                    message: error.message
                });
                reject(error);
            },
            GEOLOCATION_OPTIONS
        );
    });
};

const updateUserLocation = (position) => {
    const { latitude, longitude, accuracy } = position.coords;
    
    if (map.value && userMarker.value) {
        const newLatLng = [latitude, longitude];
        
        // Update marker and accuracy circle
        userMarker.value.setLatLng(newLatLng);
        
        // Create accuracy circle if it doesn't exist
        if (!accuracyCircle.value) {
            accuracyCircle.value = L.circle(newLatLng, {
                radius: accuracy,
                color: '#42b983',
                fillColor: '#42b98333',
                fillOpacity: 0.3,
                weight: 2
            }).addTo(map.value);
        } else {
            accuracyCircle.value.setLatLng(newLatLng);
            accuracyCircle.value.setRadius(accuracy);
        }

        // Only center map for high-accuracy updates
        if (accuracy <= 50) { // 50 meters threshold for centering
            map.value.setView(newLatLng, 16);
        }
    }
};

const startLocationTracking = () => {
    if (!navigator.geolocation) return null;

    return navigator.geolocation.watchPosition(
        (position) => {
            // Only update if accuracy is good
            if (position.coords.accuracy <= 100) {
                updateUserLocation(position);
            } else {
                console.warn('Skipping low accuracy position update:', position.coords.accuracy);
            }
        },
        (error) => {
            console.error('Location tracking error:', {
                code: error.code,
                message: error.message
            });
        },
        GEOLOCATION_OPTIONS
    );
};

let locationWatchId = null;

onMounted(() => {
    console.log('Auth status:', authStore.isAuthenticated, 'Token:', authStore.token);
    initMap();
    locationWatchId = startLocationTracking();
    loadMarkers();
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

.map-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
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
    transition: all 0.3s ease;
}

.control-btn:hover {
    background: #f0f0f0;
    transform: translateY(-2px);
}

.map-view {
    width: 100%;
    height: 100%;
}

:deep(.user-location-marker) {
    display: flex;
    justify-content: center;
    align-items: center;
}

:deep(.location-dot) {
    width: 12px;
    height: 12px;
    background-color: #42b983;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 0 0 2px #42b983;
}

:deep(.custom-popup) {
    text-align: center;
}

:deep(.custom-popup button) {
    background: #ff4444;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
}

:deep(.custom-popup button:hover) {
    background: #ff2222;
}

:deep(.distance-info) {
    margin: 10px 0;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 4px;
}

:deep(.distance-info p) {
    margin: 4px 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

:deep(.distance-info i) {
    color: #42b983;
}

:deep(.route-btn) {
    background: #00D1D1;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    margin: 10px 0;
    width: 100%;
}

:deep(.route-btn:hover) {
    background: #00ADAD;
}

:deep(.leaflet-routing-container) {
    background-color: white;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    max-height: 300px;
    overflow-y: auto;
}
</style> 