<template>
  <div class="checklist-container">
    <div class="checklist-header">
      <h2><i class="fas fa-clipboard-check"></i> Preparedness Checklist</h2>
      <div class="progress-indicator">
        <div class="progress-text">{{ completedCount }} of {{ checklist.length }} completed</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
        </div>
      </div>
    </div>

    <div class="checklist-categories">
      <div v-for="(items, category) in groupedChecklist" :key="category" class="category-section">
        <h3>{{ category }}</h3>
        <div class="checklist-items">
          <div v-for="item in items" :key="item.id" class="checklist-item" :class="{ completed: item.completed }">
            <div class="item-content">
              <label :for="item.id" class="item-label">
                <input 
                  type="checkbox" 
                  :id="item.id" 
                  v-model="item.completed"
                  @change="updateProgress(item)"
                >
                <span class="item-text">{{ item.text }}</span>
              </label>
              <button v-if="item.info" @click="showInfo(item)" class="info-btn">
                <i class="fas fa-info-circle"></i>
              </button>
            </div>
            <div v-if="item.showDetails" class="item-details">
              {{ item.info }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="add-item-section">
      <button @click="showAddItemForm = true" class="add-item-btn">
        <i class="fas fa-plus"></i> Add Custom Item
      </button>

      <!-- Add Item Modal -->
      <div v-if="showAddItemForm" class="modal-overlay">
        <div class="modal-content">
          <h3>Add New Checklist Item</h3>
          <form @submit.prevent="addNewItem" class="add-item-form">
            <div class="form-group">
              <label for="itemText">Item Description</label>
              <input 
                type="text" 
                id="itemText" 
                v-model="newItem.text" 
                required
                placeholder="Enter item description"
              >
            </div>
            <div class="form-group">
              <label for="itemCategory">Category</label>
              <select id="itemCategory" v-model="newItem.category" required>
                <option value="">Select a category</option>
                <option v-for="category in availableCategories" 
                        :key="category" 
                        :value="category">
                  {{ category }}
                </option>
                <option value="custom">Add New Category</option>
              </select>
            </div>
            <div v-if="newItem.category === 'custom'" class="form-group">
              <label for="newCategory">New Category Name</label>
              <input 
                type="text" 
                id="newCategory" 
                v-model="newItem.newCategory"
                required
                placeholder="Enter new category name"
              >
            </div>
            <div class="form-group">
              <label for="itemInfo">Additional Information (Optional)</label>
              <textarea 
                id="itemInfo" 
                v-model="newItem.info"
                placeholder="Enter additional details or instructions"
              ></textarea>
            </div>
            <div class="modal-actions">
              <button type="submit" class="save-btn">Save Item</button>
              <button type="button" @click="showAddItemForm = false" class="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { checklistService } from '../services/checklistService';
import { useNotificationStore } from '../stores/notification';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const checkAuth = () => {
  if (!authStore.isAuthenticated) {
    notificationStore.error('Please log in to continue');
    router.push('/login');
    return false;
  }
  return true;
};

const checklist = ref([
  {
    id: 'water',
    text: 'Store 1 gallon of water per person per day (3-day supply)',
    completed: false,
    category: 'Essential Supplies',
    info: 'Include water for drinking and sanitation. Store in clean plastic containers.'
  },
  {
    id: 'food',
    text: 'Non-perishable food (3-day supply)',
    completed: false,
    category: 'Essential Supplies',
    info: 'Select foods that require no refrigeration, preparation, or cooking and little or no water.'
  },
  {
    id: 'firstaid',
    text: 'First aid kit',
    completed: false,
    category: 'Medical',
    info: 'Include prescription medications, bandages, antiseptic wipes, and basic medical supplies.'
  },
  {
    id: 'radio',
    text: 'Battery-powered or hand-crank radio',
    completed: false,
    category: 'Communication',
    info: 'NOAA Weather Radio with tone alert recommended.'
  },
  {
    id: 'flashlight',
    text: 'Flashlight and extra batteries',
    completed: false,
    category: 'Essential Supplies',
    info: 'LED flashlights are more energy-efficient.'
  },
  {
    id: 'documents',
    text: 'Important documents in waterproof container',
    completed: false,
    category: 'Documents',
    info: 'Include identification, insurance policies, and bank records.'
  },
  {
    id: 'contact-list',
    text: 'Emergency contact list',
    completed: false,
    category: 'Communication',
    info: 'Include both local and out-of-area contacts.'
  },
  {
    id: 'meeting-place',
    text: 'Establish family meeting places',
    completed: false,
    category: 'Planning',
    info: 'Choose locations both inside and outside your neighborhood.'
  }
]);

const groupedChecklist = computed(() => {
  return checklist.value.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
});

const completedCount = computed(() => {
  return checklist.value.filter(item => item.completed).length;
});

const progressPercentage = computed(() => {
  if (!checklist.value.length) return 0;
  return Math.round((completedCount.value / checklist.value.length) * 100);
});

watch(progressPercentage, (newProgress) => {
  try {
    localStorage.setItem('checklistProgress', newProgress.toString());
  } catch (error) {
    console.error('Error saving progress:', error);
  }
});

const showInfo = (item) => {
  item.showDetails = !item.showDetails;
};

const updateProgress = async (item) => {
  try {
    if (!checkAuth()) return;
    
    console.log('Updating progress for item:', item);
    const updateResponse = await checklistService.updateProgress({
      id: item.id,
      completed: item.completed
    });
    
    if (!updateResponse?.success) {
      throw new Error(updateResponse?.message || 'Failed to update progress');
    }
    
    notificationStore.success('Progress saved successfully');
  } catch (error) {
    console.error('Error saving progress:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    // Revert the checkbox state if the save failed
    item.completed = !item.completed;
    notificationStore.error(error.message || 'Failed to save progress');
  }
};

const showAddItemForm = ref(false);
const newItem = ref({
  text: '',
  category: '',
  newCategory: '',
  info: ''
});

const availableCategories = computed(() => {
  const categories = new Set(checklist.value.map(item => item.category));
  return Array.from(categories);
});

const addNewItem = async () => {
  try {
    const itemCategory = newItem.value.category === 'custom' 
      ? newItem.value.newCategory 
      : newItem.value.category;

    const item = {
      id: `custom-${Date.now()}`,
      text: newItem.value.text,
      category: itemCategory,
      info: newItem.value.info || null,
      completed: false
    };

    // Add item to checklist first
    checklist.value.push(item);
    
    // Try to save the new item
    try {
      await updateProgress(item);
    } catch (error) {
      // If saving fails, remove the item from the checklist
      checklist.value = checklist.value.filter(i => i.id !== item.id);
      throw error;
    }
    
    // Reset form
    newItem.value = {
      text: '',
      category: '',
      newCategory: '',
      info: ''
    };
    showAddItemForm.value = false;
    
    notificationStore.success('Item added successfully');
  } catch (error) {
    console.error('Error adding item:', error);
    notificationStore.error('Failed to add item');
  }
};

onMounted(async () => {
  try {
    if (!checkAuth()) return;
    
    console.log('Loading checklist progress...');
    const savedProgress = await checklistService.loadProgress();
    console.log('Received progress:', savedProgress);
    
    if (savedProgress?.success && Array.isArray(savedProgress.items)) {
      checklist.value = checklist.value.map(item => {
        const savedItem = savedProgress.items.find(saved => saved.id === item.id);
        console.log(`Mapping item ${item.id}:`, savedItem);
        return {
          ...item,
          completed: savedItem?.completed ?? false
        };
      });
    } else {
      console.log('No valid saved progress found:', savedProgress);
    }
  } catch (error) {
    console.error('Error loading progress:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    notificationStore.error('Failed to load checklist progress');
  }
});
</script>

<style scoped>
.checklist-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
}

.checklist-header {
  margin-bottom: 2rem;
}

.checklist-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.progress-indicator {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.progress-text {
  margin-bottom: 0.5rem;
  color: #666;
}

.progress-bar {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #42b983;
  transition: width 0.3s ease;
}

.category-section {
  margin-bottom: 2rem;
}

.category-section h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checklist-item {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.checklist-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
}

.item-text {
  color: #2c3e50;
}

.completed .item-text {
  text-decoration: line-through;
  color: #6c757d;
}

.info-btn {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.3s ease;
}

.info-btn:hover {
  color: #42b983;
}

.item-details {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #6c757d;
}

@media (max-width: 768px) {
  .checklist-container {
    padding: 0.5rem;
  }
  
  .checklist-item {
    padding: 0.75rem;
  }
}

.add-item-section {
  margin-top: 2rem;
  text-align: center;
}

.add-item-btn {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.add-item-btn:hover {
  background-color: #3aa876;
  transform: translateY(-2px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.add-item-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #2c3e50;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.save-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.save-btn {
  background-color: #42b983;
  color: white;
  border: none;
}

.save-btn:hover {
  background-color: #3aa876;
}

.cancel-btn {
  background-color: #f8f9fa;
  color: #2c3e50;
  border: 1px solid #e9ecef;
}

.cancel-btn:hover {
  background-color: #e9ecef;
}
</style> 