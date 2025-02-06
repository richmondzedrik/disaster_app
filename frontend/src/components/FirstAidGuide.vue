<template>
    <div class="first-aid-guide">
      <div class="header">
        <h1>First Aid Guide</h1>
        <p>Essential first aid information and procedures</p>
      </div>
  
      <div class="guide-grid">
        <div class="guide-card" v-for="(guide, index) in firstAidGuides" :key="index">
          <div class="guide-header">
            <i :class="guide.icon"></i>
            <h3>{{ guide.title }}</h3>
          </div>
          <div class="guide-content">
            <p>{{ guide.description }}</p>
            <ul>
              <li v-for="(step, stepIndex) in guide.steps" :key="stepIndex">
                {{ step }}
              </li>
            </ul>
            <div v-if="guide.videoUrl" class="video-container">
              <template v-if="editingVideoIndex === index">
                <div class="edit-video-form">
                  <input 
                    type="url" 
                    v-model="newVideoUrl"
                    placeholder="Enter new video URL"
                    class="video-url-input"
                  >
                  <div class="edit-actions">
                    <button @click="saveVideoUrl(index)" class="save-btn">
                      <i class="fas fa-save"></i>
                      Save
                    </button>
                    <button @click="cancelEdit" class="cancel-btn">
                      <i class="fas fa-times"></i>
                      Cancel
                    </button>
                  </div>
                </div>
              </template>
              <template v-else>
                <a :href="guide.videoUrl" target="_blank" class="video-link">
                  <i class="fas fa-play-circle"></i>
                  Watch Tutorial Video
                </a>
                <button v-if="isAdmin" @click="editVideoUrl(index)" class="edit-video-btn" title="Edit Video URL">
                  <i class="fas fa-edit"></i>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useAuthStore } from '../stores/auth';
  import { firstAidService } from '../services/firstAidService';
  import { useNotificationStore } from '../stores/notification';
  import { useRouter } from 'vue-router';

  const authStore = useAuthStore();
  const isAdmin = computed(() => authStore.user?.role === 'admin');

  const editingVideoIndex = ref(null);
  const newVideoUrl = ref('');

  const notificationStore = useNotificationStore();
  const router = useRouter();

  const firstAidGuides = [
    {
      title: 'CPR Basics',
      icon: 'fas fa-heartbeat',
      description: 'Basic steps for performing CPR:',
      steps: [
        'Check the scene for safety',
        'Check responsiveness',
        'Call emergency services (911)',
        'Check breathing',
        'Begin chest compressions',
        'Give rescue breaths if trained'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=hizBdM1Ob68'
    },
    {
      title: 'Bleeding Control',
      icon: 'fas fa-band-aid',
      description: 'Steps to control bleeding:',
      steps: [
        'Apply direct pressure',
        'Use clean cloth or gauze',
        'Elevate the injury if possible',
        'Apply pressure bandage',
        'Seek medical attention'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=gOWEFgsrNhI'
    },
    {
      title: 'Burns Treatment',
      icon: 'fas fa-fire',
      description: 'Initial treatment for burns:',
      steps: [
        'Cool the burn with cool water',
        'Remove jewelry/tight items',
        'Cover with sterile gauze',
        'Don\'t break blisters',
        'Seek medical attention for severe burns'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=EaJmzB8YgS0'
    },
    {
      title: 'Choking Response',
      icon: 'fas fa-exclamation-triangle',
      description: 'How to help someone who is choking:',
      steps: [
        'Encourage coughing',
        'Give 5 back blows',
        'Perform abdominal thrusts',
        'Alternate between back blows and thrusts',
        'Call emergency if person becomes unconscious'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=2dn13zneEjo'
    },
    {
      title: 'Fracture Care',
      icon: 'fas fa-bone',
      description: 'Immediate care for suspected fractures:',
      steps: [
        'Keep the injured area still',
        'Apply ice to reduce swelling',
        'Check circulation beyond the injury',
        'Immobilize the injured area',
        'Seek immediate medical attention'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=AsZvN7b02S0'
    },
    {
      title: 'Heat Exhaustion',
      icon: 'fas fa-temperature-high',
      description: 'Treating heat exhaustion symptoms:',
      steps: [
        'Move to a cool place',
        'Loosen tight clothing',
        'Apply cool, wet cloths',
        'Sip water slowly',
        'Monitor symptoms'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=vIXR-RJ3o0w'
    },
    {
      title: 'Seizure Response',
      icon: 'fas fa-brain',
      description: 'How to help during a seizure:',
      steps: [
        'Clear the area of hazards',
        'Protect head from injury',
        'Time the seizure duration',
        'Never restrain the person',
        'Place in recovery position after'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=FbtLZ4ww6Y4'
    },
    {
      title: 'Allergic Reaction',
      icon: 'fas fa-allergies',
      description: 'Managing severe allergic reactions:',
      steps: [
        'Identify allergic symptoms',
        'Use EpiPen if available',
        'Call emergency services',
        'Keep person calm',
        'Monitor breathing and consciousness'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=qE8DcgVW44g'
    }
  ]

  const editVideoUrl = (index) => {
    editingVideoIndex.value = index;
    newVideoUrl.value = firstAidGuides[index].videoUrl;
  };

  const saveVideoUrl = async (index) => {
    if (!newVideoUrl.value) return;
    
    try {
        // Check for authentication token first
        const token = localStorage.getItem('token');
        if (!token) {
            notificationStore.error('Please login to edit video URLs');
            router.push('/login');
            return;
        }

        // Validate URL format
        const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        if (!urlPattern.test(newVideoUrl.value)) {
            throw new Error('Please enter a valid YouTube URL');
        }
        
        // Save to backend
        const response = await firstAidService.updateVideoUrl(index, newVideoUrl.value);
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to update video URL');
        }
        
        // Update local state
        firstAidGuides[index].videoUrl = newVideoUrl.value;
        editingVideoIndex.value = null;
        newVideoUrl.value = '';
        
        notificationStore.success('Video URL updated successfully');
    } catch (error) {
        if (error.message.includes('No authentication token found') || error.response?.status === 401) {
            notificationStore.error('Please login to edit video URLs');
            router.push('/login');
            return;
        }
        notificationStore.error(error.message || 'Failed to update video URL');
    }
  };

  const cancelEdit = () => {
    editingVideoIndex.value = null;
    newVideoUrl.value = '';
  };

  const loadGuides = async () => {
    try {
      if (!authStore.isAuthenticated) {
        console.warn('User not authenticated');
        return;
      }
      
      const response = await firstAidService.getGuides();
      if (response.success && response.guides?.length) {
        // Update video URLs from database response
        response.guides.forEach((guide, index) => {
          if (firstAidGuides[index]) {
            firstAidGuides[index].videoUrl = guide.video_url || firstAidGuides[index].videoUrl;
          }
        });
      }
    } catch (error) {
      console.error('Error loading guides:', error);
      if (error.response?.status === 401) {
        notificationStore.error('Please login to access all features');
        return;
      }
    }
  };

  onMounted(async () => {
    await loadGuides();
  });
  </script>
  
  <style scoped>
  .first-aid-guide {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .header {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .header h1 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }
  
  .header p {
    color: #64748b;
  }
  
  .guide-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .guide-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    padding: 1.75rem;
    transition: all 0.3s ease;
    border: 1px solid rgba(0, 209, 209, 0.1);
  }
  
  .guide-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 209, 209, 0.15);
    border-color: rgba(0, 209, 209, 0.3);
  }
  
  .guide-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid rgba(0, 209, 209, 0.1);
  }
  
  .guide-header i {
    font-size: 1.75rem;
    color: #00D1D1;
    background: rgba(0, 209, 209, 0.1);
    padding: 0.75rem;
    border-radius: 10px;
    transition: all 0.3s ease;
  }
  
  .guide-card:hover .guide-header i {
    transform: scale(1.1);
    background: rgba(0, 209, 209, 0.2);
  }
  
  .guide-header h3 {
    color: #2c3e50;
    margin: 0;
  }
  
  .guide-content p {
    color: #64748b;
    margin-bottom: 1rem;
  }
  
  .guide-content ul {
    list-style-type: none;
    padding: 0;
  }
  
  .guide-content li {
    color: #334155;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .guide-content li:last-child {
    border-bottom: none;
  }
  
  .video-container {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .video-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #00D1D1;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    background-color: rgba(0, 209, 209, 0.1);
  }
  
  .video-link:hover {
    color: #008B87;
    background-color: rgba(0, 209, 209, 0.2);
    transform: translateY(-1px);
  }
  
  .video-link i {
    font-size: 1.2rem;
  }
  
  .edit-video-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
    background: rgba(0, 209, 209, 0.05);
    padding: 1rem;
    border-radius: 8px;
  }
  
  .video-url-input {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    width: 100%;
    transition: all 0.3s ease;
    font-size: 0.95rem;
  }
  
  .video-url-input:focus {
    outline: none;
    border-color: #00D1D1;
    box-shadow: 0 0 0 3px rgba(0, 209, 209, 0.1);
  }
  
  .edit-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .save-btn,
  .cancel-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    transition: all 0.3s ease;
  }
  
  .save-btn {
    background-color: #00D1D1;
    color: white;
  }
  
  .save-btn:hover {
    background-color: #008B87;
  }
  
  .cancel-btn {
    background-color: #f1f5f9;
    color: #64748b;
  }
  
  .cancel-btn:hover {
    background-color: #e2e8f0;
  }
  
  .edit-video-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .edit-video-btn:hover {
    color: #00D1D1;
    background-color: rgba(0, 209, 209, 0.1);
    transform: rotate(15deg);
  }
  </style>