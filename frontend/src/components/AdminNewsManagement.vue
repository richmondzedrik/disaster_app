<template>
    <div class="admin-news">
      <h1>News Management</h1>
      <div class="news-controls">
        <button @click="createPost" class="create-btn">
          <i class="fas fa-plus"></i> Create News Post
        </button>
      </div>
  
      <div class="news-grid">
        <!-- News posts will go here -->
        <div v-if="loading" class="loading">
          Loading news posts...
        </div>
        <div v-else-if="posts.length === 0" class="no-posts">
          No news posts found
        </div>
        <div v-else class="posts-container">
            <div v-for="post in posts" :key="post.id" class="post-item">
                <div class="post-header">
                    <h3>{{ post.title }}</h3>
                    <span class="post-date">Created: {{ new Date(post.created_at).toLocaleString() }}</span>
                </div>
                <div class="post-meta">
                    <span class="author">By: {{ post.author || 'Unknown Author' }}</span>
                    <span class="comments">Comments: {{ post.comment_count || 0 }}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useNotificationStore } from '../stores/notification';
  import { useAuthStore } from '../stores/auth';
  import { newsService } from '../services/newsService';
  
  const notificationStore = useNotificationStore();
  const authStore = useAuthStore();
  const loading = ref(false);
  const posts = ref([]);
  
  const loadPosts = async () => {
    try {
      loading.value = true;
      const response = await newsService.getAdminPosts();
      if (response.success) {
        posts.value = response.posts;
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      notificationStore.error('Failed to load news posts');
    } finally {
      loading.value = false;
    }
  };
  
  const createPost = () => {
    // Implement post creation logic
    console.log('Create post clicked');
  };
  
  onMounted(async () => {
    if (!authStore.isAdmin) {
      notificationStore.error('Admin access required');
      return;
    }
    await loadPosts();
  });
  </script>
  
  <style scoped>
  .admin-news {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    color: #2c3e50;
    margin-bottom: 2rem;
  }
  
  .news-controls {
    margin-bottom: 2rem;
  }
  
  .create-btn {
    background-color: #4CAF50;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .create-btn:hover {
    background-color: #45a049;
  }
  
  .loading, .no-posts {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
  
  .post-item {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
  }
  
  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .post-date {
    color: #666;
    font-size: 0.9rem;
  }
  
  .post-meta {
    display: flex;
    gap: 1rem;
    color: #666;
    font-size: 0.9rem;
  }
  </style>