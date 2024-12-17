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
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
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
      ]
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
      ]
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
      ]
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
      ]
    }
  ]
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
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
  }
  
  .guide-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .guide-header i {
    font-size: 1.5rem;
    color: #00D1D1;
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
  </style>