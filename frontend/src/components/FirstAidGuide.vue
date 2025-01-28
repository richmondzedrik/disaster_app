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
              <a :href="guide.videoUrl" target="_blank" class="video-link">
                <i class="fas fa-play-circle"></i>
                Watch Tutorial Video
              </a>
            </div>
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
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .guide-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
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
  
  .video-container {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
  }
  
  .video-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #00D1D1;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s ease;
  }
  
  .video-link:hover {
    color: #008B87;
  }
  
  .video-link i {
    font-size: 1.2rem;
  }
  </style>