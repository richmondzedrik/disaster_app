<template>
  <div class="analytics-view">
    <h1>System Analytics</h1>
    
    <div class="analytics-grid">
      <div class="chart-container">
        <h3>User Registration Trends</h3>
        <canvas ref="userTrendsChart"></canvas>
      </div>
      
      <div class="chart-container">
        <h3>Alert Distribution</h3>
        <canvas ref="alertDistChart"></canvas>
      </div>

      <div class="stats-container">
        <h3>System Statistics</h3>
        <div class="stat-item">
          <span>Active Users (24h):</span>
          <strong>{{ stats.activeUsers24h }}</strong>
        </div>
        <div class="stat-item">
          <span>Total Alerts (30d):</span>
          <strong>{{ stats.alertsLast30Days }}</strong>
        </div>
        <div class="stat-item">
          <span>System Uptime:</span>
          <strong>{{ formatUptime(stats.uptime) }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAdminStore } from '@/stores/admin';
import Chart from 'chart.js/auto';

const adminStore = useAdminStore();
const userTrendsChart = ref(null);
const alertDistChart = ref(null);
const stats = ref({
  activeUsers24h: 0,
  alertsLast30Days: 0,
  uptime: 0
});

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
};

onMounted(async () => {
  await adminStore.fetchAnalytics();
  stats.value = adminStore.analytics;
  
  // Initialize charts
  new Chart(userTrendsChart.value, {
    type: 'line',
    data: adminStore.userTrendsData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });

  new Chart(alertDistChart.value, {
    type: 'pie',
    data: adminStore.alertDistributionData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
});
</script>

<style scoped>
.analytics-view {
  padding: 2rem;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.chart-container {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stats-container {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.stat-item:last-child {
  border-bottom: none;
}
</style>