<template>
    <div class="about-container">
        <div class="about-content">
            <div class="about-header">
                <img src="https://res.cloudinary.com/dmgivh17b/image/upload/v1738070429/disaster-app/rjyns1rbxugjxcjw3fi1.png" alt="PDRRMC Logo" class="header-logo">
                <h1>About PDRRMC Abra</h1>
            </div>

            <div class="about-section">
                <p>The Provincial Disaster Risk Reduction and Management Council (PDRRMC) of Abra office is situated in Old APH Compound, Abra-Ilocos Norte Road Calaba, Bangued, Abra. It was constructed under the leadership of Governor Eustaquio P. Bersamin and was inaugurated on October 8, 2015 in the service of Abrenios. Presently, the PDRRMC is being managed by the current Governor Dominic Valera and PDO/ PDRRMO Designate Mr. Arnel D. Valdez.</p>
            </div>

            <div class="mission-section">
                <h2><i class="fas fa-bullseye"></i> Our Mission</h2>
                <p>Our Mission is to provide timely and appropriate response in times of emergencies or disasters to:</p>
                <ul>
                    <li>Attain Zero-casualty.</li>
                    <li>Capacitate constituents and establish/build effective, DRRM systems and infrastructure towards a safer Abra.</li>
                    <li>Fully equip DRRM officers for disaster preparedness and effective response and management of calamity victims.</li>
                    <li>Enable people to become proactive in times of calamities/emergencies of any form so that they can protect themselves to lessen the impact of calamities.</li>
                    <li>To enable calamity/emergency victims to hasten their own rehabilitation with minimal outside support and assistance.</li>
                </ul>
            </div>

            <div class="vision-section">
                <h2><i class="fas fa-eye"></i> Our Vision</h2>
                <ul>
                    <li>A proactive and resilient province/DRRM office capable and ready to respond to any and all kinds of risks and disasters emergencies to attain zero casualty and manage the rehabilitation of all victims of calamities.</li>
                    <li>Abra is envisioned to be a disaster risk resilient province through an able prepared and well-equipped Abra local disaster risk reduction and management office.</li>
                </ul>
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
                        <h3>Girly Oghoc</h3>
                        <p>Lead Developer</p>
                    </div>
                    <div class="team-member">
                        <div class="member-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <h3>Carlo Gaban</h3>
                        <p>Member</p>
                    </div>
                    <div class="team-member">
                        <div class="member-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <h3>John Marc Oriol</h3>
                        <p>Member</p>
                    </div>
                </div>
            </div>

            <div class="contact-section">
                <h2><i class="fas fa-envelope"></i> Contact Us</h2>
                <p>Have questions or suggestions? We'd love to hear from you!</p>
                <router-link to="/contact" class="contact-button">
                    <i class="fas fa-paper-plane"></i>
                    Send us a message
                </router-link>
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

.header-logo {
    width: 80px;
    height: 80px;
    margin-bottom: 1rem;
    object-fit: contain;
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

.about-section {
    margin-bottom: 3rem;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 8px;
    line-height: 1.6;
}

.vision-section {
    margin-bottom: 3rem;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 8px;
}

.mission-section ul,
.vision-section ul {
    list-style-type: none;
    padding-left: 1.5rem;
}

.mission-section li,
.vision-section li {
    margin-bottom: 1rem;
    position: relative;
}

.mission-section li:before,
.vision-section li:before {
    content: "•";
    color: #00D1D1;
    font-weight: bold;
    position: absolute;
    left: -1.5rem;
}
</style> 