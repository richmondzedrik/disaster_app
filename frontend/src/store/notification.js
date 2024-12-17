import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', {
    state: () => ({
        notifications: []
    }),
    
    actions: {
        show(message, type = 'info', timeout = 3000) {
            const id = Date.now();
            this.notifications.push({ id, message, type });
            
            setTimeout(() => {
                this.remove(id);
            }, timeout);
        },
        
        remove(id) {
            this.notifications = this.notifications.filter(n => n.id !== id);
        },
        
        success(message) {
            this.show(message, 'success');
        },
        
        error(message) {
            this.show(message, 'error', 5000);
        },
        
        info(message) {
            this.show(message, 'info');
        }
    }
}); 