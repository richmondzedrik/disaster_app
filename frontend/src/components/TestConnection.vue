<template>
  <div class="test-connection">
    <h3>System Health Check</h3>
    <button @click="testAllSystems" :disabled="loading">
      <i class="fas fa-sync" :class="{ 'fa-spin': loading }"></i>
      {{ loading ? 'Testing...' : 'Test All Systems' }}
    </button>
    
    <div class="status-container" v-if="hasResults">
      <!-- Core Systems -->
      <div class="status-group">
        <h4>Core Systems</h4>
        <StatusItem title="Backend" :status="status.backend" />
        <StatusItem title="Database" :status="status.database" />
      </div>

      <!-- API Services -->
      <div class="status-group">
        <h4>API Services</h4>
        <div class="service-details">
          <StatusItem title="Alerts API" :status="status.alerts" />
          <div v-if="status.alerts?.success" class="test-data">
            <strong>Test Alerts:</strong>
            <ul>
              <li>Emergency Alert (High Priority)</li>
              <li>Warning Alert (Medium Priority)</li>
            </ul>
          </div>
        </div>

        <div class="service-details">
          <StatusItem title="News API" :status="status.news" />
          <div v-if="status.news?.success" class="test-data">
            <strong>Test Posts:</strong>
            <ul>
              <li>Emergency Update Post</li>
              <li>Community Alert Post</li>
            </ul>
          </div>
        </div>

        <div class="service-details">
          <StatusItem title="Checklist API" :status="status.checklist" />
          <div v-if="status.checklist?.success" class="test-data">
            <strong>Test Items:</strong>
            <ul>
              <li>Emergency Kit (Supplies)</li>
              <li>Evacuation Plan (Planning)</li>
            </ul>
          </div>
        </div>

        <div class="service-details">
          <StatusItem title="Image Upload" :status="status.imageUpload" />
          <div v-if="status.imageUpload?.success" class="test-data">
            <strong>Test Image Upload:</strong>
            <ul>
              <li>Upload Service: Cloudinary</li>
              <li>Test Image URL: {{ status.imageUpload?.testData?.url || 'N/A' }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Auth Services -->
      <div class="status-group">
        <h4>Auth Services</h4>
        <StatusItem title="Auth API" :status="status.auth" />
        <StatusItem title="Admin API" :status="status.admin" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import api from '../services/api';
import StatusItem from './StatusItem.vue';

// Main component logic
const loading = ref(false);
const status = ref({
  backend: null,
  database: null,
  alerts: null,
  news: null,
  checklist: null,
  auth: null,
  admin: null,
  imageUpload: null
});

const hasResults = computed(() => 
  Object.values(status.value).some(val => val !== null)
);

const testEndpoint = async (endpoint, options = {}) => {
  try {
    const response = await api.get(endpoint, options);
    
    // Test both connection and content
    const contentCheck = {
      '/api/alerts/test': () => {
        return {
          valid: response.data?.success === true && Array.isArray(response.data?.data?.alerts),
          testData: response.data?.data?.alerts || []
        };
      },
      '/api/news/test': () => {
        return {
          valid: response.data?.success === true && Array.isArray(response.data?.data?.posts),
          testData: response.data?.data?.posts || []
        };
      },
      '/api/checklist/test': () => {
        return {
          valid: response.data?.success === true && Array.isArray(response.data?.data?.items),
          testData: response.data?.data?.items || []
        };
      }
    }[endpoint];

    const check = contentCheck ? contentCheck() : { valid: true };
    
    return {
      success: response.data?.success && check.valid,
      message: check.valid 
        ? `Connected and validated: ${check.testData?.length || 0} items found`
        : 'Connected but invalid content format',
      testData: check.testData
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
};

const getContentDetails = (data, endpoint) => {
  const details = {
    '/api/alerts/test': () => `${data.alerts?.length || 0} alerts found`,
    '/api/news/test': () => `${data.posts?.length || 0} posts found`,
    '/api/checklist/test': () => `${data.items?.length || 0} items found`
  }[endpoint];

  return details ? details() : '';
};

// Test image upload service
const testImageUpload = async () => {
  try {
    // Create a small test image using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00ADA9';
    ctx.fillRect(0, 0, 100, 100);
    
    // Convert canvas to blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const formData = new FormData();
    formData.append('image', blob, 'test-image.png');

    const response = await api.post('/news/test-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return {
      success: response.data?.success,
      message: response.data?.success ? 'Image upload service operational' : 'Upload test failed',
      testData: {
        url: response.data?.url
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Image upload test failed',
      error: error.message
    };
  }
};

const testAllSystems = async () => {
  loading.value = true;
  Object.keys(status.value).forEach(key => status.value[key] = null);

  try {
    // Test core systems
    status.value.backend = await testEndpoint('/api/test');
    status.value.database = await testEndpoint('/api/db-test');

    // Test API services with content validation
    const alertsTest = await testEndpoint('/api/alerts/test');
    status.value.alerts = {
      ...alertsTest,
      message: alertsTest.success 
        ? 'Connected and content validated'
        : alertsTest.message
    };

    const newsTest = await testEndpoint('/api/news/test');
    status.value.news = {
      ...newsTest,
      message: newsTest.success 
        ? 'Connected and content validated'
        : newsTest.message
    };

    const checklistTest = await testEndpoint('/api/checklist/test');
    status.value.checklist = {
      ...checklistTest,
      message: checklistTest.success 
        ? 'Connected and content validated'
        : checklistTest.message
    };

    // Test auth services
    status.value.auth = await testEndpoint('/api/auth/test');
    status.value.admin = await testEndpoint('/api/admin/test');

    // Test image upload service
    const imageUploadTest = await testImageUpload();
    status.value.imageUpload = {
      ...imageUploadTest,
      message: imageUploadTest.success 
        ? 'Image upload service operational'
        : imageUploadTest.message
    };

  } catch (error) {
    console.error('System test error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.status-group {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.status-group h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-title {
  font-weight: 600;
}

.status-message {
  font-size: 0.9rem;
}

.service-details {
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.5);
}

.test-data {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #fff;
  border-radius: 4px;
  font-size: 0.9rem;
}

.test-data ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.test-data li {
  margin: 0.25rem 0;
  color: #2c3e50;
}

.status-group {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.status {
  padding: 0.75rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.success {
  background-color: #d4edda;
  color: #155724;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
}

.fa-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>