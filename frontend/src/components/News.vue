<template>
  <div class="news-container">
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
        <span>Loading news...</span>
      </div>
    </div>
    
    <div class="news-content" :class="{ 'blur-content': loading }">
      <div class="news-header">
        <h1>Community News</h1>
        <button 
          v-if="isAuthenticated && (isAdmin || canCreatePost)"
          @click="showPostModal = true" 
          class="create-post-btn"
        >
          <i class="fas fa-plus"></i>
          Create Post
        </button>
      </div>

      <div v-if="isAdmin" class="admin-controls">
        <div class="filter-controls">
          <button 
            v-for="status in ['all', 'pending', 'approved']" 
            :key="status"
            @click="postStatus = status"
            :class="['filter-btn', { active: postStatus === status }]"
          >
            {{ status.charAt(0).toUpperCase() + status.slice(1) }}
          </button>
        </div>
        <div class="post-stats">
          <span class="stat-item">
            <i class="fas fa-clock"></i>
            Pending: {{ posts.filter(p => p.status === 'pending').length }}
          </span>
          <span class="stat-item">
            <i class="fas fa-check-circle"></i>
            Approved: {{ posts.filter(p => p.status === 'approved').length }}
          </span>
        </div>
      </div>

      <!-- News Feed -->
      <div class="news-feed">
        <div v-if="!isAuthenticated" class="guest-notice">
          <div class="notice-content">
            <i class="fas fa-info-circle"></i>
            <p>Sign in to interact with posts and create your own content</p>
            <router-link to="/login" class="login-btn">
              <i class="fas fa-sign-in-alt"></i>
              Sign In
            </router-link>
          </div>
        </div>

        <div v-if="posts.length === 0" class="no-posts">
          <i class="fas fa-newspaper"></i>
          <p>No news posts yet</p>
        </div>
        
        <div v-else v-for="post in filteredPosts" :key="post.id" class="news-card">
          <div class="post-header">
            <div class="author-info">
              <i class="fas fa-user-circle"></i>
              <div>
                <h3>{{ post.author }}</h3>
                <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                <span v-if="post.status === 'pending'" class="pending-badge">
                  Pending Approval
                </span>
              </div>
            </div>
            <div v-if="canEditPost(post)" class="post-actions">
              <button @click="editPost(post)" class="action-btn">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="deletePost(post.id)" class="action-btn delete">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
          
          <div class="post-content">
            <h2>{{ post.title }}</h2>
            <p>{{ post.content }}</p>
            <div v-if="post.image_url" class="post-image">
              <img
                :src="getImageUrl(post.image_url).url"
                :crossorigin="getImageUrl(post.image_url).crossorigin"
                @error="handleImageError($event, post)"
                @load="handleImageLoad($event, post)"
                alt="Post image"
                class="post-img"
              />
            </div>
          </div>
          
          <div class="post-footer">
            <button 
              @click="isAuthenticated ? likePost(post) : handleGuestInteraction('like')"
              class="interaction-btn"
              :class="{ 'disabled': !isAuthenticated, 'active': post.liked }"
            >
              <i :class="['fa-heart', post.liked ? 'fas' : 'far']"></i>
              <span>{{ post.likes || 0 }}</span>
            </button>
            <button 
              @click="isAuthenticated ? toggleComments(post) : handleGuestInteraction('comment')"
              class="interaction-btn"
              :class="{ 'disabled': !isAuthenticated }"
            >
              <i class="fas fa-comment"></i>
              <span>{{ post.commentCount || 0 }}</span>
            </button>
            <button 
              @click="isAuthenticated ? savePost(post) : handleGuestInteraction('save')"
              class="interaction-btn"
              :class="{ 'disabled': !isAuthenticated }"
            >
              <i class="fas fa-bookmark"></i>
            </button>
          </div>

          <div v-if="isAdmin && post.status === 'pending'" class="admin-actions">
            <button @click="approvePost(post.id)" class="approve-btn">
              <i class="fas fa-check"></i>
              Approve
            </button>
            <button @click="rejectPost(post.id)" class="reject-btn">
              <i class="fas fa-times"></i>
              Reject
            </button>
          </div>

          <div v-if="post.showComments" class="comments-section">
            <div class="comment-form">
              <input 
                v-model="post.newComment" 
                placeholder="Write a comment..." 
                @keyup.enter="addComment(post)"
              >
              <button @click="addComment(post)" class="comment-btn">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
            <div class="comments-list">
              <div v-for="comment in post.comments" :key="comment.id" class="comment">
                <div class="comment-header">
                  <div class="comment-author">
                    <i class="fas fa-user-circle"></i>
                    <span>{{ comment.username }}</span>
                  </div>
                  <div class="comment-actions">
                    <span class="comment-date">{{ formatDate(comment.created_at || comment.createdAt) }}</span>
                    <button v-if="isAdmin" @click="deleteComment(post, comment)" class="delete-comment-btn">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div class="comment-content" :class="{ 'deleted': comment.deleted_by }">
                  {{ comment.content }}
                  <div v-if="comment.deleted_by" class="deletion-info">
                    <span class="deletion-reason">Reason: {{ comment.deletion_reason }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPostModal" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ editingPost ? 'Edit Post' : 'Create Post' }}</h2>
        <form @submit.prevent="submitPost">
          <div class="form-group">
            <label for="title">Title</label>
            <input 
              type="text" 
              id="title" 
              v-model="postForm.title" 
              required
            >
          </div>
          <div class="form-group">
            <label for="content">Content</label>
            <textarea 
              id="content" 
              v-model="postForm.content" 
              rows="4" 
              required
            ></textarea>
          </div>
          <div class="form-group">
            <label for="image">Image (optional)</label>
            <div class="image-upload">
              <input 
                type="file" 
                id="image" 
                @change="handleImageUpload"
                accept="image/*"
                class="image-input"
              >
              <div class="upload-preview" v-if="imagePreview">
                <img :src="imagePreview" alt="Preview">
                <button type="button" @click="removeImage" class="remove-image">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" class="submit-btn" :disabled="loading">
              {{ editingPost ? 'Update' : 'Post' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notification';
import { newsService } from '../services/newsService';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const router = useRouter();

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3000';

// State
const loading = ref(false);
const showPostModal = ref(false);
const posts = ref([]);
const editingPost = ref(null);
const postForm = ref({
  title: '',
  content: ''
});
const postStatus = ref('all'); // 'all', 'pending', 'approved'
const imageFile = ref(null);
const imagePreview = ref(null);
const imageLoading = ref(true);
const imageError = ref(false);
const imageLoaded = ref(false);

// Computed
const user = computed(() => authStore.user);
const isAuthenticated = computed(() => authStore.isAuthenticated);
const canInteract = computed(() => {
  return isAuthenticated.value && authStore.user?.verified;
});
const canCreatePost = computed(() => {
  return isAuthenticated.value && (
    authStore.user?.role === 'admin' || 
    (authStore.user?.verified && authStore.user?.status === 'active')
  );
});
const isAdmin = computed(() => user.value?.role === 'admin');
const filteredPosts = computed(() => {
  let filtered = posts.value;
  
  // Always show approved posts for everyone
  if (!isAdmin.value) {
    filtered = filtered.filter(post => post.status === 'approved');
  } else if (postStatus.value !== 'all') {
    filtered = filtered.filter(post => post.status === postStatus.value);
  }
  
  return filtered;
});

const showAddPostModal = ref(false);
const isLoggedIn = computed(() => authStore.isLoggedIn);

const createPost = async (postData) => {
  try {
    loading.value = true;
    const response = await newsService.createPost(postData);
    if (response.success) {
      notificationStore.success('Post created successfully and pending approval');
      showAddPostModal.value = false;
      await loadPosts();
    } else {
      throw new Error(response.message || 'Failed to create post');
    }
  } catch (error) {
    console.error('Error creating post:', error);
    notificationStore.error('Failed to create post');
  } finally {
    loading.value = false;
  }
};

// Methods
const loadPosts = async () => {
    try {
        loading.value = true;
        const response = await newsService.getPublicPosts();
        
        if (response.success) {
            posts.value = response.posts.map(post => ({
                ...post,
                imageLoaded: false,
                imageError: false,
                showComments: false,
                comments: [],
                newComment: '',
                liked: Boolean(post.is_liked),
                likes: parseInt(post.like_count) || 0,
                commentCount: parseInt(post.comment_count) || 0
            }));
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        notificationStore.error('Failed to load posts');
    } finally {
        loading.value = false;
    }
};

const formatDate = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const canEditPost = (post) => {
  return user.value?.id === post.authorId || user.value?.role === 'admin';
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    imageFile.value = file;
    imagePreview.value = URL.createObjectURL(file);
  }
};

const removeImage = () => {
  imageFile.value = null;
  imagePreview.value = null;
  // Reset the file input
  const input = document.getElementById('image');
  if (input) input.value = '';
};

const submitPost = async () => {
  if (!canCreatePost.value) {
    notificationStore.error('You do not have permission to create posts');
    return;
  }

  try {
    loading.value = true;
    const formData = new FormData();
    formData.append('title', postForm.value.title.trim());
    formData.append('content', postForm.value.content.trim());
    
    if (imageFile.value) {
      formData.append('image', imageFile.value);
    }

    const response = await newsService.createPost(formData);
    
    if (response.success) {
      notificationStore.success('Post created successfully and pending approval');
      closeModal();
      await loadPosts();
    } else {
      throw new Error(response.message || 'Failed to create post');
    }
  } catch (err) {
    console.error('Create post error:', err);
    notificationStore.error(err.message || 'Failed to create post');
  } finally {
    loading.value = false;
    imageFile.value = null;
    imagePreview.value = null;
  }
};

const editPost = (post) => {
  editingPost.value = post;
  postForm.value = {
    title: post.title,
    content: post.content
  };
  showPostModal.value = true;
};

const closeModal = () => {
  showPostModal.value = false;
  editingPost.value = null;
  postForm.value = { title: '', content: '' };
};

const deletePost = async (postId) => {
  try {
    loading.value = true;
    await newsService.deletePost(postId);
    notificationStore.success('Post deleted successfully');
    loadPosts();
  } catch (error) {
    console.error('Delete post error:', error);
    notificationStore.error('Failed to delete post');
  } finally {
    loading.value = false;
  }
};

const likePost = async (post) => {
  if (!isAuthenticated.value) {
    notificationStore.info('Please sign in to like posts');
    return;
  }
  
  try {
    const response = await newsService.likePost(post.id);
    if (response.success) {
      post.liked = response.liked;
      post.likes = response.likes;
      // Force reactivity update
      const postIndex = posts.value.findIndex(p => p.id === post.id);
      if (postIndex !== -1) {
        posts.value[postIndex] = { ...post };
      }
    }
  } catch (error) {
    console.error('Error liking post:', error);
    notificationStore.error('Failed to like post');
  }
};

const approvePost = async (postId) => {
  try {
    loading.value = true;
    await newsService.updatePostStatus(postId, 'approved');
    notificationStore.success('Post approved successfully');
    loadPosts();
  } catch (error) {
    console.error('Error approving post:', error);
    notificationStore.error('Failed to approve post');
  } finally {
    loading.value = false;
  }
};

const rejectPost = async (postId) => {
  try {
    loading.value = true;
    await newsService.rejectPost(postId);
    notificationStore.success('Post rejected successfully');
    loadPosts();
  } catch (error) {
    console.error('Error rejecting post:', error);
    notificationStore.error('Failed to reject post');
  } finally {
    loading.value = false;
  }
};

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return { url: '', crossorigin: 'anonymous' };
  
  try {
    // If it's a Cloudinary URL or any other full URL, return as is
    if (imageUrl.startsWith('http')) {
      return {
        url: imageUrl,
        crossorigin: 'anonymous'
      };
    }
    
    // Fallback for any legacy images
    const cleanImageUrl = imageUrl.replace(/^\/+/, '').replace(/\\/g, '/');
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'https://disaster-app-backend.onrender.com';
    
    return {
      url: `${baseUrl}/uploads/${cleanImageUrl}`,
      crossorigin: 'anonymous'
    };
  } catch (error) {
    console.error('Error constructing image URL:', error);
    return { url: '', crossorigin: 'anonymous' };
  }
};

const handleImageError = (event, post) => {
  if (!post) return;
  
  post.imageError = true;
  post.imageLoaded = false;
  
  // Log the error with more context for debugging
  console.warn(`Failed to load image for post ${post.id}:`, {
    imageUrl: post.image_url,
    constructedUrl: getImageUrl(post.image_url).url,
    error: event?.target?.error || event
  });
  
  // Attempt to reload the image once with a cache-busting parameter
  if (!event.target.dataset.retried) {
    event.target.dataset.retried = 'true';
    event.target.src = `${getImageUrl(post.image_url).url}?t=${Date.now()}`;
  }
};

const handleImageLoad = (event, post) => {
  if (!post) return;
  
  post.imageLoaded = true;
  post.imageError = false;
};

const savePost = async (post) => {
  if (!isAuthenticated.value) {
    notificationStore.info('Please sign in to save posts');
    return;
  }
  try {
    const response = await newsService.savePost(post.id);
    if (response.success) {
      post.saved = response.saved;
      notificationStore.success(post.saved ? 'Post saved' : 'Post unsaved');
    }
  } catch (error) {
    console.error('Error saving post:', error);
    notificationStore.error('Failed to save post');
  }
};

const toggleComments = async (post) => {
  post.showComments = !post.showComments;
  if (post.showComments && (!post.comments || post.comments.length === 0)) {
    await loadComments(post);
  }
};

const loadComments = async (post) => {
  try {
    const response = await newsService.getComments(post.id);
    if (response.success) {
      post.comments = response.comments;
      // Update the comment count to match actual comments
      post.commentCount = response.comments.length;
      // Force reactivity update
      posts.value = [...posts.value];
    }
  } catch (error) {
    console.error('Error loading comments:', error);
    notificationStore.error('Failed to load comments');
  }
};

const addComment = async (post) => {
  if (!isAuthenticated.value) {
    notificationStore.info('Please sign in to comment');
    return;
  }
  if (!post.newComment?.trim()) return;
  
  try {
    const response = await newsService.addComment(post.id, post.newComment);
    if (response.success) {
      if (!post.comments) post.comments = [];
      post.comments.unshift(response.comment);
      post.commentCount = post.comments.length;
      post.newComment = '';
      // Force reactivity update
      posts.value = [...posts.value];
      notificationStore.success('Comment added successfully');
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    notificationStore.error('Failed to add comment');
  }
};

const deleteComment = async (post, comment) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    try {
        const reason = prompt('Please provide a reason for deletion:');
        if (!reason) return;

        const response = await newsService.deleteComment(post.id, comment.id, reason);
        
        if (response.success) {
            // Update the comment in the UI to show as deleted
            comment.content = '[Deleted by Admin]';
            comment.deleted_by = authStore.user.id;
            comment.deletion_reason = reason;
            notificationStore.success('Comment deleted successfully');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Failed to delete comment:', error);
        notificationStore.error(error.message || 'Failed to delete comment');
    }
};

const handleGuestInteraction = (type) => {
  if (!isAuthenticated.value) {
    notificationStore.info('Please sign in to ' + type + ' posts');
    router.push({
      path: '/login',
      query: { redirect: '/news', action: type }
    });
    return;
  }
};

onMounted(() => {
  loadPosts();
});
</script>

<style scoped>
.action-buttons {
  margin: 1rem 0;
  display: flex;
  justify-content: flex-end;
}

.add-post-btn {
  background-color: #00ADA9;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.add-post-btn:hover {
  background-color: #008B87;
}

.news-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.news-header h1 {
  color: #005C5C;
  font-size: 2rem;
  font-weight: 700;
}

.create-post-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
}

.loading-overlay {
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

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 92, 92, 0.15);
}

.blur-content {
  filter: blur(2px);
  pointer-events: none;
  user-select: none;
}

.news-feed {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem 0;
}

.news-card {
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 4px 24px rgba(0, 92, 92, 0.06);
  border: 1px solid rgba(0, 173, 173, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;
}

.news-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 92, 92, 0.12);
  border-color: #00D1D1;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 173, 173, 0.1);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-info i {
  font-size: 2.5rem;
  color: #00D1D1;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.author-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #005C5C;
  margin: 0;
}

.post-date {
  color: #64748b;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.post-date::before {
  content: '•';
  color: #00D1D1;
}

.post-content {
  margin-bottom: 1.5rem;
}

.post-content h2 {
  font-size: 1.5rem;
  color: #005C5C;
  margin-bottom: 1rem;
  font-weight: 700;
}

.post-content p {
  color: #334155;
  line-height: 1.6;
  font-size: 1.05rem;
}

.post-actions {
  display: flex;
  gap: 0.75rem;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
}

.news-card:hover .post-actions {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  padding: 0.75rem;
  background: rgba(64, 82, 214, 0.08);
  border: 1px solid rgba(64, 82, 214, 0.15);
  border-radius: 12px;
  color: #4052D6;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
}

.action-btn:hover {
  background: #4052D6;
  color: white;
  transform: translateY(-2px) rotate(8deg);
}

.action-btn.delete {
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.15);
  color: #dc2626;
}

.action-btn.delete:hover {
  background: #dc2626;
  color: white;
}

.create-post-btn {
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
  position: relative;
  overflow: hidden;
}

.create-post-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.create-post-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
}

.create-post-btn:hover::before {
  left: 100%;
}

.interaction-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.interaction-btn:hover {
  background: rgba(0, 173, 173, 0.1);
}

.interaction-btn.active {
  color: #00D1D1;
}

.interaction-btn.active i.fa-heart {
  color: #ff4b4b;
  transform: scale(1.1);
}

.interaction-btn i {
  font-size: 1.1rem;
  transition: transform 0.3s ease;
}

.interaction-btn:hover i {
  transform: scale(1.1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.news-card {
  animation: slideIn 0.5s ease-out;
}

.no-posts {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.no-posts i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

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
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #005C5C;
  font-weight: 600;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(0, 173, 173, 0.2);
  border-radius: 8px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.admin-controls {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 92, 92, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-controls {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(0, 173, 173, 0.2);
  background: white;
  color: #005C5C;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn.active {
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  color: white;
  border-color: transparent;
}

.post-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
}

.stat-item i {
  color: #00D1D1;
}

.admin-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 173, 173, 0.1);
}

.approve-btn, .reject-btn {
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.approve-btn {
  background: rgba(0, 209, 209, 0.1);
  color: #00D1D1;
  border: 1px solid rgba(0, 209, 209, 0.2);
}

.approve-btn:hover {
  background: #00D1D1;
  color: white;
}

.reject-btn {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.reject-btn:hover {
  background: #dc2626;
  color: white;
}

.pending-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(234, 179, 8, 0.1);
  color: #b45309;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.image-upload {
  border: 2px dashed rgba(0, 173, 173, 0.2);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  position: relative;
}

.image-input {
  width: 100%;
  cursor: pointer;
}

.upload-preview {
  margin-top: 1rem;
  position: relative;
  display: inline-block;
}

.upload-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-image {
  margin: 1rem 0;
  width: 100%;
}

.image-container {
  position: relative;
  width: 100%;
  max-height: 400px;
  min-height: 200px;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.news-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.news-image.visible {
  opacity: 1;
}

.image-loading, .image-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
}

.image-loading {
  color: #00D1D1;
}

.image-error-overlay {
  color: #dc2626;
  background: rgba(255, 255, 255, 0.95);
}

.image-loading i,
.image-error-overlay i {
  font-size: 2rem;
}

.interaction-btn.active i.fa-heart {
  color: #ff4b4b !important;
  transform: scale(1.1);
}

.interaction-btn i.fa-heart {
  color: #64748b;
  transition: all 0.3s ease;
}

.interaction-btn:hover i.fa-heart {
  color: #ff4b4b;
  transform: scale(1.1);
}

.interaction-btn.active .fas.fa-heart {
  opacity: 1;
  visibility: visible;
  color: #ff4b4b !important;
}

.post-footer {
    display: flex;
    gap: 1rem;
    padding: 1rem 0;
    border-top: 1px solid rgba(0, 173, 173, 0.1);
}

.interaction-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 8px;
}

.interaction-btn:hover {
    background: rgba(0, 173, 173, 0.1);
    color: #00D1D1;
}

.interaction-btn.active {
    color: #00D1D1;
}

.interaction-btn i {
    font-size: 1.1rem;
}

.interaction-btn span {
    font-size: 0.9rem;
    font-weight: 500;
}

.comments-section {
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(0, 173, 173, 0.05);
    border-radius: 8px;
}

.comment-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.comment-form input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid rgba(0, 173, 173, 0.2);
    border-radius: 8px;
    background: white;
}

.comment-btn {
    padding: 0.75rem;
    background: #00D1D1;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.comment-btn:hover {
    background: #00A3A3;
}

.comments-list {
    margin-top: 1rem;
}

.comment {
    padding: 1rem;
    border-radius: 8px;
    background: rgba(0, 173, 173, 0.05);
    margin-bottom: 1rem;
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.comment-author {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #005C5C;
    font-weight: 600;
}

.comment-author i {
    color: #00D1D1;
    font-size: 1.2rem;
}

.comment-date {
    font-size: 0.875rem;
    color: #64748b;
}

.comment-content {
    color: #334155;
    line-height: 1.5;
}

.interaction-btn.active i.fa-heart {
    color: #ff4b4b;
    transform: scale(1.1);
}

.interaction-btn i.fa-heart {
    color: #64748b;
    transition: all 0.3s ease;
}

.interaction-btn:hover i.fa-heart {
    color: #ff4b4b;
    transform: scale(1.1);
}

.comment-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.delete-comment-btn {
    background: transparent;
    border: none;
    color: #dc2626;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.delete-comment-btn:hover {
    background: rgba(220, 38, 38, 0.1);
}

.comment-content.deleted {
    color: #64748b;
    font-style: italic;
}

.deletion-info {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #dc2626;
}

.deletion-reason {
    font-style: italic;
}

.image-loading-overlay,
.image-error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.image-loading-overlay {
    background: rgba(255, 255, 255, 0.9);
    color: #00D1D1;
}

.image-error-overlay {
    background: rgba(255, 255, 255, 0.95);
    color: #dc2626;
}

.image-loading-overlay i,
.image-error-overlay i {
    font-size: 2rem;
}

.interaction-btn.active i.fa-heart {
    color: #ff4b4b !important;
    transform: scale(1.1);
}

.interaction-btn i.fa-heart {
    color: #64748b;
    transition: all 0.3s ease;
}

.interaction-btn:hover i.fa-heart {
    color: #ff4b4b;
    transform: scale(1.1);
}

.interaction-btn.active .fas.fa-heart {
    opacity: 1;
    visibility: visible;
    color: #ff4b4b !important;
}

.guest-prompt {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 92, 92, 0.06);
  text-align: center;
}

.prompt-content {
  max-width: 400px;
  margin: 0 auto;
}

.prompt-content i {
  font-size: 2.5rem;
  color: #00D1D1;
  margin-bottom: 1rem;
}

.prompt-content h2 {
  color: #005C5C;
  margin-bottom: 0.5rem;
}

.prompt-content p {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.prompt-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.login-btn, .register-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
}

.login-btn {
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  color: white;
}

.register-btn {
  background: rgba(0, 209, 209, 0.1);
  color: #00D1D1;
  border: 1px solid rgba(0, 209, 209, 0.2);
}

.login-btn:hover, .register-btn:hover {
  transform: translateY(-2px);
}

.guest-notice {
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.1) 0%, rgba(64, 82, 214, 0.1) 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(0, 173, 173, 0.2);
}

.notice-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #005C5C;
}

.notice-content i {
  font-size: 1.5rem;
  color: #00D1D1;
}

.login-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  margin-left: auto;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
}

.interaction-btn.disabled {
  opacity: 0.7;
  cursor: pointer;
}

.interaction-btn.disabled:hover {
  background: rgba(0, 173, 173, 0.05);
}

</style>

