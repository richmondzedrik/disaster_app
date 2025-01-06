import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import api from './api';
import { onMounted, watch } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getHeaders = () => {
  const authStore = useAuthStore();
  const token = authStore.accessToken || localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
  };
};

export const newsService = {
    async getPublicPosts() {
        try {
            const response = await axios.get(`${API_URL}/news/public`, {
                withCredentials: true,
                timeout: 15000
            });
            return response.data;
        } catch (error) {
            console.error('getPublicPosts error:', error);
            return {
                success: false,
                posts: [],
                message: error.response?.data?.message || 'Failed to fetch posts'
            };
        }
    },

    // Add these new admin-specific methods
    async getAdminPosts() {
        try {
            const headers = getHeaders();
            const response = await axios.get(`${API_URL}/api/admin/news/posts`, {
                headers,
                withCredentials: true,
                timeout: 15000
            });
            
            if (response?.data?.success) {
                return {
                    success: true,
                    posts: response.data.posts || []
                };
            }
            
            return {
                success: false,
                posts: [],
                message: response.data?.message || 'Failed to fetch posts'
            };
        } catch (error) {
            console.error('getAdminPosts error:', error);
            return {
                success: false,
                posts: [],
                message: error.response?.data?.message || 'Failed to fetch posts'
            };
        }
    },

    async approvePost(postId) {
        try {
            const headers = getHeaders();
            const response = await axios.put(`${API_URL}/api/admin/news/posts/${postId}/approve`, {}, {
                headers,
                withCredentials: true,
                timeout: 15000
            });
            return response.data;
        } catch (error) {
            console.error('Error approving post:', error);
            throw new Error(error.response?.data?.message || 'Failed to approve post');
        }
    },
    
    async deletePost(postId) {
        try {
            const headers = getHeaders();
            const response = await axios.delete(`${API_URL}/api/admin/news/posts/${postId}`, {
                headers,
                withCredentials: true,
                timeout: 15000
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting post:', error);
            throw new Error(error.response?.data?.message || 'Failed to delete post');
        }
    },

    async createPost(postData) {
        const response = await api.post('/admin/posts', postData);
        return response.data;
    },

    async updatePostStatus(postId, status) {
        const response = await api.put(`/admin/news/posts/${postId}/status`, { status });
        return response.data;
    },

    async rejectPost(postId) {
        return this.updatePostStatus(postId, 'rejected');
    },

    // Keep existing methods
    async createPost(formData) {
        const headers = {
          ...getHeaders(),
          'Content-Type': 'multipart/form-data'
        };
        const response = await axios.post(`${API_URL}/news/posts`, formData, {
          headers,
          withCredentials: true
        });
        return response.data;
      },

    async updatePost(id, formData) {
        const headers = {
            ...getHeaders(),
            'Content-Type': 'multipart/form-data'
        };
        const response = await axios.put(`${API_URL}/news/posts/${id}`, formData, {
            headers,
            withCredentials: true
        });
        return response.data;
    },

    async deletePost(id) {
        const headers = getHeaders();
        const response = await axios.delete(`${API_URL}/news/posts/${id}`, {
            headers,
            withCredentials: true   
        });
        return response.data;
    },

    async likePost(postId) {
        try {
            const headers = getHeaders();
            const response = await axios.post(`${API_URL}/news/posts/${postId}/like`, {}, {
                headers,
                withCredentials: true
            });
            
            return {
                success: true,
                likes: parseInt(response.data.likes),
                liked: Boolean(response.data.liked)
            };
        } catch (error) {
            console.error('Error liking post:', error);
            throw new Error(error.response?.data?.message || 'Failed to like post');
        }
    },

    async commentPost(postId, comment) {
        const headers = getHeaders();
        const response = await axios.post(`${API_URL}/news/posts/${postId}/comment`, { comment }, {
            headers,
            withCredentials: true
        });
        return response.data;
    },
   
    async sharePost(postId) {
        const headers = getHeaders();
        const response = await axios.post(`${API_URL}/news/posts/${postId}/share`, {}, {
            headers,
            withCredentials: true
        });
        return response.data;
    },

    async savePost(postId) {
        const headers = getHeaders();
        const response = await axios.post(`${API_URL}/news/posts/${postId}/save`, {}, {
            headers,
            withCredentials: true
        });
        return response.data;
    },
    
    async getComments(postId) {
        try {
            const headers = getHeaders();
            const response = await axios.get(`${API_URL}/news/posts/${postId}/comments`, {
                headers,
                withCredentials: true,
                timeout: 15000,
                validateStatus: status => status < 500 // Only treat 500+ as errors
            });
            
            if (response.status === 401) {
                return {
                    success: false,
                    message: 'Please sign in to view comments',
                    status: 401
                };
            }
            
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Failed to fetch comments');
            }
            
            return {
                success: true,
                comments: response.data.comments || []
            };
        } catch (error) {
            console.error('Error fetching comments:', error);
            return {
                success: false,
                comments: [],
                message: error.response?.data?.message || 'Failed to fetch comments',
                status: error.response?.status
            };
        }
    },
    
    async addComment(postId, content) {  
        try {
            if (!content || !content.trim()) {
                return {
                    success: false,
                    message: 'Comment content is required'
                };
            }

            const headers = getHeaders();
            const response = await axios.post(`${API_URL}/news/posts/${postId}/comments`, {
                content: content.trim()
            }, {
                headers,
                withCredentials: true,
                timeout: 15000,
                validateStatus: status => status < 500 // Only treat 500+ as errors
            });
            
            if (response.status === 401) {
                const authStore = useAuthStore();
                await authStore.logout();
                window.location.href = '/login';
                return {
                    success: false,
                    message: 'Session expired. Please login again.'
                };
            }

            if (response.data?.success) {
                return {
                    success: true,
                    comment: response.data.comment,
                    commentCount: response.data.commentCount
                };
            }

            return {
                success: false,
                message: response.data?.message || 'Failed to add comment'
            };
        } catch (error) {
            console.error('Error adding comment:', error);
            return {
                success: false,
                message: 'Network error or server timeout. Please try again.'
            };
        }
    },

    async deleteComment(postId, commentId, reason) {
        try {
            const headers = getHeaders();
            const response = await axios.delete(`${API_URL}/news/posts/${postId}/comments/${commentId}`, {
                headers,
                withCredentials: true,  
                data: { reason }
            });
            return {
                success: true,
                ...response.data
            };
        } catch (error) {
            console.error('Error deleting comment:', error);  
            return {
                success: false,  
                message: error.response?.data?.message || 'Failed to delete comment'
            };
        }
    },

    async getPosts() {
        try {
            const headers = getHeaders();
            const response = await axios.get(`${API_URL}/news/posts`, {
                headers,
                withCredentials: true
            });
            
            if (response.data?.success) {
                const posts = response.data.posts.map(post => ({
                    ...post,
                    comments: post.comments || [],
                    likes: post.likes || 0,
                    liked: post.liked || false,
                    saved: post.saved || false
                }));
                
                return {
                    success: true,
                    posts
                };
            }
            throw new Error(response.data?.message || 'Failed to fetch posts');
        } catch (error) {
            console.error('Error fetching posts:', error);
            return {
                success: false,
                posts: []
            };
        }
    }
};