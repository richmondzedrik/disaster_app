<template>
    <div class="evacuation-route-container">
        <div class="map-controls">
            <button @click="addMarker" class="control-btn">
                <i class="fas fa-map-marker-alt"></i> Add Evacuation Point
            </button>
            <button @click="centerOnUser" class="control-btn">
                <i class="fas fa-crosshairs"></i> Find Me
            </button>
        </div>
        <div id="evacuation-map" class="map-view"></div>
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
import { useNotificationStore } from '../stores/notification';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

const API_URL = import.meta.env.VITE_API_URL || 'https://disaster-app-backend.onrender.com';

const map = ref(null);
const userMarker = ref(null);
const accuracyCircle = ref(null);
const isAddingMarker = ref(false);
const markers = ref([]);
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const currentOpenMarker = ref(null);
const pageSize = 10;
const currentPage = ref(1);
const totalMarkers = ref(0);
const activeWatchers = ref(new Set());
const markerClusterGroup = ref(null);

// Add these constants at the top of your script
const GEOLOCATION_OPTIONS = {
    enableHighAccuracy: true,    // Request highest accuracy
    timeout: 10000,             // 10 second timeout
    maximumAge: 0               // Force fresh location data
};

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

// Initialize map with basic functionality
const initMap = async () => {
    try {
        const position = await getCurrentPosition().catch(() => ({ coords: { latitude: 17.5907, longitude: 120.6856 } })); // Default to Bangued, Abra
        const { latitude, longitude } = position.coords;

        map.value = L.map('evacuation-map', {
            scrollWheelZoom: true,
            dragging: true,
            maxBounds: [[-90, -180], [90, 180]],
            minZoom: 2,
            maxZoom: 19,
            zoomControl: true,
            tap: false,
            touchZoom: false,
            doubleClickZoom: false,
            bounceAtZoomLimits: false
        }).setView([latitude, longitude], 13);

        // Disable touch gestures
        map.value.touchZoom.disable();
        map.value.doubleClickZoom.disable();
        map.value.boxZoom.disable();

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map.value);

        // Add click handler for the map
        map.value.on('click', handleMapClick);

        // Initialize user location marker
        initializeUserMarker(position);

        // Add zoom end handler
        map.value.on('zoomend', updateRouteOnZoom);

        // Add zoom handlers with debounce
        let zoomTimeout;
        map.value.on('zoomend', () => {
            if (zoomTimeout) {
                clearTimeout(zoomTimeout);
            }
            zoomTimeout = setTimeout(() => {
                if (map.value) {
                    // Only update popup positions and routes, not marker positions
                    updatePopupPosition();
                    if (currentOpenMarker.value?.isRouteVisible) {
                        updateRouteOnZoom();
                    }
                }
            }, 100); // 100ms debounce
        });
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
    map.value.getContainer().style.cursor = 'crosshair';
};

const handleMapClick = (e) => {
    if (isAddingMarker.value) {
        createMarker(e.latlng);
        isAddingMarker.value = false;
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
    console.log('Starting marker load process...');

    if (!map.value) {
        console.warn('Map not initialized yet, waiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!map.value) {
            console.error('Map failed to initialize');
            return;
        }
    }

    try {
        const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : 'https://disaster-app-backend.onrender.com';
        const offset = (currentPage.value - 1) * pageSize;
        
        console.log('Fetching markers from:', `${baseUrl}/api/markers?limit=${pageSize}&offset=${offset}`);

        const response = await axios.get(`${baseUrl}/api/markers`, {
            params: {
                limit: pageSize,
                offset: offset
            }
        });

        if (response.data.success && Array.isArray(response.data.markers)) {
            // Remove existing markers properly
            markers.value.forEach(marker => {
                if (map.value && map.value.hasLayer(marker)) {
                    map.value.removeLayer(marker);
                }
            });
            markers.value = [];

            // Create new markers with fixed positions
            response.data.markers.forEach(markerData => {
                createMarkerFromData(markerData);
            });
            
            totalMarkers.value = response.data.total;
        }
    } catch (error) {
        console.error('Error loading markers:', error);
    }
};

const createMarkerFromData = (markerData) => {
    // Create marker with fixed coordinates
    const marker = L.marker([markerData.latitude, markerData.longitude], {
        draggable: false,
        autoPan: false,
        riseOnHover: false,
        bubblingMouseEvents: false
    }).addTo(map.value);
    let routingControl = null;
    let routeLayer = null;
    let isRouteVisible = false;

    marker.on('click', () => {
        // Close previously open popup and clean up its routing
        if (currentOpenMarker.value && currentOpenMarker.value !== marker) {
            currentOpenMarker.value.closePopup();
            cleanupPreviousMarkerRoute(currentOpenMarker.value);
        }

        currentOpenMarker.value = marker;

        if (userMarker.value) {
            const userLatLng = userMarker.value.getLatLng();
            const markerLatLng = marker.getLatLng();
            
            const distance = calculateDistance(userLatLng, markerLatLng);
            const timeToWalk = calculateTime(distance);
            
            const popupContent = document.createElement('div');
            popupContent.className = 'custom-popup';

            // Format creation date
            const createdAt = markerData.created_at ? new Date(markerData.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Unknown';

            popupContent.innerHTML = `
                <div class="popup-header">
                    <h3>${markerData.title}</h3>
                    <div class="popup-meta">
                        <span class="meta-item">
                            <i class="fas fa-clock"></i> ${createdAt}
                        </span>
                        ${markerData.created_by ? `
                            <span class="meta-item">
                                <i class="fas fa-user"></i> ${markerData.created_by}
                            </span>
                        ` : ''}
                    </div>
                </div>
                ${markerData.description ? `
                    <div class="popup-description">
                        <p>${markerData.description}</p>
                    </div>
                ` : ''}
                <div class="distance-info">
                    <p><i class="fas fa-route"></i> Distance: ${Math.round(distance)} meters</p>
                    <p><i class="fas fa-walking"></i> Est. time: ${timeToWalk} minutes</p>
                </div>
            `;

            if (authStore.user?.role === 'admin') {
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-marker-btn';
                deleteButton.innerHTML = '<i class="fas fa-trash"></i> Remove Marker';
                
                deleteButton.onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this marker?')) {
                        try {
                            const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : 'https://disaster-app-backend.onrender.com';
                            const token = authStore.token || localStorage.getItem('token');
                            
                            if (!token) {
                                notificationStore.error('Please login again to perform this action');
                                authStore.logout();
                                return;
                            }

                            const response = await axios.delete(`${baseUrl}/api/markers/${markerData.id}`, {
                                headers: {
                                    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
                                }
                            });
                            
                            if (response.data.success) {
                                // Close popup and cleanup current marker
                                if (currentOpenMarker.value === marker) {
                                    marker.closePopup();
                                    currentOpenMarker.value = null;
                                }
                                
                                // Remove the marker from the map
                                cleanupMarker(marker);
                                
                                // Remove from markers array
                                const index = markers.value.findIndex(m => m === marker);
                                if (index > -1) {
                                    markers.value.splice(index, 1);
                                }
                                
                                notificationStore.success('Marker deleted successfully');
                            }
                        } catch (error) {
                            console.error('Error deleting marker:', error);
                            if (error.response?.status === 401) {
                                notificationStore.error('Please login again to perform this action');
                                authStore.logout();
                            } else if (error.response?.status === 403) {
                                notificationStore.error('Admin access required to delete markers');
                            } else {
                                notificationStore.error('Failed to delete marker');
                            }
                        }
                    }
                };
                
                popupContent.appendChild(deleteButton);
            }

            const routeButton = document.createElement('button');
            routeButton.className = 'route-btn';
            routeButton.textContent = isRouteVisible ? 'Remove Route' : 'Show Route';

            routeButton.onclick = (e) => {
                e.stopPropagation();
                if (isRouteVisible) {
                    if (routingControl) {
                        map.value.removeControl(routingControl);
                        routingControl = null;
                    }
                    if (routeLayer) {
                        map.value.removeLayer(routeLayer);
                        routeLayer = null;
                    }
                    isRouteVisible = false;
                    marker.isRouteVisible = false;
                    marker.routingControl = null;
                    routeButton.textContent = 'Show Route';
                } else {
                    updateRoute();
                    isRouteVisible = true;
                    marker.isRouteVisible = true;
                    routeButton.textContent = 'Remove Route';
                }
            };

            const updateRoute = () => {
                const currentUserLatLng = userMarker.value.getLatLng();
                
                if (routingControl) {
                    map.value.removeControl(routingControl);
                }
                if (routeLayer) {
                    map.value.removeLayer(routeLayer);
                }

                const currentZoom = map.value.getZoom();
                const weight = getRouteWeight(currentZoom);

                routingControl = L.Routing.control({
                    waypoints: [
                        L.latLng(currentUserLatLng.lat, currentUserLatLng.lng),
                        L.latLng(markerLatLng.lat, markerLatLng.lng)
                    ],
                    router: L.Routing.osrmv1({
                        serviceUrl: 'https://router.project-osrm.org/route/v1'
                    }),
                    lineOptions: {
                        styles: [{ 
                            color: '#00D1D1', 
                            weight: weight,
                            opacity: 0.8,
                            className: 'route-path'
                        }],
                        addWaypoints: false,
                        missingRouteTolerance: 0
                    },
                    createMarker: function() { return null; },
                    addWaypoints: false,
                    draggableWaypoints: false,
                    fitSelectedRoutes: false,
                    showAlternatives: false,
                    show: false
                }).addTo(map.value);

                // Store the routing control in the marker
                marker.routingControl = routingControl;
                marker.isRouteVisible = true;
                routeButton.textContent = 'Remove Route';
            };

            if (userMarker.value) {
                userMarker.value.on('move', () => {
                    if (isRouteVisible) {
                        updateRoute();
                    }
                });
            }

            popupContent.appendChild(routeButton);

            // Use unbindPopup() before binding a new popup
            marker.unbindPopup();
            marker.bindPopup(popupContent, {
                closeButton: true,
                closeOnClick: false,
                autoClose: false,
                autoPan: false,
                keepInView: false,
                offset: L.point(0, -20)
            }).openPopup();

            // Add popup close handler
            marker.on('popupclose', () => {
                cleanupPreviousMarkerRoute(marker);
                currentOpenMarker.value = null;
            });
        }
    });

    markers.value.push(marker);
};

const createMarker = async (latlng) => {
    const token = localStorage.getItem('token');
    console.log('Creating marker - Auth state:', {
        isAuthenticated: authStore.isAuthenticated,
        token: token,
        coordinates: latlng
    });

    if (!token) {
        alert('Please login to add markers');
        return;
    }

    const title = prompt('Enter marker title:');
    if (!title?.trim()) {
        alert('Title is required');
        return;
    }

    const description = prompt('Enter marker description:');

    try {
        const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : 'https://disaster-app-backend.onrender.com';
        console.log('Sending marker request:', {
            url: `${baseUrl}/api/markers`,
            data: {
                title: title.trim(),
                description: description?.trim(),
                latitude: latlng.lat,
                longitude: latlng.lng
            }
        });

        const response = await axios.post(
            `${baseUrl}/api/markers`,
            {
                title: title.trim(),
                description: description?.trim(),
                latitude: latlng.lat,
                longitude: latlng.lng
            },
            {
                headers: {
                    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Marker creation response:', response.data);

        if (response.data.success) {
            createMarkerFromData(response.data.marker);
            alert('Marker added successfully');
        }
    } catch (error) {
        console.error('Error saving marker:', {
            error: error,
            response: error.response?.data,
            status: error.response?.status
        });
        if (error.response?.status === 401) {
            alert('Session expired. Please login again.');
            authStore.logout();
        } else {
            alert(`Failed to save marker: ${error.response?.data?.message || 'Network error - please try again'}`);
        }
    }
};

const centerOnUser = async () => {
    try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;

        if (map.value && userMarker.value) {
            // Update user marker position
            userMarker.value.setLatLng([latitude, longitude]);
            
            // Update accuracy circle if it exists
            if (accuracyCircle.value) {
                accuracyCircle.value.setLatLng([latitude, longitude]);
                accuracyCircle.value.setRadius(position.coords.accuracy);
            }

            // Pan map to new location with animation
            map.value.setView([latitude, longitude], 16, {
                animate: true,
                duration: 1
            });

            // Update any active routes if they exist
            if (currentOpenMarker.value?.isRouteVisible) {
                updateRouteOnZoom();
            }
        }
    } catch (error) {
        console.error('Error centering on user:', error);
        notificationStore.error('Unable to get your location. Please check your location permissions.');
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

    let lastUpdate = Date.now();
    const MIN_UPDATE_INTERVAL = 1000; // Minimum time between updates (1 second)

    return navigator.geolocation.watchPosition(
        (position) => {
            const now = Date.now();
            if (now - lastUpdate < MIN_UPDATE_INTERVAL) {
                return; // Skip update if too soon
            }

            // Only update if accuracy is good
            if (position.coords.accuracy <= 100) {
                updateUserLocation(position);
                lastUpdate = now;
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

const cleanupMarker = (marker) => {
    if (!marker) return;
    
    // Remove all event listeners
    marker.off();
    
    // Remove routing controls if they exist
    if (marker.routingControl) {
        map.value.removeControl(marker.routingControl);
        marker.routingControl = null;
    }
    
    // Remove route layer if it exists
    if (marker.routeLayer) {
        map.value.removeLayer(marker.routeLayer);
        marker.routeLayer = null;
    }
    
    // Remove popup if it exists
    if (marker.getPopup()) {
        marker.closePopup();
        marker.unbindPopup();
    }
    
    // Remove marker from map
    if (map.value && map.value.hasLayer(marker)) {
        map.value.removeLayer(marker);
    }
    
    // Remove any associated watchers
    if (marker.watcherId && activeWatchers.value.has(marker.watcherId)) {
        activeWatchers.value.delete(marker.watcherId);
    }
};

const cleanupAllMarkers = () => {
    markers.value.forEach(marker => {
        cleanupMarker(marker);
    });
    markers.value = [];
};

const updateRouteOnZoom = () => {
    if (!map.value || !currentOpenMarker.value || !userMarker.value) return;

    try {
        if (currentOpenMarker.value.isRouteVisible && currentOpenMarker.value.routingControl) {
            const userLatLng = userMarker.value.getLatLng();
            const markerLatLng = currentOpenMarker.value.getLatLng();
            
            if (userLatLng && markerLatLng) {
                const currentZoom = map.value.getZoom();
                const weight = getRouteWeight(currentZoom);

                // Get the routing control and its route
                const routingControl = currentOpenMarker.value.routingControl;
                const route = routingControl.getRouter();
                
                // Update the route options
                if (routingControl._router && routingControl._plan) {
                    // Update existing waypoints to trigger route redraw
                    routingControl.setWaypoints([
                        L.latLng(userLatLng.lat, userLatLng.lng),
                        L.latLng(markerLatLng.lat, markerLatLng.lng)
                    ]);

                    // Update line options for future route calculations
                    routingControl.options.lineOptions = {
                        styles: [{ 
                            color: '#00D1D1', 
                            weight: weight,
                            opacity: 0.8,
                            className: 'route-path'
                        }],
                        addWaypoints: false,
                        missingRouteTolerance: 0
                    };
                }
            }
        }
    } catch (error) {
        console.warn('Error updating route during zoom:', error);
    }
};

const updatePopupPosition = () => {
    if (!map.value || !currentOpenMarker.value) return;

    try {
        const popup = currentOpenMarker.value.getPopup();
        if (popup && popup.isOpen() && map.value) {
            requestAnimationFrame(() => {
                if (map.value && popup.isOpen()) {
                    popup.update();
                }
            });
        }
    } catch (error) {
        console.warn('Error updating popup position:', error);
    }
};

const getRouteWeight = (zoomLevel) => {
    const baseWeight = 4;
    const minWeight = 2;
    const maxWeight = 8;
    
    // Adjust weight based on zoom level ranges
    if (zoomLevel <= 12) return minWeight;
    if (zoomLevel >= 18) return maxWeight;
    
    // Linear interpolation between min and max weights
    return minWeight + ((zoomLevel - 12) * (maxWeight - minWeight) / (18 - 12));
};

const cleanupOtherRoutes = (currentMarker) => {
    markers.value.forEach(marker => {
        if (marker !== currentMarker && marker.isRouteVisible) {
            if (marker.routingControl) {
                map.value.removeControl(marker.routingControl);
                marker.routingControl = null;
            }
            if (marker.routeLayer) {
                map.value.removeLayer(marker.routeLayer);
                marker.routeLayer = null;
            }
            marker.isRouteVisible = false;
            
            // Update the route button text in the popup if it exists
            const popup = marker.getPopup();
            if (popup) {
                const routeBtn = popup.getContent().querySelector('.route-btn');
                if (routeBtn) {
                    routeBtn.textContent = 'Show Route';
                }
            }
        }
    });
};

const cleanupPreviousMarkerRoute = (marker) => {
    if (marker && marker.routingControl) {
        map.value.removeControl(marker.routingControl);
        marker.routingControl = null;
        marker.isRouteVisible = false;
        
        // Update the button text in the popup if it exists
        const popup = marker.getPopup();
        if (popup) {
            const routeBtn = popup.getContent().querySelector('.route-btn');
            if (routeBtn) {
                routeBtn.textContent = 'Show Route';
            }
        }
    }
};

onMounted(async () => {
    console.log('Component mounted, initializing map...');
    await initMap();
    locationWatchId = startLocationTracking();
    await loadMarkers();
    console.log('Initialization complete');
});

onUnmounted(() => {
    if (zoomTimeout) {
        clearTimeout(zoomTimeout);
    }
    if (map.value) {
        try {
            map.value.off('zoomend');
            cleanupAllMarkers();
            if (userMarker.value) {
                map.value.removeLayer(userMarker.value);
            }
            if (accuracyCircle.value) {
                map.value.removeLayer(accuracyCircle.value);
            }
            map.value.remove();
        } catch (error) {
            console.warn('Error during map cleanup:', error);
        }
    }
    if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
    }
    activeWatchers.value.clear();
});
</script>

<style scoped>
.evacuation-route-container {
    position: relative;
    width: 100%;
    height: calc(100vh - 80px);
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
    overflow: hidden;
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
    padding: 10px;
    min-width: 200px;
}

:deep(.custom-popup h3) {
    color: #2c3e50;
    margin-bottom: 8px;
    font-size: 1.2em;
    border-bottom: 2px solid #42b983;
    padding-bottom: 5px;
}

:deep(.custom-popup p) {
    color: #666;
    margin: 8px 0;
    line-height: 1.4;
}

:deep(.popup-actions) {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
}

:deep(.remove-marker-btn) {
    background: #ff4444;
    color: white;
    border: none;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    font-size: 0.9em;
    transition: background 0.3s ease;
}

:deep(.remove-marker-btn:hover) {
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    max-height: 300px;
    overflow-y: auto;
    overflow-y: hidden !important;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
}

:deep(.route-info) {
    margin: 10px 0;
    padding: 8px;
    background: #f0f8ff;
    border-radius: 4px;
}

:deep(.route-info p) {
    margin: 4px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #2c3e50;
}

:deep(.route-info i) {
    color: #00D1D1;
}

:deep(.leaflet-popup-close-button) {
    display: block !important;
    color: #666;
    font-size: 16px;
    padding: 4px;
    height: 20px;
    width: 20px;
    line-height: 14px;
    position: absolute;
    right: 0;
    top: 0;
}

:deep(.leaflet-popup-close-button:hover) {
    color: #ff4444;
    background: none;
}

:deep(.leaflet-popup-content-wrapper) {
    padding-right: 20px;
}

:deep(.leaflet-container) {
    overflow: hidden !important;
}

:deep(.leaflet-control-container) {
    overflow: hidden;
}

:deep(.leaflet-routing-container::-webkit-scrollbar) {
    display: none; /* Chrome, Safari, Opera */
}

:deep(.delete-marker-btn) {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
    border: none;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    margin: 8px 0;
    font-size: 0.9em;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

:deep(.delete-marker-btn:hover) {
    background: #dc2626;
    color: white;
}

:deep(.popup-header) {
    margin-bottom: 1rem;
}

:deep(.popup-meta) {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #666;
}

:deep(.meta-item) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

:deep(.meta-item i) {
    color: #42b983;
    font-size: 0.875rem;
}

:deep(.popup-description) {
    margin: 1rem 0;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 3px solid #42b983;
}

:deep(.popup-description p) {
    margin: 0;
    color: #2c3e50;
    line-height: 1.5;
}

</style>