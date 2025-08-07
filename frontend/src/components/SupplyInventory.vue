<template>
  <div class="supply-inventory">
    <h2>Emergency Supply Inventory</h2>
    
    <div class="inventory-actions">
      <button @click="showAddSupplyForm = true" class="primary-btn">
        <i class="fas fa-plus"></i> Add Supply
      </button>
      <button @click="checkExpirations" class="secondary-btn">
        <i class="fas fa-calendar-check"></i> Check Expirations
      </button>
    </div>
    
    <div class="inventory-stats">
      <div class="stat-card">
        <h3>{{ totalItems }}</h3>
        <p>Total Items</p>
      </div>
      <div class="stat-card warning">
        <h3>{{ expiringItems }}</h3>
        <p>Expiring Soon</p>
      </div>
      <div class="stat-card danger">
        <h3>{{ expiredItems }}</h3>
        <p>Expired</p>
      </div>
    </div>
    
    <div class="inventory-filters">
      <select v-model="categoryFilter">
        <option value="">All Categories</option>
        <option v-for="category in categories" :key="category">{{ category }}</option>
      </select>
      <div class="search-bar">
        <input type="text" v-model="searchQuery" placeholder="Search supplies...">
      </div>
    </div>
    
    <div class="inventory-table">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Expiration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredItems" :key="item.id" :class="{ 'expired': isExpired(item), 'expiring-soon': isExpiringSoon(item) }">
            <td>{{ item.name }}</td>
            <td>{{ item.category }}</td>
            <td>
              <button @click="decrementQuantity(item)" class="qty-btn">-</button>
              {{ item.quantity }}
              <button @click="incrementQuantity(item)" class="qty-btn">+</button>
            </td>
            <td>{{ formatDate(item.expirationDate) }}</td>
            <td>
              <button @click="editItem(item)" class="icon-btn"><i class="fas fa-edit"></i></button>
              <button @click="deleteItem(item.id)" class="icon-btn delete"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Add Supply Modal -->
    <div v-if="showAddSupplyForm" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ editingItem ? 'Edit Supply Item' : 'Add New Supply' }}</h3>
        <form @submit.prevent="saveItem" class="add-supply-form">
          <div class="form-group">
            <label for="itemName">Item Name</label>
            <input type="text" id="itemName" v-model="currentItem.name" required>
          </div>
          
          <div class="form-group">
            <label for="itemCategory">Category</label>
            <select id="itemCategory" v-model="currentItem.category" required>
              <option value="">Select a category</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
              <option value="custom">Add New Category</option>
            </select>
          </div>
          
          <div v-if="currentItem.category === 'custom'" class="form-group">
            <label for="newCategory">New Category</label>
            <input type="text" id="newCategory" v-model="currentItem.newCategory" required>
          </div>
          
          <div class="form-group">
            <label for="itemQuantity">Quantity</label>
            <input type="number" id="itemQuantity" v-model="currentItem.quantity" min="1" required>
          </div>
          
          <div class="form-group">
            <label for="itemExpiration">Expiration Date (if applicable)</label>
            <input type="date" id="itemExpiration" v-model="currentItem.expirationDate">
          </div>
          
          <div class="form-group">
            <label for="itemNotes">Notes</label>
            <textarea id="itemNotes" v-model="currentItem.notes"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="showAddSupplyForm = false" class="cancel-btn">Cancel</button>
            <button type="submit" class="save-btn">{{ editingItem ? 'Update' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
// Implementation details
</script> 