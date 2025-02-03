<template>
    <div class="evacuation-route-container">
        <div v-if="isLoading" class="loading-overlay">
            <div class="loader"></div>
            <span>Loading map...</span>
        </div>
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

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

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
const isLoading = ref(true);

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

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);   
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Initialize map with basic functionality
const initMap = async () => {
    isLoading.value = true;
    try {
        const position = await getCurrentPosition().catch(() => ({ coords: { latitude: 17.5907, longitude: 120.6856 } }));
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

        // Wait for tile layer to load
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map.value);

        // Add loading complete handler
        tileLayer.on('load', () => {
            isLoading.value = false;
        });

        // Rest of your existing map initialization code
        map.value.touchZoom.disable();
        map.value.doubleClickZoom.disable();
        map.value.boxZoom.disable();

        map.value.on('click', handleMapClick);
        initializeUserMarker(position);

        // Add your existing zoom handlers here
        const debouncedRouteUpdate = debounce(() => {
            if (map.value && currentOpenMarker.value?.isRouteVisible) {
                updateRouteOnZoom();
            }
        }, 300);

        map.value.on('zoomstart', () => {
            if (currentOpenMarker.value?.routingControl) {
                const container = currentOpenMarker.value.routingControl.getContainer();
                if (container) {
                    container.style.visibility = 'hidden';
                }
            }
        });

        map.value.on('zoomend', () => {
            updatePopupPosition();
            if (currentOpenMarker.value?.routingControl) {
                const container = currentOpenMarker.value.routingControl.getContainer();
                if (container) {
                    container.style.visibility = 'visible';
                }
            }
            debouncedRouteUpdate();
        });

        // Set loading to false after a timeout in case tile loading fails
        setTimeout(() => {
            isLoading.value = false;
        }, 5000);

    } catch (error) {
        console.error('Map initialization error:', error);
        isLoading.value = false;
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
    // Create marker with fixed coordinates and disable all movement
    const marker = L.marker([markerData.latitude, markerData.longitude], {
        draggable: false,
        autoPan: false,
        riseOnHover: false,
        bubblingMouseEvents: false,
        interactive: true,
        keyboard: false,
        zIndexOffset: 1000
    }).addTo(map.value);

    // Store original coordinates
    marker.originalLatLng = L.latLng(markerData.latitude, markerData.longitude);
    
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

            const header = document.createElement('div');
            header.className = 'popup-header';
            header.innerHTML = `<h3>${markerData.title || 'Untitled Location'}</h3>`;

            const meta = document.createElement('div');
            meta.className = 'popup-meta';
            meta.innerHTML = `
                <div class="meta-item">
                    <i class="fas fa-user"></i>
                    <span>Created by: ${markerData.created_by || markerData.username || 'Unknown User'}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>${new Date(markerData.created_at).toLocaleDateString()}</span>
                </div>
            `;

            const description = document.createElement('div');
            description.className = 'popup-description';
            description.innerHTML = `<p>${markerData.description || 'No description available'}</p>`;

            const actions = document.createElement('div');
            actions.className = 'popup-actions';

            popupContent.appendChild(header);
            popupContent.appendChild(meta);
            popupContent.appendChild(description);
            popupContent.appendChild(actions);

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
                                // Reset current marker reference
                                if (currentOpenMarker.value === marker) {
                                    currentOpenMarker.value = null;
                                }
                                
                                // Perform complete cleanup with garbage collection
                                cleanupMarker(marker);
                                
                                notificationStore.success('Marker deleted successfully');
                                
                                // Reset remaining markers to their original positions
                                markers.value.forEach(m => {
                                    if (m && m.originalLatLng) {
                                        m.setLatLng(m.originalLatLng);
                                    }
                                });
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
            routeButton.textContent = isRouteVisible ? 'Hide Route' : 'Show Route';

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
                    routeButton.textContent = 'Hide Route';
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
                        serviceUrl: 'https://router.project-osrm.org/route/v1',
                        profile: 'foot'
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
                    show: false,
                    formatter: new L.Routing.Formatter({
                        units: 'metric',
                        roundingSensitivity: 1
                    })
                }).addTo(map.value);

                // Add route summary handler
                routingControl.on('routesfound', function(e) {
                    const routes = e.routes;
                    const summary = routes[0].summary;
                    
                    // Create route info element
                    const routeInfo = document.createElement('div');
                    routeInfo.className = 'route-info';
                    
                    const walkingTime = formatDuration(summary.totalTime);
                    const distance = formatDistance(summary.totalDistance);
                    const arrival = getEstimatedArrival(summary.totalTime);
                    
                    routeInfo.innerHTML = `
                        <p><i class="fas fa-walking"></i> Walking time: ${walkingTime}</p>
                        <p><i class="fas fa-route"></i> Distance: ${distance}</p>
                        <p><i class="fas fa-clock"></i> Estimated arrival: ${arrival}</p>
                    `;
                    
                    // Find and update the popup content
                    const popup = marker.getPopup();
                    if (popup) {
                        const content = popup.getContent();
                        const existingRouteInfo = content.querySelector('.route-info');
                        if (existingRouteInfo) {
                            existingRouteInfo.replaceWith(routeInfo);
                        } else {
                            content.appendChild(routeInfo);
                        }
                        popup.update();
                    }
                });

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
    const user = authStore.user;

    console.log('Creating marker with user:', {
        username: user?.username,
        token: token
    });

    if (!token || !user) {
        notificationStore.error('Please login to add markers');
        return;
    }

    const title = prompt('Enter marker title:');
    if (!title?.trim()) {
        notificationStore.error('Title is required');
        return;
    }

    const description = prompt('Enter marker description:');

    try {
        const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : 'https://disaster-app-backend.onrender.com';
        
        const markerData = {
            title: title.trim(),
            description: description?.trim(),
            latitude: latlng.lat,
            longitude: latlng.lng,
            created_by: user.username
        };

        const response = await axios.post(
            `${baseUrl}/api/markers`,
            markerData,
            {
                headers: {
                    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.success) {
            const newMarkerData = {
                ...response.data.marker,
                username: user.username,
                created_by: user.username
            };
            createMarkerFromData(newMarkerData);
            notificationStore.success('Marker added successfully');
        }
    } catch (error) {
        console.error('Error saving marker:', error.response?.data || error);
        if (error.response?.status === 401) {
            notificationStore.error('Session expired. Please login again.');
            authStore.logout();
        } else {
            notificationStore.error(error.response?.data?.message || 'Failed to save marker. Please try again.');
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

                // Accept any position, but warn if accuracy is low
                if (position.coords.accuracy > 100) {
                    console.warn('Location accuracy is low:', position.coords.accuracy, 'meters');
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

const destroyMarker = (marker) => {
    if (!marker) return;

    try {
        // Remove all event bindings first
        if (marker._events) {
            marker.off();
        }

        // Close and unbind popup if exists
        if (marker.getPopup()) {
            marker.closePopup();
            marker.unbindPopup();
        }
        
        // Remove from map if still added
        if (map.value && map.value.hasLayer(marker)) {
            map.value.removeLayer(marker);
        }

        // Safely remove DOM elements if they exist
        if (marker._icon && marker._icon.parentNode) {
            marker._icon.parentNode.removeChild(marker._icon);
        }
        if (marker._shadow && marker._shadow.parentNode) {
            marker._shadow.parentNode.removeChild(marker._shadow);
        }

        // Clear all custom properties
        marker.routingControl = null;
        marker.routeLayer = null;
        marker.isRouteVisible = false;
        marker.watcherId = null;
        marker.originalLatLng = null;

        // Clear internal Leaflet properties
        marker._map = null;
        marker._popup = null;
        marker._events = null;
        marker._eventParents = null;
        marker._leaflet_events = null;
        marker._leaflet_id = null;
        marker._icon = null;
        marker._shadow = null;
        marker._zIndex = null;
        
        // Clear options
        marker.options = null;
        marker.dragging = null;
    } catch (error) {
        console.warn('Error during marker destruction:', error);
    }

    return null;
};

const cleanupMarker = (marker) => {
    if (!marker) return;
    
    try {
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
        
        // Remove watchers
        if (marker.watcherId && activeWatchers.value.has(marker.watcherId)) {
            activeWatchers.value.delete(marker.watcherId);
        }
        
        // Remove from markers array
        const index = markers.value.findIndex(m => m === marker);
        if (index > -1) {
            markers.value.splice(index, 1);
        }
        
        // Perform thorough cleanup and destroy marker
        marker = destroyMarker(marker);
    } catch (error) {
        console.warn('Error during marker cleanup:', error);
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
        // Reset positions of all markers to their original coordinates
        markers.value.forEach(marker => {
            if (marker.originalLatLng) {
                marker.setLatLng(marker.originalLatLng);
            }
        });

        if (currentOpenMarker.value.isRouteVisible && currentOpenMarker.value.routingControl) {
            const userLatLng = userMarker.value.getLatLng();
            const markerLatLng = currentOpenMarker.value.originalLatLng || currentOpenMarker.value.getLatLng();
            
            // Only update if positions are valid
            if (userLatLng && markerLatLng) {
                requestAnimationFrame(() => {
                    const routingControl = currentOpenMarker.value.routingControl;
                    if (routingControl && routingControl._router && routingControl._plan) {
                        routingControl.setWaypoints([
                            L.latLng(userLatLng.lat, userLatLng.lng),
                            L.latLng(markerLatLng.lat, markerLatLng.lng)
                        ]);
                    }
                });
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

const formatDistance = (meters) => {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
};

const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
};

const getEstimatedArrival = (durationInSeconds) => {
    const arrival = new Date(Date.now() + (durationInSeconds * 1000));
    return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    padding: 12px;
    background: #f0f8ff;
    border-radius: 6px;
    border-left: 3px solid #00D1D1;
}

:deep(.route-info p) {
    margin: 6px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #2c3e50;
    font-size: 0.95em;
}

:deep(.route-info i) {
    color: #00D1D1;
    width: 16px;
    text-align: center;
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
    padding: 12px 0;
    border-radius: 8px;
}

:deep(.leaflet-popup-content) {
    margin: 0;
    padding: 0 12px;
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
    flex-direction: column;
    gap: 0.5rem;
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
    width: 16px;
    text-align: center;
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

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.loader {
    width: 48px;
    height: 48px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #42b983;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-overlay span {
    color: #42b983;
    font-size: 1.1em;
    font-weight: 500;
}

</style>