// /js/headerManager.js
// This script fetches the header, handles authentication state, centers navigation,
// and implements SPA-style page loading for a smoother user experience.

document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) {
        console.error("Header placeholder element not found.");
        return;
    }

    // Fetch the header content and inject it into the placeholder
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch header.html');
            return response.text();
        })
        .then(html => {
            headerPlaceholder.innerHTML = html;
            // Once the header is loaded, initialize its dynamic functionality
            initializeHeaderFunctionality();
        })
        .catch(error => {
            console.error('Error loading header:', error);
            headerPlaceholder.innerHTML = "<p class='text-center text-red-500'>Error loading navigation.</p>";
        });
});

/**
 * Initializes all header-related logic after the HTML has been injected.
 */
function initializeHeaderFunctionality() {
    if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined') {
        console.error("Firebase is not available. Header functionality will be limited.");
        return;
    }

    const auth = firebase.auth();

    // Set up a listener that updates the UI whenever the user's login state changes.
    // This is the single source of truth and prevents UI glitches.
    auth.onAuthStateChanged(updateAuthUI);

    // Fix for centering the desktop navigation links
    const desktopNavContainer = document.querySelector('.hidden.md\\:block .flex.items-center.space-x-2');
    if (desktopNavContainer) {
        desktopNavContainer.classList.add('justify-center', 'w-full');
    }

    // Set up mobile menu toggling
    setupMobileMenu(auth);

    // Set up the SPA-style navigation
    interceptNavigationClicks();
    window.addEventListener('popstate', handleBrowserNavigation);
    updateActiveLink(window.location.pathname);
}

/**
 * Updates all UI elements in the header based on whether a user is logged in.
 * @param {firebase.User | null} user The authenticated user object, or null if logged out.
 */
function updateAuthUI(user) {
    const isLoggedIn = !!user;

    // Toggle visibility of desktop login/profile links
    document.getElementById('authLinkDesktopLogin')?.classList.toggle('hidden', isLoggedIn);
    document.getElementById('profileLinkDesktop')?.classList.toggle('hidden', !isLoggedIn);

    // Update the profile picture in the main header
    const navProfilePic = document.getElementById('navProfilePic');
    if (navProfilePic) {
        if (isLoggedIn) {
            navProfilePic.src = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${user.email[0].toUpperCase()}`;
            navProfilePic.classList.remove('hidden');
        } else {
            navProfilePic.classList.add('hidden');
        }
    }


    // Update the slide-out mobile menu based on login state
    document.getElementById('slideout-user-info')?.classList.toggle('hidden', !isLoggedIn);
    document.getElementById('authLinkMobile')?.classList.toggle('hidden', isLoggedIn);
    document.getElementById('bottomProfileLinkMobile')?.classList.toggle('hidden', !isLoggedIn);
    document.getElementById('logoutButtonMobile')?.classList.toggle('hidden', !isLoggedIn);

    if (isLoggedIn) {
        document.getElementById('slideoutProfilePic').src = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${user.email[0].toUpperCase()}`;
        document.getElementById('slideoutDisplayName').textContent = user.displayName || 'User';
        document.getElementById('slideoutEmail').textContent = user.email ? `@${user.email.split('@')[0]}` : '';
    }
}

/**
 * Sets up the event listeners for opening and closing the mobile slideout menu.
 * @param {firebase.auth.Auth} auth The Firebase auth instance.
 */
function setupMobileMenu(auth) {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const closeButton = document.getElementById('mobile-menu-close-button');
    const overlay = document.getElementById('menu-overlay');
    const slideoutMenu = document.getElementById('mobile-slideout-menu');
    const logoutButton = document.getElementById('logoutButtonMobile');

    const openMenu = () => {
        slideoutMenu?.classList.remove('translate-x-full');
        overlay?.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    };

    const closeMenu = () => {
        slideoutMenu?.classList.add('translate-x-full');
        overlay?.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    };

    mobileMenuButton?.addEventListener('click', openMenu);
    closeButton?.addEventListener('click', closeMenu);
    overlay?.addEventListener('click', closeMenu);
    logoutButton?.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut();
        closeMenu();
    });
}

/**
 * Intercepts clicks on local navigation links to prevent full-page reloads.
 */
function interceptNavigationClicks() {
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');

        // Ignore clicks that aren't on local links or are meant to open in a new tab
        if (!link || link.target === '_blank' || link.href.startsWith('http') || link.hash) {
            return;
        }

        e.preventDefault();
        const destinationPath = new URL(link.href).pathname;

        if (window.location.pathname !== destinationPath) {
            window.history.pushState({ path: destinationPath }, '', destinationPath);
            loadPageContent(destinationPath);
        }

        // Close the mobile menu after navigation
        document.getElementById('mobile-slideout-menu')?.classList.add('translate-x-full');
        document.getElementById('menu-overlay')?.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    });
}

/**
 * Fetches and displays page content without a full refresh.
 * @param {string} path The path of the page to load.
 */
async function loadPageContent(path) {
    const mainContentArea = document.querySelector('main');
    if (!mainContentArea) {
        window.location.href = path; // Fallback to full reload
        return;
    }

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Fetch failed for ${path}`);
        
        const newPageHtml = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(newPageHtml, 'text/html');

        const newMainContent = doc.querySelector('main');
        const newTitle = doc.querySelector('title');

        if (newMainContent) {
            mainContentArea.innerHTML = newMainContent.innerHTML;
            document.title = newTitle ? newTitle.textContent : 'Linq';
            
            // Re-execute scripts from the new content to ensure functionality
            newMainContent.querySelectorAll('script').forEach(oldScript => {
                const newScript = document.createElement("script");
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript).parentNode.removeChild(newScript);
            });
            
            updateActiveLink(path);
            window.scrollTo(0, 0);
        } else {
            throw new Error(`<main> content not found in ${path}`);
        }
    } catch (error) {
        console.error('SPA Navigation Error:', error);
        window.location.href = path; // Fallback to full reload on error
    }
}

/**
 * Handles browser back/forward button clicks.
 */
function handleBrowserNavigation(event) {
    const path = event.state ? event.state.path : window.location.pathname;
    loadPageContent(path);
}

/**
 * Updates the active state of navigation links to reflect the current page.
 * @param {string} currentPath The current page's path.
 */
function updateActiveLink(currentPath) {
    let pageName = currentPath.split('/').pop();
    if (pageName === '') pageName = 'index.html';

    document.querySelectorAll('nav a').forEach(link => {
        const linkName = new URL(link.href).pathname.split('/').pop();
        if (linkName === pageName || (pageName === 'index.html' && linkName === '')) {
            link.classList.add('active'); // Add a general 'active' class
        } else {
            link.classList.remove('active');
        }
    });
}
