<template>
  <div class="resource-locator">
    <h2>Find Nearby Emergency Resources</h2>
    <div class="resource-filters">
      <button 
        v-for="resourceType in resourceTypes" 
        :key="resourceType.id"
        @click="setActiveResourceType(resourceType.id)"
        :class="{ active: activeResourceType === resourceType.id }"
      >
        <i :class="resourceType.icon"></i> {{ resourceType.name }}
      </button>
    </div>
    
    <div id="resource-map" class="map-container"></div>
    
    <div class="resource-list">
      <div v-if="isLoading" class="loading">Loading resources...</div>
      <div v-else-if="nearbyResources.length === 0" class="no-results">
        No resources found nearby. Try expanding your search radius.
      </div>
      <div v-else class="resource-cards">
        <div v-for="resource in nearbyResources" :key="resource.id" class="resource-card">
          <h3>{{ resource.name }}</h3>
          <p><i class="fas fa-map-marker-alt"></i> {{ resource.distance.toFixed(1) }} miles away</p>
          <p><i class="fas fa-phone"></i> {{ resource.phone || 'N/A' }}</p>
          <div class="resource-actions">
            <button @click="getDirections(resource)">Get Directions</button>
            <button @click="saveToFavorites(resource)">Save</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import L from 'leaflet';
import axios from 'axios';
import { useNotificationStore } from '../stores/notification';

// Resource types
const resourceTypes = [
  { id: 'hospital', name: 'Hospitals', icon: 'fas fa-hospital' },
  { id: 'shelter', name: 'Shelters', icon: 'fas fa-home' },
  { id: 'fire_station', name: 'Fire Stations', icon: 'fas fa-fire-extinguisher' },
  { id: 'police', name: 'Police Stations', icon: 'fas fa-shield-alt' },
  { id: 'pharmacy', name: 'Pharmacies', icon: 'fas fa-prescription-bottle-alt' }
];

// State variables
const map = ref(null);
const userLocation = ref(null);
const activeResourceType = ref('hospital');
const nearbyResources = ref([]);
const isLoading = ref(false);
const notificationStore = useNotificationStore();

// Initialize map
onMounted(() => {
  // Initialize map similar to EvacuationRoute.vue
  // Find user location and display markers for nearby resources
});

// Function to fetch nearby resources
const fetchNearbyResources = async () => {
  // Call backend API or external service to find resources
};

// Function to set active resource type and refresh
const setActiveResourceType = (typeId) => {
  activeResourceType.value = typeId;
  fetchNearbyResources();
};

// Function to get directions to a resource
const getDirections = (resource) => {
  // Show route on map
};

// Function to save resource to favorites
const saveToFavorites = async (resource) => {
  // Save to user's favorites in database
};
</script>

<style scoped>
/* Styling for the component */
</style> 