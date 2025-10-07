// ===== PWA Install Functionality =====

let deferredPrompt;
const installBanner = document.getElementById('pwa-install-banner');
const installBtn = document.getElementById('pwa-install-btn');
const closeBtn = document.getElementById('pwa-close-btn');
const PWA_INSTALL_KEY = 'pwa_install_dismissed';
const PWA_INSTALLED_KEY = 'pwa_installed';

// Check if app is already installed or dismissed
function checkPWAStatus() {
    const isDismissed = localStorage.getItem(PWA_INSTALL_KEY);
    const isInstalled = localStorage.getItem(PWA_INSTALLED_KEY);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone || 
                         document.referrer.includes('android-app://');
    
    // If running in standalone mode, mark as installed
    if (isStandalone) {
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
        return true;
    }
    
    // Don't show banner if dismissed or installed
    if (isDismissed || isInstalled) {
        return true;
    }
    
    return false;
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar
    e.preventDefault();
    
    // Store the event for later use
    deferredPrompt = e;
    
    // Check if we should show the banner
    if (!checkPWAStatus()) {
        // Show the install banner after a delay
        setTimeout(() => {
            showInstallBanner();
        }, 3000); // Show after 3 seconds
    }
});

// Show install banner
function showInstallBanner() {
    if (installBanner) {
        installBanner.classList.remove('hidden');
    }
}

// Hide install banner
function hideInstallBanner() {
    if (installBanner) {
        installBanner.classList.add('hidden');
    }
}

// Handle install button click
installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) {
        console.log('Install prompt not available');
        return;
    }
    
    // Hide the banner
    hideInstallBanner();
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
    } else {
        console.log('User dismissed the install prompt');
        localStorage.setItem(PWA_INSTALL_KEY, 'true');
    }
    
    // Clear the deferred prompt
    deferredPrompt = null;
});

// Handle close button click
closeBtn?.addEventListener('click', () => {
    hideInstallBanner();
    
    // Mark as dismissed (will show again on next visit)
    localStorage.setItem(PWA_INSTALL_KEY, 'true');
    
    // Auto-clear dismissal after 7 days
    setTimeout(() => {
        localStorage.removeItem(PWA_INSTALL_KEY);
    }, 7 * 24 * 60 * 60 * 1000);
});

// Listen for app installed event
window.addEventListener('appinstalled', (e) => {
    console.log('PWA was installed successfully');
    
    // Hide the banner
    hideInstallBanner();
    
    // Mark as installed
    localStorage.setItem(PWA_INSTALLED_KEY, 'true');
    
    // Show success message
    showInstallSuccessMessage();
});

// Show success message after installation
function showInstallSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    message.textContent = '✅ App installed successfully!';
    
    document.body.appendChild(message);
    
    // Remove after 3 seconds
    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

// Check if running in standalone mode
function checkStandaloneMode() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone || 
                         document.referrer.includes('android-app://');
    
    if (isStandalone) {
        console.log('Running in standalone mode (PWA)');
        
        // Add PWA class to body for specific styling
        document.body.classList.add('pwa-mode');
        
        // Hide install banner if showing
        hideInstallBanner();
    }
}

// iOS-specific install instructions
function showIOSInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;
    
    if (isIOS && !isInStandaloneMode && !checkPWAStatus()) {
        // Create iOS instructions banner
        const iosBanner = document.createElement('div');
        iosBanner.className = 'pwa-banner';
        iosBanner.id = 'ios-install-banner';
        iosBanner.innerHTML = `
            <div class="pwa-banner-content">
                <span class="pwa-icon">📱</span>
                <div class="pwa-text">
                    <strong>Install on iOS</strong>
                    <p>Tap Share <span style="font-size: 1.2em;">⎋</span> then "Add to Home Screen"</p>
                </div>
                <div class="pwa-actions">
                    <button class="pwa-btn-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
            </div>
        `;
        
        // Show after delay
        setTimeout(() => {
            document.body.insertBefore(iosBanner, document.body.firstChild);
        }, 5000);
    }
}

// Initialize PWA install functionality
document.addEventListener('DOMContentLoaded', () => {
    checkStandaloneMode();
    showIOSInstructions();
});

// Handle visibility change (useful for detecting when app comes back to foreground)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        checkStandaloneMode();
    }
});

// Add CSS animations for success message
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .pwa-mode {
        /* Additional styles for PWA mode if needed */
    }
`;
document.head.appendChild(style);

// Export for potential use in other scripts
window.PWAInstaller = {
    show: showInstallBanner,
    hide: hideInstallBanner,
    isInstalled: () => localStorage.getItem(PWA_INSTALLED_KEY) === 'true'
};
