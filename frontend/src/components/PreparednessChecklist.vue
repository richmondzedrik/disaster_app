<template>
  <div class="checklist-container">
    <!-- Skeleton Loading -->
    <div v-if="initialLoading" class="checklist-skeleton">
      <div class="skeleton-header">
        <h2 class="skeleton-title"></h2>
        <div class="skeleton-progress">
          <div class="skeleton-text"></div>
          <div class="skeleton-bar"></div>
        </div>
      </div>

      <div class="skeleton-categories">
        <div v-for="i in 3" :key="i" class="skeleton-category">
          <div class="skeleton-category-title"></div>
          <div v-for="j in 3" :key="j" class="skeleton-item">
            <div class="skeleton-checkbox"></div>
            <div class="skeleton-text"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actual Content -->
    <div v-else>
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
                <div class="item-actions">
                  <button v-if="item.info" @click="showInfo(item)" class="info-btn">
                    <i class="fas fa-info-circle"></i>
                  </button>
                  <button v-if="item.isCustom" @click="editItem(item)" class="edit-btn">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button v-if="item.isCustom" @click="deleteItem(item)" class="delete-btn">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
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

      <!-- Edit Item Modal -->
      <div v-if="showEditForm && editingItem" class="modal-overlay">
        <div class="modal-content">
          <h3>Edit Checklist Item</h3>
          <form @submit.prevent="saveEdit" class="edit-item-form">
            <div class="form-group">
              <label for="editItemText">Item Description</label>
              <input 
                type="text" 
                id="editItemText" 
                v-model="editingItem.text" 
                required
                placeholder="Enter item description"
              >
            </div>
            <div class="form-group">
              <label for="editItemCategory">Category</label>
              <input 
                type="text" 
                id="editItemCategory" 
                v-model="editingItem.category"
                required
                placeholder="Enter category"
              >
            </div>
            <div class="form-group">
              <label for="editItemInfo">Additional Information (Optional)</label>
              <textarea 
                id="editItemInfo" 
                v-model="editingItem.info"
                placeholder="Enter additional details or instructions"
              ></textarea>
            </div>
            <div class="modal-actions">
              <button type="submit" class="save-btn">Save Changes</button>
              <button type="button" @click="showEditForm = false" class="cancel-btn">Cancel</button>
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

const checklist = ref([]);

const processedChecklist = computed(() => {
  return checklist.value.map(item => ({
    ...item,
    isCustom: typeof item.isCustom === 'boolean' ? item.isCustom : false
  }));
});

const groupedChecklist = computed(() => {
  return processedChecklist.value.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
});

const completedCount = computed(() => {
  return processedChecklist.value.filter(item => item.completed).length;
});

const progressPercentage = computed(() => {
  if (!processedChecklist.value.length) return 0;
  return Math.round((completedCount.value / processedChecklist.value.length) * 100);
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
    
    const originalState = item.completed;
    
    try {
      const updateResponse = await checklistService.updateProgress({
        id: item.id,
        completed: item.completed
      });
      
      if (!updateResponse?.success) {
        throw new Error(updateResponse?.message || 'Failed to update progress');
      }
      
      const index = checklist.value.findIndex(i => i.id === item.id);
      if (index !== -1) {
        checklist.value[index].completed = item.completed;
      }
      
      notificationStore.success('Progress saved successfully'); 
    } catch (error) {
      item.completed = originalState;
      throw error;
    }
  } catch (error) {
    console.error('Error saving progress:', error);
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
  const categories = new Set(processedChecklist.value.map(item => item.category));
  return Array.from(categories);
});

const addNewItem = async () => {
  try {
    if (!checkAuth()) return;

    const newItemText = newItem.value.text.trim();
    const newItemCategory = newItem.value.category === 'custom' 
      ? newItem.value.newCategory.trim() 
      : newItem.value.category.trim();

    // Normalize text for comparison
    const normalizedNewText = newItemText.toLowerCase().replace(/\s+/g, ' ');

    // Check for duplicates using the original checklist
    const isDuplicate = checklist.value.some(item => {
      const normalizedExistingText = item.text.toLowerCase().replace(/\s+/g, ' ');
      
      if (normalizedExistingText === normalizedNewText) {
        return true;
      }
      
      const similarity = calculateStringSimilarity(normalizedExistingText, normalizedNewText);
      return similarity > 0.8;
    });
 
    if (isDuplicate) {
      notificationStore.error('This item already exists in the checklist');
      return;
    }

    const item = {
      id: `custom-${Date.now()}`,
      text: newItemText,
      category: newItemCategory,
      info: newItem.value.info?.trim() || null,
      completed: false,
      isCustom: true
    };

    // Save the new item
    const saveResponse = await checklistService.addCustomItem(item);
    
    if (!saveResponse?.success) {
      throw new Error(saveResponse?.message || 'Failed to save custom item');
    }

    // Add to original checklist array
    checklist.value.push(item);
    
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
    notificationStore.error(error.message || 'Failed to add item');
  }
};

// Add this helper function for string similarity checking
const calculateStringSimilarity = (str1, str2) => {
  if (str1.length < 2 || str2.length < 2) return 0;

  const createNGrams = (text, n = 2) => {
    const ngrams = [];
    for (let i = 0; i < text.length - n + 1; i++) {
      ngrams.push(text.slice(i, i + n));
    }
    return new Set(ngrams);
  };

  const ngrams1 = createNGrams(str1);
  const ngrams2 = createNGrams(str2);
  
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
  const union = new Set([...ngrams1, ...ngrams2]);
  
  return intersection.size / union.size;
};

onMounted(async () => {
  try {
    if (!checkAuth()) return;
    
    console.log('Loading checklist progress...');
    const savedProgress = await checklistService.loadProgress();
    
    if (savedProgress?.success && Array.isArray(savedProgress.items)) {
      console.log('Progress loaded successfully:', savedProgress.items);
      checklist.value = savedProgress.items;
    } else {
      console.warn('Invalid progress data:', savedProgress);
      throw new Error('Invalid progress data received');
    }
  } catch (error) {
    console.error('Error loading progress:', {
      message: error.message,
      response: error.response?.data
    });
    
    if (error.message.includes('Session expired')) {
      const authStore = useAuthStore();
      await authStore.logout();
      router.push('/login');
      return; 
    }
    
    notificationStore.error(
      error.message === 'Authentication required' 
        ? 'Please login to view your checklist' 
        : 'Failed to load checklist progress. Please try refreshing the page.'
    );
  } finally {
    initialLoading.value = false;
  }
});

const showEditForm = ref(false);
const editingItem = ref(null);

const editItem = (item) => {
  editingItem.value = { ...item };
  showEditForm.value = true;
};

const deleteItem = async (item) => {
  if (!confirm('Are you sure you want to delete this item?')) return;
  
  try {    
    const response = await checklistService.deleteCustomItem(item.id);
    if (response.success) {
      checklist.value = checklist.value.filter(i => i.id !== item.id);
      notificationStore.success('Item deleted successfully');
    } 
  } catch (error) { 
    console.error('Error deleting item:', error);
    notificationStore.error(error.message || 'Failed to delete item');
  }
};

const saveEdit = async () => {
  try {
    if (!editingItem.value) return;

    const response = await checklistService.updateCustomItem(
      editingItem.value.id,
      editingItem.value
    );

    if (response.success) {
      const index = checklist.value.findIndex(item => item.id === editingItem.value.id);
      if (index !== -1) {
        checklist.value[index] = { ...editingItem.value };
      }
      showEditForm.value = false;
      editingItem.value = null;
      notificationStore.success('Item updated successfully');
    }
  } catch (error) {
    console.error('Error updating item:', error);
    notificationStore.error(error.message || 'Failed to update item');
  }
};

const initialLoading = ref(true);
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

.item-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.edit-btn,
.delete-btn,
.info-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.3s ease;
}

.edit-btn {
  color: #4a9eff;
}

.delete-btn {
  color: #ff4a4a;
}

.info-btn {
  color: #6c757d;
}

.edit-btn:hover {
  color: #2384ff;
}

.delete-btn:hover {
  color: #ff2424;
}

.info-btn:hover {
  color: #42b983;
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

.checklist-skeleton {
  padding: 1rem;
}

.skeleton-header {
  margin-bottom: 2rem;
}

.skeleton-title {
  height: 32px;
  width: 300px;
  background: #f0f0f0;
  border-radius: 6px;
  margin-bottom: 1rem;
  animation: pulse 1.5s infinite;
}

.skeleton-progress {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.skeleton-text {
  height: 20px;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  animation: pulse 1.5s infinite;
}

.skeleton-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

.skeleton-categories {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.skeleton-category {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.skeleton-category-title {
  height: 24px;
  width: 200px;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 1rem;
  animation: pulse 1.5s infinite;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.skeleton-checkbox {
  height: 20px;
  width: 20px;
  background: #f0f0f0;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

.skeleton-text {
  height: 20px;
  width: 80%;
  background: #f0f0f0;
  border-radius: 4px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.6;
  }
}
</style>   