<template>
  <div class="posts-view">
    <div class="header">
      <div class="header-content">
        <h1>Post Management</h1>
        <p>Manage and moderate community posts</p>
      </div>
      <button @click="showCreateModal = true" class="create-btn">
        <i class="fas fa-plus"></i> Create Post
      </button>
    </div>

    <div class="table-container" :class="{ 'loading': isLoading }">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id">
            <td class="title-cell">{{ post.title }}</td>
            <td>{{ post.author_username }}</td>
            <td>
              <span :class="['status-badge', post.status]">
                {{ post.status }}
              </span>
            </td>
            <td>{{ formatDate(post.created_at) }}</td>
            <td class="action-buttons">
              <button @click="viewPost(post)" class="action-btn view-btn">
                <i class="fas fa-eye"></i>
              </button>
              <button 
                v-if="post.status === 'pending'"
                @click="approvePost(post.id)" 
                class="action-btn approve-btn"
              >
                <i class="fas fa-check"></i>
              </button>
              <button @click="deletePost(post.id)" class="action-btn delete-btn">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- View Post Modal -->
    <div v-if="selectedPost" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ selectedPost.title }}</h2>
          <button @click="selectedPost = null" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="post-content">
          <p>{{ selectedPost.content }}</p>
        </div>
        <div class="post-meta">
          <div class="meta-item">
            <i class="fas fa-user"></i>
            <span>{{ selectedPost.author_username }}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-calendar"></i>
            <span>{{ formatDate(selectedPost.created_at) }}</span>
          </div>
        </div>
        
        <!-- Comments Section -->
        <div class="comments-section">
          <h3>Comments</h3>
          <div class="comments-list">
            <div v-for="comment in selectedPost.comments" :key="comment.id" class="comment">
              <div class="comment-header">
                <div class="comment-author">
                  <i class="fas fa-user-circle"></i>
                  <span>{{ comment.username }}</span>
                </div>
                <div class="comment-actions">
                  <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                  <button @click="deleteComment(selectedPost, comment)" class="delete-comment-btn">
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
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import { newsService } from '@/services/newsService';

const notificationStore = useNotificationStore();
const posts = ref([]);
const isLoading = ref(true);
const selectedPost = ref(null);
const showCreateModal = ref(false);
const error = ref(null);

const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

const loadPosts = async () => {
    try {
        isLoading.value = true;
        error.value = null;
        
        const response = await newsService.getAdminPosts();
        if (response.success) {
            posts.value = response.posts.map(post => ({
                ...post,
                author_username: post.author || post.author_username || post.author_name || 'Unknown Author'
            }));
        } else {
            throw new Error('Failed to fetch posts');
        }
    } catch (err) {
        console.error('Error loading posts:', err);
        error.value = err.message;
        notificationStore.error('Failed to load posts');
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    loadPosts();
});

const approvePost = async (postId) => {
  try {
    await newsService.approvePost(postId);
    notificationStore.success('Post approved successfully');
    await loadPosts();
  } catch (error) {
    notificationStore.error('Failed to approve post');
  }
};

const deletePost = async (postId) => {
  if (!confirm('Are you sure you want to delete this post?')) return;
  try {
    await newsService.deletePost(postId);
    notificationStore.success('Post deleted successfully');
    await loadPosts();
  } catch (error) {
    notificationStore.error('Failed to delete post');
  }
};

const viewPost = async (post) => {
  try {
    selectedPost.value = post;
    const response = await newsService.getComments(post.id);
    if (response.success) {
      selectedPost.value = {
        ...post,
        comments: response.comments.map(comment => ({
          ...comment,
          created_at: comment.created_at || comment.createdAt
        }))
      };
    }
  } catch (error) {
    console.error('Error loading comments:', error);
    notificationStore.error('Failed to load comments');
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
      comment.content = '[Deleted by Admin]';
      comment.deleted_by = true;
      comment.deletion_reason = reason;
      notificationStore.success('Comment deleted successfully');
    }
  } catch (error) {
    console.error('Failed to delete comment:', error);
    notificationStore.error('Failed to delete comment');
  }
};

onMounted(loadPosts);
</script>

<style scoped>
.posts-view {
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  padding: 3rem 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  color: white;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.header-content p {
  font-size: 1.1rem;
  opacity: 0.9;
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
  transition: all 0.3s ease;
  font-size: 1rem;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.1) 0%, rgba(64, 82, 214, 0.1) 100%);
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

.title-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.pending { 
  background: rgba(230, 81, 0, 0.1); 
  color: #e65100; 
}

.status-badge.approved { 
  background: rgba(27, 94, 32, 0.1); 
  color: #1b5e20; 
}

.status-badge.rejected { 
  background: rgba(183, 28, 28, 0.1); 
  color: #b71c1c; 
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-btn {
  background: rgba(64, 82, 214, 0.1);
  color: #4052D6;
}

.approve-btn {
  background: rgba(27, 94, 32, 0.1);
  color: #1b5e20;
}

.delete-btn {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.view-btn:hover {
  background: #4052D6;
  color: white;
}

.approve-btn:hover {
  background: #1b5e20;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
  color: white;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
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

.post-content {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  max-height: 400px;
  overflow-y: auto;
  line-height: 1.6;
  color: #334155;
}

.post-meta {
  display: flex;
  gap: 1.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 173, 173, 0.1);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
}

.meta-item i {
  color: #00D1D1;
}

.comments-section {
  margin-top: 2rem;
  border-top: 1px solid rgba(0, 173, 173, 0.1);
  padding-top: 1.5rem;
}

.comments-section h3 {
  color: #005C5C;
  margin-bottom: 1rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
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
  color: #64748b;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.comment-date {
  color: #94a3b8;
  font-size: 0.875rem;
}

.delete-comment-btn {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 0.25rem;
  transition: all 0.2s ease;
}

.delete-comment-btn:hover {
  transform: scale(1.1);
}

.comment-content {
  color: #334155;
  line-height: 1.5;
}

.comment-content.deleted {
  color: #94a3b8;
  font-style: italic;
}

.deletion-info {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #dc2626;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 2rem 1.5rem;
  }

  .create-btn {
    width: 100%;
    justify-content: center;
  }

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
</style>