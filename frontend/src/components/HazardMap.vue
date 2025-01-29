<template>
  <div class="hazard-map-container">
    <h2 class="gallery-title">Hazard Map Gallery</h2>
    <div class="gallery-grid">
      <div v-for="(zone, index) in hazardZones" :key="index" class="gallery-item">
        <div class="image-container">
          <img 
            :src="zone.image_url || getPlaceholderImage(zone.risk_level)"
            :alt="zone.name"
            class="zone-image"
            @error="handleImageError"
            @click="openFullscreen(zone.image_url)"
          />
          <div class="zone-info">
            <h3>{{ zone.name }}</h3>
            <p class="risk-level" :class="zone.risk_level">
              Risk Level: {{ zone.risk_level.charAt(0).toUpperCase() + zone.risk_level.slice(1) }}
            </p>
            <p class="description">{{ zone.description }}</p>
            <p class="source">Source: {{ zone.source }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Fullscreen Modal -->
    <div v-if="fullscreenImage" 
         class="fullscreen-modal" 
         @click="closeFullscreen"
         @mousedown="startDrag"
         @mousemove="onDrag"
         @mouseup="stopDrag"
         @mouseleave="stopDrag">
      <img 
        :src="fullscreenImage" 
        alt="Fullscreen view" 
        class="fullscreen-image" 
        :style="{ 
          transform: `scale(${zoomLevel}) translate(${translate.x}px, ${translate.y}px)`,
          cursor: zoomLevel > 1 ? 'grab' : 'default'
        }"
        @click.stop
      />
      <div class="zoom-controls" @click.stop>
        <button class="zoom-button" @click="zoomIn">
          <i class="fas fa-plus"></i>
        </button>
        <button class="zoom-button" @click="zoomOut">
          <i class="fas fa-minus"></i>
        </button>
      </div>
      <button class="close-button" @click="closeFullscreen">&times;</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const fullscreenImage = ref(null);
const zoomLevel = ref(1);
const isDragging = ref(false);
const startPos = ref({ x: 0, y: 0 });
const translate = ref({ x: 0, y: 0 });

const openFullscreen = (imageUrl) => {
  fullscreenImage.value = imageUrl;
  zoomLevel.value = 1;
  translate.value = { x: 0, y: 0 };
  document.body.style.overflow = 'hidden';
};

const closeFullscreen = () => {
  fullscreenImage.value = null;
  zoomLevel.value = 1;
  translate.value = { x: 0, y: 0 };
  document.body.style.overflow = 'auto';
};

const startDrag = (e) => {
  if (zoomLevel.value > 1) {
    isDragging.value = true;
    startPos.value = {
      x: e.clientX - translate.value.x,
      y: e.clientY - translate.value.y
    };
  }
};

const onDrag = (e) => {
  if (isDragging.value) {
    // Calculate boundaries based on zoom level
    const maxTranslate = (zoomLevel.value - 1) * 500; // Adjust this value based on your needs
    
    // Calculate new position
    const newX = e.clientX - startPos.value.x;
    const newY = e.clientY - startPos.value.y;
    
    // Apply constraints
    translate.value = {
      x: Math.max(Math.min(newX, maxTranslate), -maxTranslate),
      y: Math.max(Math.min(newY, maxTranslate), -maxTranslate)
    };
  }
};

const stopDrag = () => {
  isDragging.value = false;
};

const zoomIn = (e) => {
  e.stopPropagation();
  zoomLevel.value = Math.min(zoomLevel.value + 0.2, 3);
};

const zoomOut = (e) => {
  e.stopPropagation();
  zoomLevel.value = Math.max(zoomLevel.value - 0.2, 0.5);
};

const hazardZones = [
  {
    name: "The READY Project: LIQUEFACTION HAZARD MAP OF ABRA",
    description: "Based on the READY Project's Liquefaction Hazard Map of Abra, this area shows high susceptibility to liquefaction during seismic events. The zone encompasses parts of central Bangued along the Abra River, characterized by loose, water-saturated sediments that could behave like liquids during strong ground shaking. Historical data from the July 2022 magnitude 7.0 earthquake confirms this vulnerability.",
    risk_level: "high",
    source: "READY Project: Liquefaction Hazard Map of Abra 2023",
    image_url: "https://res.cloudinary.com/dmgivh17b/image/upload/v1738154817/disaster-app/hazardmaps/x2ncc4f8jfvafn2hwpmr.jpg",
    coordinates: [
      [17.5907, 120.6856],
      [17.5950, 120.6900],
      [17.5920, 120.6950],
      [17.5880, 120.6900]
    ]
  },
  {
    name: "Detailed Landslide and Flood Susceptibility Map of Abra",
    description: "Based on MGB's hazard mapping, this area shows varying susceptibility to landslides and floods. The assessment considers slope, rock type, soil characteristics, vegetation cover, rainfall data, and historical disaster events. Areas marked in red indicate high susceptibility to landslides particularly during intense rainfall and seismic activities, while orange zones show moderate risk requiring monitoring during heavy precipitation.",
    risk_level: "high",
    source: "PHIVOLCS Earthquake Impact Assessment 2022",
    image_url: "https://res.cloudinary.com/dmgivh17b/image/upload/v1738155399/disaster-app/hazardmaps/pw9dgprhhiamr9j1xmc9.jpg",
    coordinates: [
      [17.5833, 120.6767],
      [17.5867, 120.6800],
      [17.5850, 120.6833],
      [17.5817, 120.6800]
    ]
  }
];

const getPlaceholderImage = (riskLevel) => {
  // Updated image URLs with more reliable sources
  switch (riskLevel.toLowerCase()) {
    case 'high':
      return 'https://hazardhunter.georisk.gov.ph/sites/default/files/2021-03/high-risk.png';
    case 'moderate':
      return 'https://hazardhunter.georisk.gov.ph/sites/default/files/2021-03/moderate-risk.png';
    case 'low':
      return 'https://hazardhunter.georisk.gov.ph/sites/default/files/2021-03/low-risk.png';
    default:
      return 'https://hazardhunter.georisk.gov.ph/sites/default/files/2021-03/general-risk.png';
  }
};

// Add error handling for images
const handleImageError = (event) => {
  // Fallback to a local asset if the remote image fails to load
  event.target.src = '/assets/images/fallback-hazard-map.png';
};
</script>

<style scoped>
.hazard-map-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.gallery-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 1rem;
}

.gallery-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.gallery-item:hover {
  transform: translateY(-5px);
}

.image-container {
  position: relative;
}

.zone-image {
  width: 100%;
  height: 400px;
  object-fit: contain;
  background: #f5f5f5;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.zone-image:hover {
  transform: scale(1.02);
}

.zone-info {
  padding: 1.5rem;
  background: white;
}

.zone-info h3 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.risk-level {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.risk-level.high {
  background: rgba(255, 68, 68, 0.1);
  color: #ff4444;
}

.risk-level.moderate {
  background: rgba(255, 165, 0, 0.1);
  color: #ffa500;
}

.risk-level.low {
  background: rgba(66, 185, 131, 0.1);
  color: #42b983;
}

.description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.source {
  color: #999;
  font-size: 0.8rem;
  font-style: italic;
}

.fullscreen-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  transition: transform 0.1s ease;
  user-select: none;
  will-change: transform;
  transform-origin: center;
}

.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 2rem;
  cursor: default;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
}

.close-button:hover {
  color: #00D1D1;
}

.zoom-controls {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem;
  border-radius: 8px;
}

.zoom-button {
  background: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.zoom-button:hover {
  background-color: #00D1D1;
  color: white;
}

@media (max-width: 768px) {
  .hazard-map-container {
    padding: 1rem;
  }
  
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
