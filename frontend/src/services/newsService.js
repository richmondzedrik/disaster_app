import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import api from './api';
import { onMounted, watch } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'https://disaster-app.onrender.com';

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
                timeout: 30000
            });
            
            // Ensure liked status is properly set for each post
            const posts = response.data.posts?.map(post => ({
                ...post,
                liked: Boolean(post.liked),
                likes: parseInt(post.likes) || 0
            })) || [];
    
            return {
                success: true,
                posts
            };
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
            const response = await axios.get(`${API_URL}/news/admin/posts`, {
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
            // First approve the post
            const response = await axios.put(`${API_URL}/admin/news/posts/${postId}/approve`, {}, {
                headers,
                withCredentials: true,
                timeout: 15000,
                validateStatus: status => status < 500
            });

            if (response.status === 401) {
                const authStore = useAuthStore();
                await authStore.logout();
                throw new Error('Session expired. Please login again.');
            }

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Failed to approve post');
            }

            // After successful approval, trigger notifications
            try {
                const notifyResponse = await axios.post(`${API_URL}/notifications/api/news/notify-subscribers`, {
                    postId: postId,
                    title: response.data.post?.title || '',
                    content: response.data.post?.content || '',
                    author: response.data.post?.author || '',
                    status: 'approved',
                    isAdmin: false
                }, {
                    headers,
                    withCredentials: true,
                    timeout: 30000
                });

                console.log('Notification response:', notifyResponse.data);
            } catch (notifyError) {
                console.error('Error sending notifications:', notifyError);
                // Don't fail the approval if notifications fail
            }

            return {
                success: true,
                message: response.data?.message || 'Post approved successfully'
            };
        } catch (error) {
            console.error('Error approving post:', error);
            if (error.code === 'ERR_NETWORK') {
                throw new Error('Network error. Please check your connection and try again.');
            }
            throw new Error(error.response?.data?.message || error.message || 'Failed to approve post');
        }
    },
    
    async deletePost(postId) {
        try {
            const headers = getHeaders();
            const response = await axios.delete(`${API_URL}/api/admin/posts/${postId}`, {
                headers,
                withCredentials: true,
                timeout: 15000,
                validateStatus: status => status < 500
            });
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete post');
            }
            
            return response.data;
        } catch (error) {
            console.error('Error deleting post:', error);
            throw new Error(error.response?.data?.message || 'Failed to delete post');
        }
    }, 

    async createPost(formData) {
        try {
            const headers = {
                ...getHeaders(),
                'Content-Type': 'multipart/form-data'
            };
            
            // Check if media file exists and its type
            const mediaFile = formData.get('media');
            if (mediaFile) {
                // Validate file size (100MB limit)
                if (mediaFile.size > 100 * 1024 * 1024) {
                    throw new Error('File size must be less than 100MB');
                }

                // Validate file type
                const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
                
                if (!validImageTypes.includes(mediaFile.type) && !validVideoTypes.includes(mediaFile.type)) {
                    throw new Error('Invalid file type. Only images (JPG, PNG, GIF, WEBP) and videos (MP4, WEBM, MOV) are allowed');
                }
            }

            const response = await axios.post(`${API_URL}/news/posts`, formData, {
                headers,
                withCredentials: true,
                timeout: 60000, // Increased timeout for video upload
                maxContentLength: 104857600, // 100MB in bytes
                maxBodyLength: 104857600, // 100MB in bytes
                validateStatus: status => status < 500,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log('Upload progress:', percentCompleted);
                }
            });

            if (response.status === 401) {
                const authStore = useAuthStore();
                await authStore.logout();
                throw new Error('Session expired. Please login again.');
            }

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to create post');
            }

            return response.data;
        } catch (error) {
            console.error('Error creating post:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to create post. Please try again.');
        }
    },

    async updatePostStatus(postId, status) {
        try {
            const headers = getHeaders();
            const response = await axios.put(`${API_URL}/news/posts/${postId}/status`, 
                { status },
                {
                    headers,
                    withCredentials: true,
                    timeout: 15000,
                    validateStatus: status => status < 500
                }
            );

            if (response.status === 401) {
                const authStore = useAuthStore();
                await authStore.logout();
                throw new Error('Session expired. Please login again.');
            }

            return {
                success: true,
                message: response.data?.message || `Post ${status} successfully`
            };
        } catch (error) {
            console.error(`Error updating post status to ${status}:`, error);
            throw new Error(error.response?.data?.message || 'Unable to connect to the server. Please check your connection.');
        }
    },

    async rejectPost(postId) {
        try {
            const headers = getHeaders();
            const response = await axios.put(`${API_URL}/news/posts/${postId}/reject`, {}, {
                headers,
                withCredentials: true,
                timeout: 15000,
                validateStatus: status => status < 500
            });

            if (response.status === 401) {
                const authStore = useAuthStore();
                await authStore.logout();
                throw new Error('Session expired. Please login again.');
            }

            return {
                success: true,
                message: response.data?.message || 'Post rejected successfully'
            };
        } catch (error) {
            console.error('Error rejecting post:', error);
            throw new Error(error.response?.data?.message || 'Unable to connect to the server. Please check your connection.');
        }
    },

    // Keep existing methods
    async updatePost(postId, formData) {
        try {
            const headers = {
                ...getHeaders(),
                'Content-Type': 'multipart/form-data'
            };
            
            const response = await axios.put(`${API_URL}/news/posts/${postId}`, formData, {
                headers,
                withCredentials: true,
                timeout: 15000,
                validateStatus: status => status < 500
            });

            if (response.status === 401) {
                const authStore = useAuthStore();
                await authStore.logout();
                throw new Error('Session expired. Please login again.');
            }

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update post');
            }

            return response.data;
        } catch (error) {
            console.error('Error updating post:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to update post');
        }
    },

    async likePost(postId) {
        try {
            const headers = getHeaders();
            const response = await axios.post(`${API_URL}/news/posts/${postId}/like`, {}, {
                headers,
                withCredentials: true,
                validateStatus: status => status < 500
            });
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                const authStore = useAuthStore();
                await authStore.logout();
                throw new Error('Session expired. Please login again.');
            }

            return {
                success: true,
                likes: parseInt(response.data.likes) || 0,
                liked: Boolean(response.data.liked)
            };
        } catch (error) {
            if (error.message.includes('Session expired')) {
                throw error;
            }
            console.error('Error liking post:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to like post',
                status: error.response?.status
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
    
    async getComments(postId, retries = 2) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const headers = getHeaders();
                const response = await axios.get(`${API_URL}/news/posts/${postId}/comments`, {
                    headers,
                    withCredentials: true,
                    timeout: 5000
                });
                
                return {
                    success: true,
                    comments: response.data.comments || []
                };
            } catch (error) {
                if (attempt === retries) {
                    console.error('Error fetching comments:', error);
                    return {  
                        success: false,
                        comments: [],
                        message: error.response?.data?.message || 'Failed to fetch comments',
                        status: error.response?.status
                    };
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
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
    },

    async notifySubscribers(postData) {
        try {
            const headers = getHeaders();
            const response = await axios.post(`${API_URL}/api/news/notify-subscribers`, {
                postId: postData.postId,
                title: postData.title,
                content: postData.content,
                author: postData.author
            }, {
                headers,
                withCredentials: true,
                timeout: 30000,
                retries: 2,
                validateStatus: status => status < 500
            });
            console.log('Notification response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error notifying subscribers:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send notifications'
            };
        }
    },

    async sendNewPostNotification(postData) {
        try {
            const response = await api.post('/news/notify', postData);
            return response.data;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    },

    async testEmail(email) {
        try {
            console.log('Initiating test email send to:', email);
            const headers = getHeaders();
            console.log('Request headers:', headers);
            
            const response = await axios.post(`${API_URL}/notifications/test-email`, { email }, {
                headers,
                withCredentials: true,
                timeout: 30000
            });
            
            console.log('Test email response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Test email error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    timeout: error.config?.timeout
                }
            });
    
            if (error.code === 'ECONNABORTED') {
                return {
                    success: false,
                    message: 'Test email request timed out. Please try again.'
                };
            }
    
            if (error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Test email endpoint not found. Please check API configuration.'
                };
            }
    
            return {
                success: false,
                message: 'Failed to send test email: ' + (error.response?.data?.message || error.message)
            };
        }
    },

    async testNotificationSystem() {
        try {
            const headers = getHeaders();
            const response = await axios.post(`${API_URL}/test-notification-system`, {}, {
                headers,
                withCredentials: true,
                timeout: 10000
            });
            console.log('Test notification system response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Test notification system error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Test notification system failed'
            };
        }
    },

    async getLikedPosts() {
        const authStore = useAuthStore();
        
        if (!authStore.isAuthenticated) {
            return {
                success: true,
                likedPosts: []
            };
        }

        try {
            const headers = getHeaders();
            const response = await axios.get(`${API_URL}/news/posts/liked`, {
                headers,
                withCredentials: true,
                validateStatus: status => status < 500
            });
            
            if (response.status === 401) {
                await authStore.logout();
                throw new Error('Session expired. Please login again.');
            }

            return response.data;
        } catch (error) {
            console.error('Error fetching liked posts:', error);
            return {
                success: false,
                likedPosts: [],
                message: error.response?.data?.message || 'Failed to fetch liked posts'
            };
        }
    },

    async getRecentPosts() {
        try {
            const headers = getHeaders();
            const response = await axios.get(`${API_URL}/news/recent`, {
                headers,
                withCredentials: true
            });

            return {
                success: true,
                posts: response.data.posts || []
            };
        } catch (error) {
            console.error('Error fetching recent posts:', error);
            return {
                success: false,
                posts: []
            };
        }
    }
};