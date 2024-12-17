<template>
    <div class="evacuation-routes">
      <div class="header">
        <h1>Evacuation Routes - Bangued, Abra</h1>
        <p>Official evacuation routes and emergency assembly points</p>
      </div>
  
      <div class="map-container">
        <iframe
          width="100%"
          height="450"
          style="border:0"
          loading="lazy"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade"
          :src="mapUrl"
        ></iframe>
      </div>
  
      <div class="routes-grid">
        <div class="route-card" v-for="(route, index) in evacuationRoutes" :key="index">
          <div class="route-header">
            <i :class="route.icon"></i>
            <h3>{{ route.name }}</h3>
          </div>
          <div class="route-content">
            <p class="location"><i class="fas fa-map-marker-alt"></i> {{ route.location }}</p>
            <p class="description">{{ route.description }}</p>
            <div class="route-details">
              <div class="detail-item">
                <i class="fas fa-users"></i>
                <span>Capacity: {{ route.capacity }}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-road"></i>
                <span>Access: {{ route.access }}</span>
              </div>
            </div>
            <button class="view-route-btn" :class="{ 'loading': isLoading }" @click="showRouteOnMap(route)" :disabled="isLoading || !route.coordinates">
              <i class="fas fa-map-marked-alt"></i>
              {{ isLoading ? 'Loading...' : 'View on Map' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const baseMapUrl = 'https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY';
  const mapUrl = ref(`${baseMapUrl}&q=Bangued+Abra+Philippines&zoom=14`);
  const isLoading = ref(false);
  
  const evacuationRoutes = [
    {
      name: 'Bangued Central School',
      icon: 'fas fa-school',
      location: 'Zone 2, Bangued',
      description: 'Primary evacuation center for Zone 1, 2, and 3 residents. Access via Rizal Street.',
      capacity: '500 persons',
      access: 'Multiple entry points',
      coordinates: 'Bangued+Central+School+Abra'
    },
    {
      name: 'Bangued East Central School',
      icon: 'fas fa-building',
      location: 'Zone 5, Bangued',
      description: 'Main evacuation point for eastern barangays. Accessible through National Highway.',
      capacity: '300 persons',
      access: 'Vehicle and pedestrian access',
      coordinates: 'Bangued+East+Central+School+Abra'
    },
    {
      name: 'Bangued Covered Court',
      icon: 'fas fa-warehouse',
      location: 'Zone 7, Bangued',
      description: 'Emergency assembly area for central Bangued residents.',
      capacity: '400 persons',
      access: 'All-weather access',
      coordinates: 'Bangued+Covered+Court+Zone+7+Abra'
    },
    {
      name: 'Bangued Municipal Hall',
      icon: 'fas fa-city',
      location: 'Zone 1, Bangued',
      description: 'Command center and evacuation point. Emergency services coordination hub.',
      capacity: '250 persons',
      access: 'Multiple routes available',
      coordinates: 'Bangued+Municipal+Hall+Abra'
    }
  ];

  const showRouteOnMap = async (route) => {
    if (!route.coordinates) {
      console.error('No coordinates available for this location');
      return;
    }

    isLoading.value = true;
    try {
      mapUrl.value = `${baseMapUrl}&q=${route.coordinates}&zoom=16`;
      
      // Scroll to map container smoothly
      const mapContainer = document.querySelector('.map-container');
      if (mapContainer) {
        mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (error) {
      console.error('Error showing route on map:', error);
    } finally {
      isLoading.value = false;
    }
  };
  </script>
  
  <style scoped>
  .evacuation-routes {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .header h1 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }
  
  .header p {
    color: #64748b;
  }
  
  .routes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .route-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
  }
  
  .route-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .route-header i {
    font-size: 1.5rem;
    color: #00D1D1;
  }
  
  .route-header h3 {
    color: #2c3e50;
    margin: 0;
  }
  
  .route-content .location {
    color: #00D1D1;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  
  .route-content .description {
    color: #64748b;
    margin-bottom: 1rem;
  }
  
  .route-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .detail-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #2c3e50;
  }
  
  .detail-item i {
    color: #00D1D1;
    width: 20px;
  }
  
  .map-container {
    width: 100%;
    margin-bottom: 2rem;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .view-route-btn {
    width: 100%;
    background-color: #00D1D1;
    color: white;
    padding: 0.75rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 500;
    transition: all 0.3s ease;
    margin-top: 1rem;
  }
  
  .view-route-btn:hover {
    background-color: #00ADAD;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 209, 209, 0.2);
  }
  
  .view-route-btn:active {
    transform: translateY(0);
  }
  
  .view-route-btn i {
    font-size: 1.1rem;
  }
  
  .view-route-btn.loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
  </style>