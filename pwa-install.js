// ===== PWA Install Prompt =====

let deferredPrompt;
const pwaPrompt = document.getElementById('pwaPrompt');
const installBtn = document.getElementById('installBtn');
const dismissBtn = document.getElementById('dismissBtn');

const PWA_DISMISSED_KEY = 'pwaDismissed';
const PWA_INSTALLED_KEY = 'pwaInstalled';

// Check if PWA is already installed
function isPWAInstalled() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    
    // Check if previously installed
    return localStorage.getItem(PWA_INSTALLED_KEY) === 'true';
}

// Check if prompt was dismissed recently
function wasRecentlyDismissed() {
    const dismissedTime = localStorage.getItem(PWA_DISMISSED_KEY);
    if (!dismissedTime) return false;
    
    // Show again after 7 days
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - parseInt(dismissedTime)) < sevenDaysInMs;
}

// Show PWA install prompt
function showPWAPrompt() {
    // Don't show if already installed or recently dismissed
    if (isPWAInstalled() || wasRecentlyDismissed()) {
        return;
    }
    
    // Show prompt after a delay for better UX
    setTimeout(() => {
        pwaPrompt.style.display = 'block';
    }, 3000); // Show after 3 seconds
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show custom install prompt
    showPWAPrompt();
});

// Install button click handler
installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
        // Fallback for browsers that don't support beforeinstallprompt
        alert('To install this app:\n\n' +
              'On Chrome/Edge: Click the menu (⋮) and select "Install app"\n' +
              'On Safari: Tap Share (⎆) and select "Add to Home Screen"');
        return;
    }
    
    // Hide the prompt
    pwaPrompt.style.display = 'none';
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
        console.log('PWA install accepted');
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
    } else {
        console.log('PWA install dismissed');
        localStorage.setItem(PWA_DISMISSED_KEY, Date.now().toString());
    }
    
    // Clear the deferredPrompt
    deferredPrompt = null;
});

// Dismiss button click handler
dismissBtn.addEventListener('click', () => {
    pwaPrompt.style.display = 'none';
    localStorage.setItem(PWA_DISMISSED_KEY, Date.now().toString());
});

// Listen for successful PWA installation
window.addEventListener('appinstalled', (e) => {
    console.log('PWA installed successfully');
    localStorage.setItem(PWA_INSTALLED_KEY, 'true');
    pwaPrompt.style.display = 'none';
    
    // Show a thank you message
    showInstallSuccessMessage();
});

// Show success message after installation
function showInstallSuccessMessage() {
    const successMessage = document.createElement('div');
    successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        font-weight: 600;
        animation: slideDown 0.5s ease;
    `;
    successMessage.textContent = '🎉 App installed successfully! Enjoy gaming!';
    document.body.appendChild(successMessage);
    
    // Remove after 5 seconds
    setTimeout(() => {
        successMessage.style.animation = 'slideUp 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(successMessage);
        }, 500);
    }, 5000);
}

// Detect if running in standalone mode (PWA is installed and running)
if (isPWAInstalled()) {
    console.log('Running as installed PWA');
    
    // Add special styling or features for installed PWA
    document.documentElement.classList.add('pwa-installed');
}

// Handle iOS Safari add to home screen
function isIOSSafari() {
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    const iOSSafari = iOS && webkit && !ua.match(/CriOS/i);
    return iOSSafari;
}

// Show iOS-specific install instructions
function showIOSInstallInstructions() {
    if (isIOSSafari() && !isPWAInstalled() && !wasRecentlyDismissed()) {
        setTimeout(() => {
            const iosPrompt = document.createElement('div');
            iosPrompt.className = 'pwa-install-prompt';
            iosPrompt.innerHTML = `
                <div class="pwa-prompt-content">
                    <div class="pwa-prompt-icon">📱</div>
                    <div class="pwa-prompt-text">
                        <h4>Install Gaming Portal</h4>
                        <p>Tap the Share button <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> and select "Add to Home Screen"</p>
                    </div>
                    <div class="pwa-prompt-actions">
                        <button class="pwa-btn pwa-btn-secondary" id="iosDismissBtn">Got it</button>
                    </div>
                </div>
            `;
            document.body.appendChild(iosPrompt);
            
            document.getElementById('iosDismissBtn').addEventListener('click', () => {
                iosPrompt.remove();
                localStorage.setItem(PWA_DISMISSED_KEY, Date.now().toString());
            });
        }, 3000);
    }
}

// Initialize iOS instructions
if (isIOSSafari()) {
    showIOSInstallInstructions();
}

// Update app when new version is available
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload the page when a new service worker takes control
        window.location.reload();
    });
}

// Handle updates
async function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            registration.update();
        }
    }
}

// Check for updates every hour
setInterval(checkForUpdates, 60 * 60 * 1000);

// Show update notification
navigator.serviceWorker?.ready.then(registration => {
    registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is installed, show update notification
                showUpdateNotification();
            }
        });
    });
});

function showUpdateNotification() {
    const updateNotification = document.createElement('div');
    updateNotification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 1rem;
        font-weight: 600;
        max-width: 90%;
    `;
    updateNotification.innerHTML = `
        <span>🎉 New version available!</span>
        <button style="
            background: white;
            color: #6366f1;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.25rem;
            font-weight: 600;
            cursor: pointer;
        " onclick="window.location.reload()">Update Now</button>
    `;
    document.body.appendChild(updateNotification);
}

// Share API integration (if available)
if (navigator.share) {
    // Add share button functionality if needed
    window.shareGame = async (gameName, gameUrl) => {
        try {
            await navigator.share({
                title: `Play ${gameName}`,
                text: `Check out this awesome game: ${gameName}`,
                url: gameUrl || window.location.href
            });
        } catch (err) {
            console.log('Error sharing:', err);
        }
    };
}

// Log PWA status
console.log('PWA Features:', {
    serviceWorker: 'serviceWorker' in navigator,
    standalone: window.matchMedia('(display-mode: standalone)').matches,
    installed: isPWAInstalled(),
    share: 'share' in navigator,
    notifications: 'Notification' in window
});
