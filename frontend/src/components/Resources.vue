<template>
    <div class="resources">
      <div class="header">
        <h1>Emergency Resources</h1>
        <p>Important resources and information for disaster preparedness in the Philippines</p>
      </div>
  
      <div class="resources-grid">
        <div class="resource-card" v-for="(resource, index) in resources" :key="index">
          <div class="resource-header">
            <i :class="resource.icon"></i>
            <h3>{{ resource.title }}</h3>
          </div>
          <p>{{ resource.description }}</p>
          <div class="resource-links">
            <a v-for="(link, linkIndex) in resource.links" 
               :key="linkIndex" 
               :href="link.url" 
               target="_blank" 
               rel="noopener noreferrer"
               class="resource-link">
              <i class="fas fa-external-link-alt"></i>
              {{ link.text }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const resources = [
    {
      title: 'NDRRMC',
      icon: 'fas fa-shield-alt',
      description: 'National Disaster Risk Reduction and Management Council - Official guidelines and updates.',
      links: [
        { text: 'Official Website', url: 'http://www.ndrrmc.gov.ph/' },
        { text: 'Emergency Operations', url: 'https://monitoring-dashboard.ndrrmc.gov.ph/' }
      ]
    },
    {
      title: 'PAGASA',
      icon: 'fas fa-cloud-sun',
      description: 'Philippine Atmospheric, Geophysical and Astronomical Services Administration.',
      links: [
        { text: 'Weather Updates', url: 'https://www.pagasa.dost.gov.ph/' },
        { text: 'Typhoon Information', url: 'https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin' }
      ]
    },
    {
      title: 'PHIVOLCS',
      icon: 'fas fa-mountain',
      description: 'Philippine Institute of Volcanology and Seismology - Volcanic and seismic monitoring.',
      links: [
        { text: 'Earthquake Information', url: 'https://www.phivolcs.dost.gov.ph/index.php/earthquake/earthquake-information3' },
        { text: 'Volcano Updates', url: 'https://www.phivolcs.dost.gov.ph/index.php/volcano-hazard/volcano-alert-level' }
      ]
    },
    {
      title: 'Red Cross PH',
      icon: 'fas fa-plus-square',
      description: 'Philippine Red Cross - Emergency response and disaster preparedness resources.',
      links: [
        { text: 'Official Website', url: 'https://redcross.org.ph/' },
        { text: 'Blood Services', url: 'https://redcross.org.ph/give-blood/' }
      ]
    }
  ]
  </script>
  
  <style scoped>
  .resources {
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
  
  .resources-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .resource-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
  }
  
  .resource-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .resource-header i {
    font-size: 1.5rem;
    color: #00D1D1;
  }
  
  .resource-header h3 {
    color: #2c3e50;
    margin: 0;
  }
  
  .resource-card p {
    color: #64748b;
    margin-bottom: 1.5rem;
  }
  
  .resource-links {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .resource-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #00D1D1;
    text-decoration: none;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.3s ease;
  }
  
  .resource-link:hover {
    background-color: rgba(0, 209, 209, 0.1);
  }
  </style>