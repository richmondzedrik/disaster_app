import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';
import { useNotificationStore } from './notification';

export const usePostStore = defineStore('post', () => {
  const posts = ref([]);
  const isLoading = ref(false);
  const notificationStore = useNotificationStore();

  const fetchPosts = async () => {
    try {
      isLoading.value = true;
      const response = await api.get('/admin/posts');
      posts.value = response.data.data;
    } catch (error) {
      notificationStore.error('Failed to fetch posts');
      console.error('Error fetching posts:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const createPost = async (postData) => {
    try {
      const response = await api.post('/admin/posts', postData);
      if (response.data.success) {
        notificationStore.success('Post created successfully');
        await fetchPosts();
        return true;
      }
    } catch (error) {
      notificationStore.error(error.response?.data?.message || 'Failed to create post');
      throw error;
    }
    return false;
  };

  const updatePost = async (postId, postData) => {
    try {
      const response = await api.put(`/admin/posts/${postId}`, postData);
      if (response.data.success) {
        notificationStore.success('Post updated successfully');
        await fetchPosts();
        return true;
      }
    } catch (error) {
      notificationStore.error('Failed to update post');
      throw error;
    }
    return false;
  };

  const deletePost = async (postId) => {
    try {
      const response = await api.delete(`/admin/posts/${postId}`);
      if (response.data.success) {
        notificationStore.success('Post deleted successfully');
        await fetchPosts();
      }
    } catch (error) {
      notificationStore.error('Failed to delete post');
      throw error;
    }
  };

  return {
    posts,
    isLoading,
    fetchPosts,
    createPost,
    updatePost,
    deletePost
  };
});