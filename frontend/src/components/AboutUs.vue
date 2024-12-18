<template>
    <div class="about-container">
        <div class="about-content">
            <div class="about-header">
                <i class="fas fa-shield-alt header-icon"></i>
                <h1>About SafeAlert</h1>
            </div>

            <div class="mission-section">
                <h2><i class="fas fa-bullseye"></i> Our Mission</h2>
                <p>To provide real-time disaster alerts and emergency response information, helping communities stay safe and prepared during critical situations.</p>
            </div>

            <div class="features-section">
                <h2><i class="fas fa-star"></i> Key Features</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <i class="fas fa-bell"></i>
                        <h3>Real-time Alerts</h3>
                        <p>Instant notifications about natural disasters and emergencies in your area.</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-map-marked-alt"></i>
                        <h3>Interactive Map</h3>
                        <p>Visual representation of hazards, safe zones, and emergency facilities.</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-route"></i>
                        <h3>Evacuation Routes</h3>
                        <p>Quick access to safe evacuation paths and emergency shelters.</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>Emergency Checklists</h3>
                        <p>Customizable preparation guides for different types of disasters.</p>
                    </div>
                </div>
            </div>

            <div class="team-section">
                <h2><i class="fas fa-users"></i> Our Team</h2>
                <div class="team-grid">
                    <div class="team-member">
                        <div class="member-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <h3>Richmond Zedrik Aspacio</h3>
                        <p>Lead Developer</p>
                    </div>
                    <div class="team-member">
                        <div class="member-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <h3>Jane Smith</h3>
                        <p>Emergency Response Expert</p>
                    </div>
                    <div class="team-member">
                        <div class="member-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <h3>Mike Johnson</h3>
                        <p>Data Analyst</p>
                    </div>
                </div>
            </div>

            <div class="contact-section">
                <h2><i class="fas fa-envelope"></i> Contact Us</h2>
                <p>Have questions or suggestions? We'd love to hear from you!</p>
                <a href="mailto:contact@disasteralert.com" class="contact-button">
                    <i class="fas fa-paper-plane"></i>
                    Send us a message
                </a>
            </div>
        </div>
    </div>
</template>

<style scoped>
.about-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    color: #333;
}

.about-content {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.about-header {
    text-align: center;
    margin-bottom: 3rem;
}

.header-icon {
    font-size: 3rem;
    color: #2563eb;
    margin-bottom: 1rem;
}

h1 {
    font-size: 2.5rem;
    color: #2c3e50;
    margin: 0;
}

h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #2c3e50;
    margin-bottom: 1.5rem;
}

h2 i {
    color: #2563eb;
}

.mission-section {
    margin-bottom: 3rem;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 8px;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
}

.feature-card {
    padding: 1.5rem;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    text-align: center;
    transition: all 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
    border: 1px solid #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}

.feature-card i {
    font-size: 2rem;
    color: #2563eb;
    margin-bottom: 1rem;
}

.team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.team-member {
    text-align: center;
}

.member-avatar {
    width: 100px;
    height: 100px;
    margin: 0 auto 1rem;
    background: #f8f9fa;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.member-avatar i {
    font-size: 3rem;
    color: #2563eb;
}

.contact-section {
    text-align: center;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 8px;
}

.contact-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #2563eb;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    margin-top: 1rem;
    transition: all 0.3s ease;
}

.contact-button:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
}

@media (max-width: 768px) {
    .about-container {
        padding: 1rem;
    }

    .about-content {
        padding: 1.5rem;
    }

    .features-grid {
        grid-template-columns: 1fr;
    }

    .team-grid {
        grid-template-columns: 1fr;
    }

    h1 {
        font-size: 2rem;
    }
}
</style> 