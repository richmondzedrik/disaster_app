<template>
    <div class="contact-container">
        <div class="contact-content">
            <div class="contact-header">
                <i class="fas fa-envelope header-icon"></i>
                <h1>Contact Us</h1>
                <p>We're here to help! Send us a message and we'll respond as soon as possible.</p>
            </div>

            <div class="contact-form">
                <div class="form-group">
                    <label for="name">
                        <i class="fas fa-user"></i> Name
                    </label>
                    <input 
                        type="text" 
                        id="name" 
                        v-model="formData.name" 
                        placeholder="Your name"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="email">
                        <i class="fas fa-envelope"></i> Email
                    </label>
                    <input 
                        type="email" 
                        id="email" 
                        v-model="formData.email" 
                        placeholder="Your email address"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="subject">
                        <i class="fas fa-heading"></i> Subject
                    </label>
                    <input 
                        type="text" 
                        id="subject" 
                        v-model="formData.subject" 
                        placeholder="Message subject"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="message">
                        <i class="fas fa-comment"></i> Message
                    </label>
                    <textarea 
                        id="message" 
                        v-model="formData.message" 
                        placeholder="Your message"
                        rows="5"
                        required
                    ></textarea>
                </div>

                <button @click="handleSubmit" class="submit-btn" :disabled="loading">
                    <i class="fas fa-paper-plane"></i>
                    {{ loading ? 'Sending...' : 'Send Message' }}
                </button>
            </div>

            <div class="contact-info">
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <h3>Address</h3>
                        <p>Old APH Compound, Abra-Ilocos Norte Road Calaba, Bangued, Abra</p>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-phone"></i>
                    <div>
                        <h3>Hotlines</h3>
                        <p>(074) 752-8158 / 0955-164-5794</p>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-envelope"></i>
                    <div>
                        <h3>Email</h3>
                        <p>pdrrmc.abra@yahoo.com.ph</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useNotificationStore } from '../stores/notification';
import axios from 'axios';

const notificationStore = useNotificationStore();
const loading = ref(false);
const formData = ref({
    name: '',
    email: '',
    subject: '',
    message: ''
});

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const handleSubmit = async () => {
    // Form validation
    if (!formData.value.name || !formData.value.email || !formData.value.subject || !formData.value.message) {
        notificationStore.error('Please fill in all fields');
        return;
    }

    if (!validateEmail(formData.value.email)) {
        notificationStore.error('Please enter a valid email address');
        return;
    }

    loading.value = true;
    try {
        const baseUrl = import.meta.env.VITE_API_URL || 'https://disaster-app-backend.onrender.com';
        const response = await axios.post(`${baseUrl}/api/contact/send`, {
            name: formData.value.name,
            email: formData.value.email,
            subject: formData.value.subject,
            message: formData.value.message,
            toEmail: 'richmondzedrik@gmail.com',
            fromEmail: formData.value.email
        });

        if (response.data.success) {
            notificationStore.success('Message sent successfully! We\'ll get back to you soon.');
            // Reset form
            formData.value = { name: '', email: '', subject: '', message: '' };
        } else {
            throw new Error(response.data.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Contact form error:', error);
        const errorMessage = error.response?.data?.message || 'Failed to send message. Please try again later.';
        notificationStore.error(errorMessage);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.contact-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    color: #333;
}

.contact-content {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.contact-header {
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
    color: #1f2937;
    margin: 0 0 1rem;
}

.contact-form {
    max-width: 600px;
    margin: 0 auto 3rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #4b5563;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

label i {
    color: #2563eb;
}

input, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
}

input:focus, textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.submit-btn:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
}

.submit-btn:disabled {
    background: #93c5fd;
    cursor: not-allowed;
    transform: none;
}

.contact-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    padding: 2rem;
    background: #f8fafc;
    border-radius: 8px;
}

.info-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.info-item i {
    font-size: 1.5rem;
    color: #2563eb;
    margin-top: 0.25rem;
}

.info-item h3 {
    color: #1f2937;
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
}

.info-item p {
    color: #4b5563;
    margin: 0;
}

@media (max-width: 768px) {
    .contact-container {
        padding: 1rem;
    }

    .contact-content {
        padding: 1.5rem;
    }

    h1 {
        font-size: 2rem;
    }

    .contact-info {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
}
</style> 