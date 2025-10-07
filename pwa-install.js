// ========== PWA Install Functionality ==========

let deferredPrompt;
const PWA_DISMISS_KEY = 'pwaPopupDismissed';
const PWA_INSTALLED_KEY = 'pwaInstalled';

// Check if popup should be shown
function shouldShowPopup() {
    // Don't show if already installed
    if (localStorage.getItem(PWA_INSTALLED_KEY) === 'true') {
        return false;
    }
    
    // Don't show if dismissed in last 7 days
    const dismissedTime = localStorage.getItem(PWA_DISMISS_KEY);
    if (dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
            return false;
        }
    }
    
    return true;
}

// Show PWA install popup
function showInstallPopup() {
    if (!shouldShowPopup()) {
        return;
    }
    
    const popup = document.getElementById('pwa-install-popup');
    if (popup) {
        // Show popup after 5 seconds
        setTimeout(() => {
            popup.classList.remove('hidden');
        }, 5000);
    }
}

// Hide PWA install popup
function hideInstallPopup() {
    const popup = document.getElementById('pwa-install-popup');
    if (popup) {
        popup.classList.add('hidden');
    }
}

// Handle install button click
async function handleInstall() {
    if (!deferredPrompt) {
        alert('PWA installation is not available on this device/browser.');
        hideInstallPopup();
        return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
    } else {
        console.log('User dismissed the install prompt');
    }
    
    // Clear the deferredPrompt
    deferredPrompt = null;
    hideInstallPopup();
}

// Handle later button click
function handleLater() {
    localStorage.setItem(PWA_DISMISS_KEY, Date.now().toString());
    hideInstallPopup();
}

// Handle close button click
function handleClose() {
    localStorage.setItem(PWA_DISMISS_KEY, Date.now().toString());
    hideInstallPopup();
}

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show custom install popup
    showInstallPopup();
});

// Listen for app installed event
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    localStorage.setItem(PWA_INSTALLED_KEY, 'true');
    hideInstallPopup();
    
    // Show success message
    showInstallSuccessMessage();
});

// Show install success message
function showInstallSuccessMessage() {
    // Create temporary success message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--success-color);
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        font-weight: 600;
        animation: slideDown 0.3s ease-out;
    `;
    message.textContent = '✓ App installed successfully!';
    document.body.appendChild(message);
    
    // Remove after 3 seconds
    setTimeout(() => {
        message.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

// Check if running as PWA
function isRunningAsPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
}

// Initialize PWA install functionality
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners
    const installBtn = document.getElementById('pwa-install');
    const laterBtn = document.getElementById('pwa-later');
    const closeBtn = document.getElementById('pwa-close');
    
    if (installBtn) {
        installBtn.addEventListener('click', handleInstall);
    }
    
    if (laterBtn) {
        laterBtn.addEventListener('click', handleLater);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', handleClose);
    }
    
    // Check if running as PWA
    if (isRunningAsPWA()) {
        console.log('Running as PWA');
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
        hideInstallPopup();
    }
    
    // Show popup if conditions are met
    if ('serviceWorker' in navigator) {
        showInstallPopup();
    }
});

// Handle online/offline status for PWA
if (isRunningAsPWA()) {
    window.addEventListener('online', () => {
        showNotification('✓ Back online!', 'success');
    });
    
    window.addEventListener('offline', () => {
        showNotification('⚠ You are offline. Only cached games available.', 'warning');
    });
}

// Show notification helper
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'var(--success-color)' : 
                    type === 'warning' ? '#f59e0b' : 
                    'var(--primary-color)';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        font-weight: 600;
        animation: slideLeft 0.3s ease-out;
        max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideLeft {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
