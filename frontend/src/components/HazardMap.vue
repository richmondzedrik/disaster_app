<template>
  <div class="hazard-map-container">
    <div class="header">
      <h1>Hazard Maps Gallery</h1>
      <button v-if="authStore.user?.role === 'admin'" @click="showUploadModal = true" class="upload-btn">
        <i class="fas fa-upload"></i> Upload New Map
      </button>
    </div>

    <div class="maps-grid">
      <div v-for="map in hazardMaps" :key="map.id" class="map-card">
        <img :src="map.imageUrl" :alt="map.title" @click="openMapPreview(map)" />
        <div class="map-info">
          <h3>{{ map.title }}</h3>
          <p>{{ map.description }}</p>
          <div class="map-meta">
            <span><i class="fas fa-calendar"></i> {{ formatDate(map.created_at) }}</span>
            <span><i class="fas fa-user"></i> {{ map.uploaded_by }}</span>
          </div>
          <button v-if="authStore.user?.role === 'admin'" 
                  @click="deleteMap(map.id)" 
                  class="delete-btn">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Upload New Hazard Map</h3>
          <button class="close-btn" @click="showUploadModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="uploadMap" class="upload-form">
            <div class="form-group">
              <label>Title</label>
              <input v-model="newMap.title" type="text" required />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="newMap.description" required></textarea>
            </div>
            <div class="form-group">
              <label>Map Image</label>
              <div class="image-upload-area" 
                   @drop.prevent="handleDrop"
                   @dragover.prevent>
                <input type="file" 
                       @change="handleFileSelect" 
                       accept="image/*" 
                       ref="fileInput"
                       class="file-input" />
                <div class="upload-placeholder">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <p>Drag and drop or click to upload</p>
                </div>
                <img v-if="imagePreview" :src="imagePreview" class="image-preview" />
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="cancel-btn" @click="showUploadModal = false">Cancel</button>
              <button type="submit" class="submit-btn" :disabled="isUploading">
                {{ isUploading ? 'Uploading...' : 'Upload Map' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Map Preview Modal -->
    <div v-if="selectedMap" class="modal-overlay" @click="selectedMap = null">
      <div class="preview-modal" @click.stop>
        <img :src="selectedMap.imageUrl" :alt="selectedMap.title" />
        <div class="preview-info">
          <h3>{{ selectedMap.title }}</h3>
          <p>{{ selectedMap.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notification';
import axios from 'axios';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const showUploadModal = ref(false);
const hazardMaps = ref([]);
const isUploading = ref(false);
const imagePreview = ref(null);
const selectedMap = ref(null);
const fileInput = ref(null);

const newMap = ref({
  title: '',
  description: '',
  file: null
});

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const loadHazardMaps = async () => {
  try {
    const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : 'https://disaster-app-backend.onrender.com';
    const response = await axios.get(`${baseUrl}/api/hazard-maps`);
    hazardMaps.value = response.data.maps;
  } catch (error) {
    notificationStore.error('Failed to load hazard maps');
  }
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    newMap.value.file = file;
    imagePreview.value = URL.createObjectURL(file);
  }
};

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    newMap.value.file = file;
    imagePreview.value = URL.createObjectURL(file);
  }
};

const uploadMap = async () => {
  if (!newMap.value.file) {
    notificationStore.error('Please select an image to upload');
    return;
  }

  try {
    isUploading.value = true;
    const formData = new FormData();
    formData.append('title', newMap.value.title);
    formData.append('description', newMap.value.description);
    formData.append('image', newMap.value.file);

    const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : 'https://disaster-app-backend.onrender.com';
    await axios.post(`${baseUrl}/api/hazard-maps`, formData, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    notificationStore.success('Hazard map uploaded successfully');
    showUploadModal.value = false;
    await loadHazardMaps();
    resetForm();
  } catch (error) {
    notificationStore.error('Failed to upload hazard map');
  } finally {
    isUploading.value = false;
  }
};

const deleteMap = async (mapId) => {
  if (!confirm('Are you sure you want to delete this map?')) return;

  try {
    const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : 'https://disaster-app-backend.onrender.com';
    await axios.delete(`${baseUrl}/api/hazard-maps/${mapId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    notificationStore.success('Hazard map deleted successfully');
    await loadHazardMaps();
  } catch (error) {
    notificationStore.error('Failed to delete hazard map');
  }
};

const openMapPreview = (map) => {
  selectedMap.value = map;
};

const resetForm = () => {
  newMap.value = {
    title: '',
    description: '',
    file: null
  };
  imagePreview.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

onMounted(() => {
  loadHazardMaps();
});
</script>

<style scoped>
.hazard-map-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.upload-btn {
  background: #00D1D1;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.upload-btn:hover {
  background: #00ADAD;
  transform: translateY(-2px);
}

.maps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.map-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.map-card:hover {
  transform: translateY(-5px);
}

.map-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  cursor: pointer;
}

.map-info {
  padding: 1.5rem;
}

.map-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.map-info p {
  color: #666;
  margin-bottom: 1rem;
}

.map-meta {
  display: flex;
  gap: 1rem;
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.map-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.delete-btn {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: #dc2626;
  color: white;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
}

.image-upload-area {
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  position: relative;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-placeholder {
  color: #6b7280;
}

.upload-placeholder i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.image-preview {
  max-width: 100%;
  max-height: 200px;
  margin-top: 1rem;
  border-radius: 6px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.submit-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.submit-btn {
  background: #00D1D1;
  color: white;
  border: none;
}

.submit-btn:hover:not(:disabled) {
  background: #00ADAD;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.preview-modal {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  max-width: 90%;
  max-height: 90vh;
}

.preview-modal img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-info {
  padding: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.25rem;
}

.close-btn:hover {
  color: #374151;
}
</style>
