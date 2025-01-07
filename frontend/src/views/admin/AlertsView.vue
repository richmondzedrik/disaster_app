<template>
    <div class="alerts-view">
      <div class="header">
        <div class="header-content">
          <h1>Alert Management</h1>
          <p>Create and manage system-wide alerts and notifications</p>   
        </div>
        <button @click="showCreateModal = true" class="create-btn">
          <i class="fas fa-plus"></i>
          Create Alert
        </button>
      </div>
  
      <div class="table-container" :class="{ 'loading': loading }">
        <div v-if="loading" class="loading-overlay">
          <i class="fas fa-spinner fa-spin"></i>
          Loading alerts...
        </div>
        <table>
          <thead>
            <tr>
              <th>Message</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Expiry</th>
              <th>Public</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alert in processedAlerts" :key="alert.id">
              <td class="message-cell">{{ alert.message }}</td>
              <td>
                <span :class="['type-badge', alert.type]">
                  {{ alert.type.toUpperCase() }}
                </span>
              </td>
              <td>
                <span :class="['priority-badge', `priority-${alert.priority}`]">
                  {{ formatPriority(alert.priority) }}
                </span>
              </td>
              <td>
                <button 
                  @click="toggleAlertStatus(alert)"
                  :class="['status-badge', 
                          alert.status === 'Expired' ? 'expired' : 
                          (alert.is_active ? 'active' : 'inactive')]"
                  :disabled="alert.status === 'Expired'"
                >
                  {{ alert.status }}
                </button>
              </td>
              <td>{{ formatDate(alert.expiry_date) }}</td>
              <td>
                <span :class="['public-badge', alert.is_public ? 'public' : 'private']">
                  {{ alert.is_public ? 'Public' : 'Private' }}
                </span>
              </td>
              <td class="action-buttons">
                <button @click="deleteAlert(alert.id)" class="action-btn delete-btn">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Alert Modal -->
      <div v-if="showCreateModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Create New Alert</h2>
            <button @click="showCreateModal = false" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <form @submit.prevent="createNewAlert">
            <div class="form-group">
              <label>Message</label>
              <textarea 
                v-model="newAlert.message" 
                required
                class="form-input"
                placeholder="Enter alert message"
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Type</label>
                <select v-model="newAlert.type" required class="form-input">
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="danger">Danger</option>
                </select>
              </div>
              <div class="form-group">
                <label>Priority</label>
                <select v-model="newAlert.priority" required class="form-input">
                  <option value="0">Low</option>
                  <option value="1">Medium</option>
                  <option value="2">High</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Expiry Date</label>
                <input 
                  type="datetime-local" 
                  v-model="newAlert.expiryDate"
                  class="form-input"
                  :min="minDateTime"
                  required
                >
              </div>
              <div class="form-group">
                <label>Public</label>
                <select v-model="newAlert.isPublic" required class="form-input">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" @click="showCreateModal = false" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                Create Alert
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch, computed } from 'vue';
  import { useAlertStore } from '@/stores/alert';
  import { useNotificationStore } from '@/stores/notification';
  import alertService from '@/services/alertService';
  
  const alertStore = useAlertStore();
  const notificationStore = useNotificationStore();
  const showCreateModal = ref(false);
  const loading = ref(false);
  const alerts = ref([]);
  
  const newAlert = ref({
    message: '',
    type: 'info',
    priority: '0',
    expiryDate: '',
    isPublic: true
  });
  
  const formatDate = (date) => {
    if (!date) return 'No expiry';
    const expiryDate = new Date(date);
    if (isNaN(expiryDate.getTime())) return 'Invalid date';
    
    return expiryDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const formatPriority = (priority) => {
    const priorities = {
      0: 'Low',
      1: 'Medium', 
      2: 'High'
    };
    return priorities[priority] || priority;
  };
  
  const minDateTime = computed(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  
  const createNewAlert = async () => {
    try {
      const selectedDate = new Date(newAlert.value.expiryDate);
      const now = new Date();

      if (selectedDate < now) {
        notificationStore.error('Expiry date must be in the future');
        return;
      }

      const alertData = {
        message: newAlert.value.message,
        type: newAlert.value.type,
        priority: parseInt(newAlert.value.priority),
        expiryDate: newAlert.value.expiryDate ? new Date(newAlert.value.expiryDate).toISOString() : null,
        is_public: newAlert.value.isPublic === 'true'
      };

      const response = await alertStore.createAlert(alertData);
      
      if (response) {
        showCreateModal.value = false;
        resetForm();
        const alertsResponse = await alertStore.fetchAlerts();
        if (alertsResponse?.success) {
          alerts.value = alertsResponse.alerts || [];
        }
      }
    } catch (error) {
      console.error('Create alert error:', error);
    }
  };
  
  const toggleAlertStatus = async (alert) => {
    try {
      const response = await alertStore.toggleAlertStatus(alert.id, !alert.is_active);
      if (response?.success) {
        await alertStore.fetchAlerts();
        alerts.value = alertStore.alerts;
      }
    } catch (error) {
      console.error('Error toggling alert status:', error);
      notificationStore.error('Failed to update alert status');
    }
  };
  
  const deleteAlert = async (alertId) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    try {
      const response = await alertStore.deleteAlert(alertId);
      if (response?.success) {
        await alertStore.fetchAlerts();
        alerts.value = alertStore.alerts;
        notificationStore.success('Alert deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      notificationStore.error('Failed to delete alert');
    }
  };
  
  const resetForm = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    
    newAlert.value = {
      message: '',
      type: 'info',
      priority: '0',
      expiryDate: now.toISOString().slice(0, 16),
      isPublic: true
    };
  };
  
  watch(() => alertStore.alerts, (newAlerts) => {
    if (newAlerts && Array.isArray(newAlerts)) {
      alerts.value = newAlerts;
    }
  }, { deep: true });  
  
  // In the script setup section, update the onMounted function:

onMounted(async () => {
  try {
    loading.value = true;
    const response = await alertStore.fetchAlerts();
    
    if (response?.success) {
      alerts.value = response.alerts.map(alert => ({
        ...alert,
        is_active: Boolean(alert.is_active),
        is_public: Boolean(alert.is_public)
      }));
    } else {
      throw new Error(response?.message || 'Failed to load alerts');
    }
  } catch (error) {
    console.error('Error loading alerts:', error);
    notificationStore.error(error.message || 'Failed to load alerts');
    alerts.value = [];
  } finally {
    loading.value = false;
  }
});

const processedAlerts = computed(() => {
  return alerts.value.map(alert => {
    const now = new Date();
    const expiryDate = alert.expiry_date ? new Date(alert.expiry_date) : null;
    const isExpired = expiryDate && expiryDate < now;
    
    return {
      ...alert,
      is_active: isExpired ? false : alert.is_active,
      status: isExpired ? 'Expired' : (alert.is_active ? 'Active' : 'Inactive')
    };
  });
});

  </script>
  
  <style scoped>
  .alerts-view {
    padding: 2rem;
    background: #f8fafc;
    min-height: 100vh;
  }
  
  .header {
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    padding: 3rem 2rem;
    border-radius: 16px;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  }
  
  .header-content {
    color: white;
  }
  
  .header-content h1 {
    font-size: clamp(2rem, 4vw, 2.5rem);
    font-weight: 800;
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
  }
  
  .create-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    background: white;
    color: #00D1D1;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .create-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 209, 209, 0.3);
  }
  
  .table-container {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
    overflow: hidden;
    border: 1px solid rgba(0, 173, 173, 0.1);
    transition: all 0.3s ease;
  }
  
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }
  
  th {
    background: linear-gradient(to right, #f8fafc, #ffffff);
    padding: 1.25rem 1.5rem;
    font-weight: 600;
    color: #005C5C;
    text-align: left;
    border-bottom: 2px solid rgba(0, 173, 173, 0.1);
  }
  
  td {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(0, 173, 173, 0.1);
    color: #1f2937;
  }
  
  tr:hover {
    background: linear-gradient(135deg, rgba(0, 209, 209, 0.02) 0%, rgba(64, 82, 214, 0.02) 100%);
  }
  
  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 0.5rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .delete-btn {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }
  
  .delete-btn:hover {
    background: #dc2626;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
    color: white;
    border: none;
  }
  
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 209, 209, 0.3);
  }
  
  .type-badge, .priority-badge, .status-badge, .public-badge {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .type-badge.info { 
    background: rgba(0, 209, 209, 0.1);
    color: #00D1D1;
  }
  
  .type-badge.warning { 
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }
  
  .type-badge.danger { 
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }
  
  .priority-badge {
    padding: 0.5rem 1rem;
    border-radius: 8px;
  }
  
  .priority-badge.priority-0 { background: #e8f5e9; color: #1b5e20; }
  .priority-badge.priority-1 { background: #fff3e0; color: #e65100; }
  .priority-badge.priority-2 { background: #ffebee; color: #b71c1c; }
  
  .status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
  }
  
  .status-badge.active { background: #e8f5e9; color: #1b5e20; }
  .status-badge.inactive { background: #f5f5f5; color: #616161; }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 92, 92, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 16px;
    width: 90%;
    max-width: 600px;
    box-shadow: 0 8px 32px rgba(0, 92, 92, 0.15);
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  @media (max-width: 768px) {
    .table-container {
      overflow-x: auto;
    }
  
    td, th {
      padding: 1rem;
    }
  
    .action-buttons {
      flex-wrap: wrap;
    }
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(0, 173, 173, 0.1);
  }
  
  .modal-header h2 {
    color: #005C5C;
    font-size: 1.75rem;
    font-weight: 700;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 1.25rem;
    transition: all 0.3s ease;
  }
  
  .close-btn:hover {
    color: #dc2626;
    transform: rotate(90deg);
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid rgba(0, 173, 173, 0.2);
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: white;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #00D1D1;
    box-shadow: 0 0 0 3px rgba(0, 209, 209, 0.1);
  }
  
  textarea.form-input {
    min-height: 100px;
    resize: vertical;
  }
  
  .btn-secondary {
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }
  
  .btn-secondary:hover {
    background: #e2e8f0;
    transform: translateY(-2px);
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
    gap: 1rem;
    color: #00D1D1;
    font-weight: 600;
  }
  
  .loading-overlay i {
    font-size: 2rem;
  }
  
  .table-container {
    position: relative;
  }
  
  .status-badge.expired { 
    background: #f3f4f6; 
    color: #9ca3af;
    cursor: not-allowed;
  }
  </style>  