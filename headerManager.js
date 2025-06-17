// /js/headerManager.js
// This script fetches the header, handles authentication state robustly using localStorage to prevent UI flickering,
// and manages SPA-style page loading for a smoother user experience.

document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) {
        console.error("Header placeholder element not found.");
        return;
    }

    // Fetch the header content. The logic to update the UI will be handled inside the .then() block.
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error("Failed to load header.html");
            return response.text();
        })
        .then(html => {
            // Step 1: Inject the header HTML into the placeholder.
            // The DOM for the header is now available.
            headerPlaceholder.innerHTML = html;

            // Step 2: Get the user data that was cached in localStorage.
            const cachedUser = JSON.parse(localStorage.getItem('linqUser'));
            
            // Step 3: Update the UI immediately with the cached data.
            // This provides an instant visual update and prevents the "logged-out" flicker.
            updateAuthUI(cachedUser);

            // Step 4: Now, initialize the full Firebase functionality.
            // This will set up the live listener to get the absolute latest user data
            // and handle real-time login/logout events.
            initializeFirebaseAndListeners();
        })
        .catch(error => {
            console.error("Error loading header:", error);
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = "<p class='text-center text-red-500 py-4'>Could not load navigation.</p>";
            }
        });
});


/**
 * Initializes Firebase, sets up auth listeners, and wires up interactive elements.
 */
function initializeFirebaseAndListeners() {
    if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined') {
        console.error("Firebase is not available. Header functionality will be limited.");
        return;
    }

    const auth = firebase.auth();

    // Set up the primary listener that updates the UI and localStorage on any auth change.
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is officially logged in. Create the data object to cache.
            const userData = {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL
            };
            // Cache the latest user data.
            localStorage.setItem('linqUser', JSON.stringify(userData));
            // Update the UI with this definitive data.
            updateAuthUI(userData);
        } else {
            // User is logged out. Clear the cache and update the UI.
            localStorage.removeItem('linqUser');
            updateAuthUI(null);
        }
    });

    setupInteractiveElements(auth);
    interceptNavigationClicks();
    window.addEventListener('popstate', handleBrowserNavigation);
    updateActiveLink(window.location.pathname);
}

/**
 * Updates all UI elements in the header based on the provided user data.
 * This function includes checks to ensure elements exist before modification.
 * @param {object | null} user The user data object from cache or Firebase, or null if logged out.
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

    if (isLoggedIn) {
        const photoURL = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${(user.email || 'U').charAt(0).toUpperCase()}`;
        if (navProfilePic) navProfilePic.src = photoURL;
        if (slideoutProfilePic) slideoutProfilePic.src = photoURL;
        if (slideoutDisplayName) slideoutDisplayName.textContent = user.displayName || 'User';
        if (slideoutEmail) slideoutEmail.textContent = user.email;
    }
}


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
    
    const logoutButton = document.getElementById('logoutButtonMobile');
    logoutButton?.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut(); // This will trigger onAuthStateChanged, which handles all UI and cache cleanup.
        toggleMenu(); 
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
            slideoutMenu.classList.add('translate-x-full');
            document.getElementById('menu-overlay')?.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            document.getElementById('menu-open-icon')?.classList.remove('hidden');
            document.getElementById('menu-close-icon')?.classList.add('hidden');
        }
    });
}

async function loadPageContent(path) {
    const mainContentArea = document.querySelector('main');
    if (!mainContentArea) {
        window.location.href = path;
        return;
    }
    
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
            setTimeout(() => {
                mainContentArea.innerHTML = newMainContent.innerHTML;
                document.title = newTitle ? newTitle.textContent : 'Linq';
                
                const pageScripts = newMainContent.querySelectorAll('script');
                pageScripts.forEach(oldScript => {
                    const newScript = document.createElement("script");
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.textContent = oldScript.textContent;
                    document.body.appendChild(newScript).parentNode.removeChild(newScript);
                });
                
                updateActiveLink(path);
                window.scrollTo(0, 0);
                
                mainContentArea.style.opacity = '1';
                mainContentArea.style.transition = 'opacity 0.3s ease-in';
            }, 200);

        } else {
            throw new Error(`<main> content not found in ${path}`);
        }
    } catch (error) {
        console.error('SPA Navigation Error:', error);
        window.location.href = path;
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
        link.classList.remove('active');
        if (linkHref === pageName) {
            link.classList.add('active');
        }
    });
}
