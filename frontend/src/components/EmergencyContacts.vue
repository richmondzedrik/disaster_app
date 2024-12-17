<template>
    <div class="emergency-contacts">
      <div class="header">
        <h1>Emergency Contacts</h1>
        <p>Important contact numbers for emergency situations</p>
      </div>
  
      <div class="contacts-grid">
        <div class="contact-card">
          <i class="fas fa-ambulance"></i>
          <h3>Medical Emergency</h3>
          <p class="number">911</p>
        </div>
  
        <div class="contact-card">
          <i class="fas fa-fire-extinguisher"></i>
          <h3>Fire Department</h3>
          <p class="number">911</p>
        </div>
  
        <div class="contact-card">
          <i class="fas fa-shield-alt"></i>
          <h3>Police</h3>
          <p class="number">911</p>
        </div>
  
        <div class="contact-card">
          <i class="fas fa-phone-alt"></i>
          <h3>Emergency Hotline</h3>
          <p class="number">117</p>
        </div>
      </div>
    </div>
  </template>
  
  <style scoped>
  .emergency-contacts {
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
  
  .contacts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }
  
  .contact-card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
    transition: transform 0.3s ease;
  }
  
  .contact-card:hover {
    transform: translateY(-5px);
  }
  
  .contact-card i {
    font-size: 2.5rem;
    color: #00D1D1;
    margin-bottom: 1rem;
  }
  
  .contact-card h3 {
    color: #2c3e50;
    margin-bottom: 1rem;
  }
  
  .contact-card .number {
    font-size: 1.5rem;
    font-weight: bold;
    color: #00ADAD;
  }
  </style>