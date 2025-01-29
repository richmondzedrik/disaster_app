<template>
  <AdminHome v-if="isAdmin" />
  <div v-else class="home-container">
    <!-- Enhanced Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-badge" v-show="isLoggedIn">
          <i class="fas fa-shield-alt"></i>
          Active Protection
        </div>
        <h1>
          <span class="gradient-text">AlertoAbra</span>
          <br />
        </h1>
        <p class="hero-description">Agsagana ita, saan nga inton adda didigra. AlertoAbra, kaduam para iti kaligtasan</p>
        <div class="hero-actions">
          <button @click="$router.push('/login')" class="primary-btn" v-if="!isLoggedIn">
            <i class="fas fa-sign-in-alt"></i>
            Sign In
          </button>
          <button @click="$router.push('/register')" class="secondary-btn" v-if="!isLoggedIn">
            <i class="fas fa-user-plus"></i>
            Create Account
          </button>
          <button @click="viewDashboard" class="primary-btn" v-else>
            <i class="fas fa-tachometer-alt"></i>
            View Dashboard
          </button>
        </div>
      </div>
      <div class="hero-stats" v-if="isLoggedIn">
        <div class="stat-item">
          <div class="stat-icon">
            <i class="fas fa-bell"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ alerts.length }}</span>
            <span class="stat-label">Active Alerts</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <i class="fas fa-newspaper"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ latestUpdatesCount }}</span>
            <span class="stat-label">Latest Updates</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive Features Section -->
    <section class="features-section">
      <h2>Key Features</h2>
      <div class="features-grid">
        <div 
          v-for="(feature, index) in features" 
          :key="index"
          class="feature-card"
          @click="navigateToFeature(feature.route)"
          @mouseenter="activeFeature = index"
          @mouseleave="activeFeature = null"
          :class="{ 'active': activeFeature === index }"
        >
          <div class="feature-icon">
            <i :class="feature.icon"></i>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
          <div class="feature-hover-content">
            <span>{{ feature.cta }}</span>
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>
    </section>

    <!-- Enhanced Recent News Section -->
    <section v-if="recentNews.length > 0" class="recent-news-section">
      <div class="recent-news-content">
        <h2>Latest Community Update</h2>
        <div class="news-preview" v-for="post in recentNews" :key="post.id">
          <div class="news-preview-header">
            <span class="author">
              <i class="fas fa-user-circle"></i>
              {{ post.author }}
            </span>
            <span class="date">{{ formatDate(post.createdAt) }}</span>
          </div>
          <h3>{{ post.title }}</h3>
          <p>{{ post.content.substring(0, 150) }}...</p>
          <div class="news-preview-footer">
            <button @click="$router.push('/news')" class="view-more-btn">
              <span>View All News</span>
              <i class="fas fa-arrow-right"></i>
            </button>
            <div class="news-stats">
              <span><i class="fas fa-eye"></i> {{ post.views || 0 }}</span>
              <span><i class="fas fa-heart"></i> {{ post.likes || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- User Dashboard Preview (for authenticated users) -->
    <section v-if="isLoggedIn" class="dashboard-preview">
      <div class="preview-content">
        <h2>Quick Access</h2>
        <div class="quick-access-grid">
          <button @click="viewAlerts" class="quick-access-btn">
            <i class="fas fa-bell"></i>
            <span>Active Alerts</span>
            <span v-if="alerts.length" class="alert-count">{{ alerts.length }}</span>
          </button>
          <button @click="$router.push('/hazard-map')" class="quick-access-btn">
            <i class="fas fa-map-marked-alt"></i>
            <span>Hazard Map</span>
          </button>
          <button @click="$router.push('/evacuation-route')" class="quick-access-btn">
            <i class="fas fa-route"></i>
            <span>Evacuation Route</span>
          </button>
          <button @click="$router.push('/checklist')" class="quick-access-btn">
            <i class="fas fa-tasks"></i>
            <span>Checklist</span>
          </button>
          <button @click="$router.push('/profile')" class="quick-access-btn">
            <i class="fas fa-user"></i>
            <span>Profile</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Call to Action Section (for unauthenticated users) -->
    <section v-else class="cta-section">
      <div class="cta-content">
        <h2>Be Prepared for Any Situation</h2>
        <p>Join our platform and take the first step towards better disaster preparedness.</p>
        <div class="cta-actions">
          <button @click="$router.push('/register')" class="cta-btn">
            Create Free Account
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { alertService } from '../services/alertService';
import { newsService } from '../services/newsService';
import AdminHome from './AdminHome.vue';
import { useNotificationStore } from '../stores/notification';

const authStore = useAuthStore();
const router = useRouter();
const notificationStore = useNotificationStore();
const isLoggedIn = computed(() => authStore.isAuthenticated);
const alerts = ref([]);
const recentNews = ref([]);
const isAdmin = computed(() => authStore.user?.role === 'admin');

const formatDate = (dateString) => {
  try {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

const viewDashboard = () => {
  router.push('/dashboard');
};

const viewAlerts = () => {
  router.push('/alerts');
};

const loadAlerts = async () => {
  if (isLoggedIn.value) {
    try {
      const response = await alertService.getActiveAlerts();
      if (response.success) {
        alerts.value = response.alerts;
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }
};

const fetchRecentNews = async () => {
  try {
    const response = await newsService.getPublicPosts();
    if (response.success && response.posts) {
      // Sort posts by date in descending order (newest first)
      recentNews.value = response.posts.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at);
        const dateB = new Date(b.createdAt || b.created_at);
        return dateB - dateA;
      });
      
      // Take only the most recent posts (e.g., last 5)
      recentNews.value = recentNews.value.slice(0, 5);
    }
  } catch (error) {
    console.error('Error fetching recent news:', error);
    notificationStore.error('Failed to load recent updates');
  }
};

const latestUpdatesCount = computed(() => {
  // Count posts from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return recentNews.value.filter(post => {
    const postDate = new Date(post.createdAt || post.created_at);
    return postDate >= sevenDaysAgo;
  }).length;
});

// Load alerts on mount and when authentication state changes
onMounted(() => {
  fetchRecentNews();
  if (isLoggedIn.value) {
    loadAlerts();
  }
});

// Watch for authentication state changes
watch(() => isLoggedIn.value, (newValue) => {
  if (newValue) {
    loadAlerts();
  } else {
    alerts.value = [];
  }
});

// New reactive references
const activeFeature = ref(null);

// Features data
const features = [
  {
    icon: 'fas fa-bell',
    title: 'Real-time Alerts',
    description: 'Receive instant notifications about emergencies and critical updates in your area.',
    route: '/alerts',
    cta: 'View Active Alerts'
  },
  {
    icon: 'fas fa-map-marked-alt',
    title: 'Interactive Maps',
    description: 'Access detailed hazard maps and evacuation routes for your location.',
    route: '/hazard-map',
    cta: 'Explore Map'
  },
  {
    icon: 'fas fa-route',
    title: 'Evacuation Routes',
    description: 'Find safe evacuation routes and emergency gathering points near you.',
    route: '/evacuation-route',
    cta: 'Plan Your Route'
  },
  {
    icon: 'fas fa-clipboard-check',
    title: 'Emergency Checklists',
    description: 'Stay prepared with customizable emergency supply checklists and guides.',
    route: '/checklist',
    cta: 'View Checklist'
  }
];

const navigateToFeature = (route) => {
  router.push(route);
};
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f8fafc;
}

/* Hero Section with improved design */
.hero-section {
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  padding: 6rem 2rem;
  position: relative;
  overflow: hidden;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 1;
  color: white;
  animation: fadeInUp 1s ease;
}

.hero-content h1 {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 4px rgba(0, 92, 92, 0.2);
  animation: slideInLeft 1s ease;
}

.hero-content p {
  font-size: clamp(1.1rem, 2vw, 1.25rem);
  margin-bottom: 2.5rem;
  line-height: 1.6;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  opacity: 0.95;
  animation: slideInRight 1s ease 0.2s;
  animation-fill-mode: backwards;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  animation: fadeIn 1s ease 0.4s;
  animation-fill-mode: backwards;
}

/* Features Section */
.features-section {
  padding: 6rem 2rem;
  background: linear-gradient(to bottom, #f0f9ff, #ffffff);
}

.features-section h2 {
  text-align: center;
  font-size: clamp(2rem, 4vw, 2.5rem);
  color: #005C5C;
  margin-bottom: 4rem;
  font-weight: 700;
  position: relative;
}

.features-section h2::after {
  content: '';
  position: absolute;
  bottom: -1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: linear-gradient(to right, #00D1D1, #4052D6);
  border-radius: 2px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  padding: 0 1rem;
}

.feature-card {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 173, 173, 0.1);
  box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  animation: fadeInUp 0.6s ease;
  animation-fill-mode: backwards;
  transform-origin: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 92, 92, 0.15);
}

.feature-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover .feature-icon {
  transform: scale(1.15) rotate(10deg);
  color: #00D1D1;
}

.feature-icon i {
  font-size: 2rem;
  color: white;
}

.feature-card h3 {
  color: #005C5C;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.feature-card p {
  color: #00ADAD;
  line-height: 1.7;
  font-size: 1.1rem;
}

/* CTA Section */
.cta-section {
  background: linear-gradient(135deg, #005C5C 0%, #4052D6 100%);
  padding: 6rem 2rem;
  color: white;
  position: relative;
}

.cta-content {
  max-width: 800px;
  margin: 0 auto;
}

.cta-content h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.cta-content p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

/* Buttons */
.primary-btn, .secondary-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.primary-btn {
  background: #00D1D1;
  color: white;
  border: none;
}

.primary-btn:hover {
  background: #00ADAD;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 173, 173, 0.2);
}

.secondary-btn {
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.cta-btn {
  background: #00D1D1;
  color: white;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 209, 209, 0.3);
}

.cta-btn:hover {
  background: #00ADAD;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 209, 209, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2.25rem;
  }

  .hero-content p {
    font-size: 1.1rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    padding: 0;
  }

  .cta-content h2 {
    font-size: 1.75rem;
  }

  .hero-actions, .cta-actions {
    flex-direction: column;
    gap: 1rem;
  }

  .primary-btn, .cta-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Add new styles for dashboard preview */
.dashboard-preview {
  background: #f8fafc;
  padding: 4rem 2rem;
}

.preview-content {
  max-width: 1400px;
  margin: 0 auto;
}

.preview-content h2 {
  text-align: center;
  font-size: 2rem;
  color: #1f2937;
  margin-bottom: 2rem;
}

.quick-access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 0 1rem;
}

.quick-access-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border: 1px solid rgba(0, 173, 173, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-access-btn:hover {
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.05) 0%, rgba(64, 82, 214, 0.05) 100%);
  border-color: #00D1D1;
  transform: translateY(-3px);
}

.quick-access-btn i {
  color: #4052D6;
  font-size: 1.75rem;
}

.alert-count {
  background: #00D1D1;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  position: absolute;
  top: 1rem;
  right: 1rem;
  animation: pulse 2s infinite;
}

/* Add some animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger feature cards animation */
.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.2s; }
.feature-card:nth-child(3) { animation-delay: 0.3s; }
.feature-card:nth-child(4) { animation-delay: 0.4s; }

/* Add hover effects */
.quick-access-btn i {
  transition: transform 0.3s ease;
}

.quick-access-btn:hover i {
  transform: scale(1.1);
}

.feature-icon {
  transition: transform 0.3s ease;
}

.feature-card:hover .feature-icon {
  transform: rotate(5deg);
}

.recent-news-section {
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.05) 0%, rgba(64, 82, 214, 0.05) 100%);
  padding: 4rem 2rem;
  border-bottom: 1px solid rgba(0, 173, 173, 0.1);
  position: relative;
  overflow: hidden;
}

.recent-news-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 209, 209, 0.2), transparent);
}

.recent-news-content h2 {
  text-align: center;
  font-size: 2.25rem;
  background: linear-gradient(135deg, #005C5C 0%, #4052D6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2.5rem;
  position: relative;
  display: inline-block;
  left: 50%;
  transform: translateX(-50%);
}

.recent-news-content h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #00D1D1, #4052D6);
  border-radius: 2px;
}

.news-preview {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 92, 92, 0.08);
  border: 1px solid rgba(0, 173, 173, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: slideInUp 0.8s ease;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.news-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #00D1D1, #4052D6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.news-preview:hover {
  transform: translateY(-8px) scale(1.01);
}

.news-preview:hover::before {
  opacity: 1;
}

.news-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 173, 173, 0.1);
}

.author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author i {
  font-size: 1.75rem;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.news-preview h3 {
  font-size: 1.75rem;
  color: #1f2937;
  margin-bottom: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

.news-preview p {
  color: #4b5563;
  line-height: 1.8;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.view-more-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.75rem;
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(0, 209, 209, 0.2);
}

.view-more-btn:hover {
  transform: translateX(5px);
  box-shadow: 0 6px 16px rgba(0, 209, 209, 0.3);
}

.view-more-btn i {
  transition: transform 0.3s ease;
}

.view-more-btn:hover i {
  transform: translateX(3px);
}

/* New Animations */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Quick Access Button Enhanced */
.quick-access-btn {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeIn 0.5s ease;
}

.quick-access-btn:hover {
  transform: translateY(-5px);
  background: linear-gradient(135deg, rgba(0, 209, 209, 0.1) 0%, rgba(64, 82, 214, 0.1) 100%);
}

.quick-access-btn i {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-access-btn:hover i {
  transform: scale(1.2) rotate(5deg);
  background: linear-gradient(135deg, #00D1D1 0%, #4052D6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Alert Count Enhanced */
.alert-count {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Enhanced Hero Section */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.875rem;
  color: white;
  margin-bottom: 1rem;
  backdrop-filter: blur(4px);
  animation: slideInDown 0.5s ease;
}

.gradient-text {
  background: linear-gradient(135deg, #ffffff 0%, #e0f2f2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-stats {
  display: flex;
  gap: 2rem;
  margin-top: 3rem;
  animation: fadeInUp 0.8s ease;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

/* Enhanced Feature Cards */
.feature-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.feature-hover-content {
  position: absolute;
  bottom: -50px;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 209, 209, 0.1), transparent);
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
  opacity: 0;
}

.feature-card:hover .feature-hover-content {
  bottom: 0;
  opacity: 1;
}

.feature-card.active {
  transform: translateY(-5px);
}

/* Enhanced News Preview */
.news-preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.news-stats {
  display: flex;
  gap: 1rem;
  color: #64748b;
  font-size: 0.875rem;
}

.news-stats span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Add new animations */
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
