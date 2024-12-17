import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import api from './api';

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
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Add authorization header if user is logged in
            const authStore = useAuthStore();
            if (authStore.accessToken) {
                headers['Authorization'] = `Bearer ${authStore.accessToken}`;
            }

            const response = await axios.get(`${API_URL}/news/public`, { headers });
            
            if (response.data?.success) {
                const posts = response.data.posts.map(post => ({
                    ...post,
                    comments: post.comments || [],
                    likes: parseInt(post.likes) || 0,
                    liked: Boolean(post.liked),
                    saved: post.saved || false
                }));
                
                return {
                    success: true,
                    posts
                };
            }
            throw new Error(response.data?.message || 'Failed to fetch posts');
        } catch (error) {
            console.error('Error fetching public news:', error);
            return {
                success: false,
                posts: []
            };
        }
    },

    // Add these new admin-specific methods
    async getAdminPosts() {
        const response = await api.get('/api/admin/news/posts');
        return response.data;
    },

    async approvePost(postId) {
        const response = await api.put(`/admin/news/posts/${postId}/approve`);
        return response.data;
    },

    async deletePost(postId) {
        const response = await api.delete(`/admin/news/posts/${postId}`);
        return response.data;
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
            
            if (response.data?.success) {
                return {
                    success: true,
                    likes: parseInt(response.data.likes),
                    liked: Boolean(response.data.liked)
                };
            }
            return {
                success: false,
                message: response.data?.message || 'Failed to like post'
            };
        } catch (error) {
            console.error('Error liking post:', error);
            return {
                success: false,
                message: 'Failed to like post'
            };
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
                withCredentials: true
            });
            return {
                success: true,
                comments: response.data.comments
            };
        } catch (error) {
            console.error('Error fetching comments:', error);
            return {
                success: false,
                comments: []
            };
        }
    },
    
    async addComment(postId, content) {
        try {
            const headers = getHeaders();
            const response = await axios.post(`${API_URL}/news/posts/${postId}/comments`, {
                content
            }, {
                headers,
                withCredentials: true
            });
            return {
                success: true,
                comment: response.data.comment
            };
        } catch (error) {
            console.error('Error adding comment:', error);
            return {
                success: false,
                comment: null
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