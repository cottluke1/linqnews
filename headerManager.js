// /js/headerManager.js
// This script fetches the header, handles authentication state robustly to prevent UI flickering,
// and manages SPA-style page loading for a smoother user experience.

document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) {
        console.error("Header placeholder element not found.");
        return;
    }

    // Fetch the header content and inject it into the placeholder
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error("Failed to load header.html");
            return response.text();
        })
        .then(html => {
            headerPlaceholder.innerHTML = html;
            // Now that the header DOM is loaded, initialize all functionality
            initializeHeaderFunctionality();
        })
        .catch(error => {
            console.error("Error loading header:", error);
            headerPlaceholder.innerHTML = "<p class='text-center text-red-500 py-4'>Could not load navigation.</p>";
        });
});

/**
 * Initializes all header-related logic AFTER the HTML has been injected.
 * This prevents race conditions and ensures all elements are available.
 */
function initializeHeaderFunctionality() {
    if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined') {
        console.error("Firebase is not available. Header functionality will be limited.");
        return;
    }

    const auth = firebase.auth();

    // Set up a listener that updates the UI whenever the user's login state changes.
    // This is the single source of truth for the auth UI.
    auth.onAuthStateChanged(user => {
        updateAuthUI(user);
    });

    // Set up mobile menu toggling and other interactive elements
    setupInteractiveElements(auth);

    // Set up the SPA-style navigation
    interceptNavigationClicks();
    window.addEventListener('popstate', handleBrowserNavigation);
    updateActiveLink(window.location.pathname);
}

/**
 * Updates all UI elements in the header based on the user's login status.
 * This function is designed to be safely callable at any time.
 * @param {firebase.User | null} user The authenticated user object, or null if logged out.
 */
function updateAuthUI(user) {
    const isLoggedIn = !!user;

    // Desktop Elements
    const authLinkDesktopLogin = document.getElementById('authLinkDesktopLogin');
    const profileLinkDesktop = document.getElementById('profileLinkDesktop');
    const navProfilePic = document.getElementById('navProfilePic');
    
    // Mobile Slideout Elements
    const authLinkMobile = document.getElementById('authLinkMobile');
    const logoutButtonMobile = document.getElementById('logoutButtonMobile');
    const slideoutUserInfo = document.getElementById('slideout-user-info');
    const slideoutProfilePic = document.getElementById('slideoutProfilePic');
    const slideoutDisplayName = document.getElementById('slideoutDisplayName');
    const slideoutEmail = document.getElementById('slideoutEmail');
    const bottomProfileLinkMobile = document.getElementById('bottomProfileLinkMobile');

    // Toggle visibility based on login state
    if (authLinkDesktopLogin) authLinkDesktopLogin.classList.toggle('hidden', isLoggedIn);
    if (profileLinkDesktop) profileLinkDesktop.classList.toggle('hidden', !isLoggedIn);
    if (authLinkMobile) authLinkMobile.classList.toggle('hidden', isLoggedIn);
    if (logoutButtonMobile) logoutButtonMobile.classList.toggle('hidden', !isLoggedIn);
    if (slideoutUserInfo) slideoutUserInfo.classList.toggle('hidden', !isLoggedIn);
    if (bottomProfileLinkMobile) bottomProfileLinkMobile.classList.toggle('hidden', !isLoggedIn);


    if (isLoggedIn && navProfilePic) {
        const photoURL = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${user.email.charAt(0).toUpperCase()}`;
        navProfilePic.src = photoURL;
        if(slideoutProfilePic) slideoutProfilePic.src = photoURL;
        if(slideoutDisplayName) slideoutDisplayName.textContent = user.displayName || 'User';
        if(slideoutEmail) slideoutEmail.textContent = user.email;
    }
}

/**
 * Sets up event listeners for interactive header elements like the mobile menu.
 * @param {firebase.auth.Auth} auth The Firebase auth instance.
 */
function setupInteractiveElements(auth) {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const overlay = document.getElementById('menu-overlay');
    const slideoutMenu = document.getElementById('mobile-slideout-menu');
    const openIcon = document.getElementById('menu-open-icon');
    const closeIcon = document.getElementById('menu-close-icon');

    const toggleMenu = () => {
        const isMenuOpen = !slideoutMenu.classList.contains('translate-x-full');
        slideoutMenu.classList.toggle('translate-x-full', isMenuOpen);
        overlay.classList.toggle('hidden', isMenuOpen);
        document.body.classList.toggle('overflow-hidden', !isMenuOpen);
        if(openIcon) openIcon.classList.toggle('hidden', !isMenuOpen);
        if(closeIcon) closeIcon.classList.toggle('hidden', isMenuOpen);
    };

    mobileMenuButton?.addEventListener('click', toggleMenu);
    overlay?.addEventListener('click', toggleMenu);
    
    // Logout functionality
    const logoutButton = document.getElementById('logoutButtonMobile');
    logoutButton?.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut();
        toggleMenu(); // Close menu on logout
    });
}


// --- SPA Navigation Logic ---

function interceptNavigationClicks() {
    document.body.addEventListener('click', e => {
        const link = e.target.closest('a');
        if (!link || link.target === '_blank' || link.href.startsWith('http') || link.hash) {
            return;
        }
        e.preventDefault();
        const destinationPath = new URL(link.href).pathname;
        if (window.location.pathname !== destinationPath) {
            window.history.pushState({ path: destinationPath }, '', destinationPath);
            loadPageContent(destinationPath);
        }
        const slideoutMenu = document.getElementById('mobile-slideout-menu');
        if(slideoutMenu && !slideoutMenu.classList.contains('translate-x-full')){
             setupInteractiveElements(firebase.auth()); // Re-run toggle to close
        }
    });
}

async function loadPageContent(path) {
    const mainContentArea = document.querySelector('main');
    if (!mainContentArea) {
        window.location.href = path; // Fallback
        return;
    }
    
    // Add a class to fade out the old content
    mainContentArea.style.opacity = '0';
    mainContentArea.style.transition = 'opacity 0.2s ease-out';

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Fetch failed for ${path}`);
        const newPageHtml = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(newPageHtml, 'text/html');
        const newMainContent = doc.querySelector('main');
        const newTitle = doc.querySelector('title');

        if (newMainContent) {
            // Wait for fade out to finish before replacing content
            setTimeout(() => {
                mainContentArea.innerHTML = newMainContent.innerHTML;
                document.title = newTitle ? newTitle.textContent : 'Linq';
                
                // Re-execute necessary scripts from the new content
                const pageScripts = newMainContent.querySelectorAll('script');
                pageScripts.forEach(oldScript => {
                    const newScript = document.createElement("script");
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.textContent = oldScript.textContent;
                    document.body.appendChild(newScript).parentNode.removeChild(newScript);
                });
                
                updateActiveLink(path);
                window.scrollTo(0, 0);
                
                // Fade in the new content
                mainContentArea.style.opacity = '1';
                mainContentArea.style.transition = 'opacity 0.3s ease-in';
            }, 200);

        } else {
            throw new Error(`<main> content not found in ${path}`);
        }
    } catch (error) {
        console.error('SPA Navigation Error:', error);
        window.location.href = path; // Fallback on error
    }
}

function handleBrowserNavigation(event) {
    const path = event.state ? event.state.path : window.location.pathname;
    loadPageContent(path);
}

function updateActiveLink(currentPath) {
    let pageName = currentPath.split('/').pop();
    if (pageName === '' || pageName === 'linqnews') pageName = 'index.html';

    document.querySelectorAll('nav a').forEach(link => {
        const linkHref = link.getAttribute('href');
        link.classList.remove('active'); // General active class for styling
        if (linkHref === pageName) {
            link.classList.add('active');
        }
    });
}
