// Supabase Client Configuration for Real-time Features
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Real-time subscription class
class RealtimeManager {
    constructor() {
        this.subscriptions = new Map();
    }

    // Subscribe to user changes
    subscribeToUsers(callback) {
        const subscription = supabase
            .channel('users_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'users' }, 
                (payload) => {
                    console.log('User change:', payload);
                    callback(payload);
                }
            )
            .subscribe();

        this.subscriptions.set('users', subscription);
        return subscription;
    }

    // Subscribe to doctor changes
    subscribeToDoctors(callback) {
        const subscription = supabase
            .channel('doctors_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'doctors' }, 
                (payload) => {
                    console.log('Doctor change:', payload);
                    callback(payload);
                }
            )
            .subscribe();

        this.subscriptions.set('doctors', subscription);
        return subscription;
    }

    // Subscribe to appointment changes
    subscribeToAppointments(callback) {
        const subscription = supabase
            .channel('appointments_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'appointments' }, 
                (payload) => {
                    console.log('Appointment change:', payload);
                    callback(payload);
                }
            )
            .subscribe();

        this.subscriptions.set('appointments', subscription);
        return subscription;
    }

    // Subscribe to department changes
    subscribeToDepartments(callback) {
        const subscription = supabase
            .channel('departments_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'departments' }, 
                (payload) => {
                    console.log('Department change:', payload);
                    callback(payload);
                }
            )
            .subscribe();

        this.subscriptions.set('departments', subscription);
        return subscription;
    }

    // Unsubscribe from specific channel
    unsubscribe(channelName) {
        const subscription = this.subscriptions.get(channelName);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(channelName);
        }
    }

    // Unsubscribe from all channels
    unsubscribeAll() {
        this.subscriptions.forEach((subscription, channelName) => {
            subscription.unsubscribe();
        });
        this.subscriptions.clear();
    }
}

// Real-time notification manager
class NotificationManager {
    constructor() {
        this.realtimeManager = new RealtimeManager();
        this.setupNotifications();
    }

    setupNotifications() {
        // Subscribe to appointment changes for real-time notifications
        this.realtimeManager.subscribeToAppointments((payload) => {
            this.handleAppointmentChange(payload);
        });

        // Subscribe to doctor changes
        this.realtimeManager.subscribeToDoctors((payload) => {
            this.handleDoctorChange(payload);
        });
    }

    handleAppointmentChange(payload) {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
            case 'INSERT':
                this.showNotification('New Appointment', 'A new appointment has been created!', 'info');
                break;
            case 'UPDATE':
                if (newRecord.status && !oldRecord.status) {
                    this.showNotification('Appointment Approved', 'Your appointment has been approved!', 'success');
                }
                break;
            case 'DELETE':
                this.showNotification('Appointment Cancelled', 'An appointment has been cancelled.', 'warning');
                break;
        }
    }

    handleDoctorChange(payload) {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
            case 'INSERT':
                this.showNotification('New Doctor', 'A new doctor has joined the hospital!', 'info');
                break;
            case 'UPDATE':
                if (newRecord.status && !oldRecord.status) {
                    this.showNotification('Doctor Approved', 'A doctor has been approved!', 'success');
                }
                break;
        }
    }

    showNotification(title, message, type = 'info') {
        // Use SweetAlert for notifications
        if (typeof swal !== 'undefined') {
            swal({
                title: title,
                text: message,
                icon: type,
                timer: 3000,
                buttons: false
            });
        } else {
            // Fallback to browser notifications
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, { body: message });
            } else {
                // Fallback to console
                console.log(`${title}: ${message}`);
            }
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// Dashboard real-time updates
class DashboardRealtime {
    constructor() {
        this.realtimeManager = new RealtimeManager();
        this.setupDashboardUpdates();
    }

    setupDashboardUpdates() {
        // Update dashboard stats in real-time
        this.realtimeManager.subscribeToUsers(() => {
            this.updateUserStats();
        });

        this.realtimeManager.subscribeToDoctors(() => {
            this.updateDoctorStats();
        });

        this.realtimeManager.subscribeToAppointments(() => {
            this.updateAppointmentStats();
        });
    }

    async updateUserStats() {
        try {
            const response = await fetch('/admin/userStats');
            const data = await response.json();
            
            // Update UI elements
            const totalUsersElement = document.getElementById('total-pat');
            if (totalUsersElement) {
                totalUsersElement.textContent = data.totalUsers;
            }
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    async updateDoctorStats() {
        try {
            const response = await fetch('/admin/doctorStats');
            const data = await response.json();
            
            // Update UI elements
            const totalDoctorsElement = document.getElementById('total-doc');
            const pendingDoctorsElement = document.getElementById('doc-approvals');
            
            if (totalDoctorsElement) {
                totalDoctorsElement.textContent = data.totalDoctors;
            }
            if (pendingDoctorsElement) {
                pendingDoctorsElement.textContent = data.pendingDoctors;
            }
        } catch (error) {
            console.error('Error updating doctor stats:', error);
        }
    }

    async updateAppointmentStats() {
        try {
            const response = await fetch('/admin/appointmentStats');
            const data = await response.json();
            
            // Update UI elements
            const totalAppointmentsElement = document.getElementById('total-app');
            const pendingAppointmentsElement = document.getElementById('app-approvals');
            
            if (totalAppointmentsElement) {
                totalAppointmentsElement.textContent = data.total;
            }
            if (pendingAppointmentsElement) {
                pendingAppointmentsElement.textContent = data.pending;
            }
        } catch (error) {
            console.error('Error updating appointment stats:', error);
        }
    }
}

// Export for use in other modules
export { supabase, RealtimeManager, NotificationManager, DashboardRealtime }; 