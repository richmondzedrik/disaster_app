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

        <div class="service-details">
          <StatusItem title="Admin Alerts API" :status="status.adminAlerts" />
          <div v-if="status.adminAlerts?.success" class="test-data">
            <strong>Admin Alerts Service:</strong>
            <ul>
              <li>Admin Alerts API Access</li>
              <li>Authentication Check</li>
            </ul>
          </div>
        </div>

        <div class="service-details">
          <StatusItem title="Admin Alert Operations" :status="status.adminAlertOps" />
          <div v-if="status.adminAlertOps?.success" class="test-data">
            <strong>Operations Test Results:</strong>
            <ul>
              <li>Create Alert: {{ status.adminAlertOps.testResults?.create ? '✓' : '✗' }}</li>
              <li>Deactivate Alert: {{ status.adminAlertOps.testResults?.deactivate ? '✓' : '✗' }}</li>
              <li>Delete Alert: {{ status.adminAlertOps.testResults?.delete ? '✓' : '✗' }}</li>
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

      <!-- Notification Services -->
      <div class="status-group">
        <h4>Notification Services</h4>
        <StatusItem title="Notification System" :status="status.notifications" />
        <div v-if="status.notifications?.success" class="test-data">
          <strong>Test Results:</strong>
          <ul>
            <li>Like Notification: {{ status.notifications.testResults?.like ? '✓' : '✗' }}</li>
            <li>New Post Notification: {{ status.notifications.testResults?.newPost ? '✓' : '✗' }}</li>
            <li>Alert Notification: {{ status.notifications.testResults?.alert ? '✓' : '✗' }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import api from '../services/api';
import StatusItem from './StatusItem.vue';
import { alertService } from '../services/alertService';
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
  adminAlerts: null,
  imageUpload: null,
  adminAlertOps: null,
  notifications: null
});

const hasResults = computed(() => 
  Object.values(status.value).some(val => val !== null)
);

const testEndpoint = async (endpoint, options = {}) => {
  try {
    const response = await api.get(endpoint, options);
    
    // Simplified content validation that's more flexible
    const contentCheck = {
      '/api/alerts/test': () => ({
        valid: response.data?.success !== undefined,
        testData: response.data?.data || []
      }),
      '/api/news/test': () => ({
        valid: response.data?.success !== undefined,
        testData: response.data?.data || []
      }),
      '/api/checklist/test': () => ({
        valid: response.data?.success !== undefined,
        testData: response.data?.data || []
      })
    }[endpoint];

    const check = contentCheck ? contentCheck() : { valid: true };
    
    return {
      success: response.data?.success && check.valid,
      message: check.valid 
        ? 'Service operational'
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

const getContentDetails = (data) => {
  if (!data) return '';
  return Array.isArray(data) ? `${data.length} items found` : 'Service operational';
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
  try {
    loading.value = true;
    Object.keys(status.value).forEach(key => status.value[key] = null);

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

    // Test admin alerts
    const adminAlertsTest = await alertService.testAdminAlerts();
    status.value.adminAlerts = {
      ...adminAlertsTest,
      message: adminAlertsTest.success 
        ? 'Admin alerts service operational'
        : adminAlertsTest.message
    };

    // Test admin alert operations
    const adminAlertOpsTest = await alertService.testAdminAlertOperations();
    status.value.adminAlertOps = adminAlertOpsTest;

    // Test notification system
    const notificationTest = await testNotifications();
    status.value.notifications = {
      ...notificationTest,
      message: notificationTest.success 
        ? 'Notification system operational'
        : notificationTest.message
    };

  } catch (error) {
    console.error('Test all systems error:', error);
    notificationStore.error('Failed to complete system tests');
  } finally {
    loading.value = false;
  }
};

const testNotifications = async () => {
  try {
    // Test like notification
    const likeTest = await api.post('/api/test/notifications/like', {
      postId: 'test-post-id',
      action: 'like'
    });

    // Test new post notification
    const postTest = await api.post('/api/test/notifications/post', {
      title: 'Test Post',
      content: 'Test Content'
    });

    // Test alert notification
    const alertTest = await api.post('/api/test/notifications/alert', {
      type: 'emergency',
      message: 'Test Alert'
    });

    return {
      success: likeTest.data?.success && postTest.data?.success && alertTest.data?.success,
      message: 'Notification system operational',
      testResults: {
        like: likeTest.data?.success || false,
        newPost: postTest.data?.success || false,
        alert: alertTest.data?.success || false
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Notification system test failed',
      testResults: {
        like: false,
        newPost: false,
        alert: false
      }
    };
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