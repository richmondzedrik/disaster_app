<template>
    <div class="admin-news">
      <h1>News Management</h1>
      <div class="news-controls">
        <button @click="showCreateModal = true" class="create-btn">
          <i class="fas fa-plus"></i> Create News Post
        </button>
      </div>

      <!-- Create Post Modal -->
      <div v-if="showCreateModal" class="modal-overlay">
        <div class="modal-content">
          <h2>Create News Post</h2>
          <form @submit.prevent="createPost">
            <div class="form-group">
              <label for="title">Title</label>
              <input
                type="text"
                id="title"
                v-model="postForm.title"
                required
                maxlength="100"
                placeholder="Enter post title"
              >
            </div>
            <div class="form-group">
              <label for="content">Content</label>
              <textarea
                id="content"
                v-model="postForm.content"
                rows="6"
                required
                maxlength="2000"
                placeholder="Enter post content"
              ></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModal" class="cancel-btn">
                Cancel
              </button>
              <button type="submit" class="submit-btn" :disabled="loading">
                {{ loading ? 'Creating...' : 'Create Post' }}
              </button>
            </div>
          </form>
        </div>
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
  import api from '../services/api';

  const notificationStore = useNotificationStore();
  const authStore = useAuthStore();
  const loading = ref(false);
  const posts = ref([]);
  const showCreateModal = ref(false);
  const postForm = ref({
    title: '',
    content: ''
  });
  
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
  
  const createPost = async () => {
    try {
      loading.value = true;

      // Validate form
      if (!postForm.value.title.trim()) {
        notificationStore.error('Title is required');
        return;
      }

      if (!postForm.value.content.trim()) {
        notificationStore.error('Content is required');
        return;
      }

      console.log('Creating admin post:', postForm.value);

      const response = await api.post('/admin/posts', {
        title: postForm.value.title.trim(),
        content: postForm.value.content.trim()
      });

      if (response.data.success) {
        notificationStore.success('Post created successfully');
        closeModal();
        await loadPosts();
      } else {
        throw new Error(response.data.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      notificationStore.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      loading.value = false;
    }
  };

  const closeModal = () => {
    showCreateModal.value = false;
    postForm.value = {
      title: '',
      content: ''
    };
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

  /* Modal Styles */
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
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #333;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  .form-group textarea {
    resize: vertical;
    min-height: 120px;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }

  .cancel-btn {
    padding: 0.75rem 1.5rem;
    border: 1px solid #ddd;
    background: white;
    color: #666;
    border-radius: 4px;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: #f5f5f5;
  }

  .submit-btn {
    padding: 0.75rem 1.5rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .submit-btn:hover:not(:disabled) {
    background: #45a049;
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  </style>