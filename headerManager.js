// /js/headerManager.js
// This script provides a centralized solution for managing the site's modern header,
// including auth state, a slide-out mobile menu, and active link highlighting.

document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) {
        console.error("Header placeholder element (#header-placeholder) not found. Header cannot be loaded.");
        return;
    }

    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok for header.html');
            return response.text();
        })
        .then(data => {
            headerPlaceholder.innerHTML = data;
            initializeHeaderFunctionality();
        })
        .catch(error => {
            console.error('Error fetching header:', error);
            headerPlaceholder.innerHTML = "<p class='text-red-500 text-center py-3'>Error loading navigation.</p>";
        });
});

function initializeHeaderFunctionality() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase is not loaded. Header cannot function correctly.');
        return;
    }

    // --- DOM Elements ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const slideOutMenu = document.getElementById('slide-out-menu');
    const closeButton = document.getElementById('slide-out-close-btn');
    const menuOverlay = document.getElementById('menu-overlay');

    // --- Firebase Services ---
    const auth = firebase.auth();
    const db = firebase.firestore();
    let unsubscribeUserListener = null;

    // --- Menu Logic ---
    const openMenu = () => {
        if (!slideOutMenu || !menuOverlay) return;
        menuOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        requestAnimationFrame(() => {
            slideOutMenu.classList.add('open');
            menuOverlay.classList.add('active');
        });
    };

    const closeMenu = () => {
        if (!slideOutMenu || !menuOverlay) return;
        slideOutMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            menuOverlay.classList.add('hidden');
        }, 300); // Match transition duration
    };

    // --- Event Listeners ---
    if (mobileMenuButton) mobileMenuButton.addEventListener('click', openMenu);
    if (closeButton) closeButton.addEventListener('click', closeMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && slideOutMenu?.classList.contains('open')) {
            closeMenu();
        }
    });

    const logoutButton = document.getElementById('logout-button-slideout');
    if(logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().catch(error => console.error("Sign out error", error));
        });
    }

    // --- Auth State Management ---
    auth.onAuthStateChanged(user => {
        if (unsubscribeUserListener) unsubscribeUserListener();
        
        if (user) {
            unsubscribeUserListener = db.collection('users').doc(user.uid).onSnapshot(doc => {
                const userData = doc.exists ? doc.data() : {};
                updateUIForUser(user, userData);
            }, error => {
                console.error("Error listening to user document:", error);
                updateUIForUser(user, {}); // Fallback with auth data
            });
        } else {
            updateUIForGuest();
        }
    });
}

function updateUIForUser(user, userData) {
    // --- Desktop Header ---
    const authLinkDesktop = document.getElementById('authLinkDesktopLogin');
    const profileLinkDesktop = document.getElementById('profileLinkDesktop');
    const navProfilePic = document.getElementById('navProfilePic');

    if (authLinkDesktop) authLinkDesktop.classList.add('hidden');
    if (profileLinkDesktop) profileLinkDesktop.classList.remove('hidden');
    
    const photoUrl = userData.photoURL || user.photoURL;
    const initials = (userData.displayName || user.displayName || user.email || 'U').charAt(0).toUpperCase();

    if(navProfilePic) {
        navProfilePic.src = photoUrl || `https://placehold.co/40x40/374151/FFFFFF?text=${initials}`;
        navProfilePic.style.display = 'block';
    }
    
    // --- Slide-out Menu ---
    document.getElementById('slide-out-user-info')?.classList.remove('hidden');
    document.getElementById('login-button-slideout')?.classList.add('hidden');
    document.getElementById('logout-button-slideout')?.classList.remove('hidden');
    document.getElementById('slide-out-favorites')?.classList.remove('hidden');

    document.getElementById('slide-out-avatar').src = photoUrl || `https://placehold.co/40x40/374151/FFFFFF?text=${initials}`;
    document.getElementById('slide-out-name').textContent = userData.displayName || user.displayName || 'User';
    document.getElementById('slide-out-email').textContent = userData.email || user.email;

    setActiveNavLink();
}

function updateUIForGuest() {
    // --- Desktop Header ---
    document.getElementById('authLinkDesktopLogin')?.classList.remove('hidden');
    document.getElementById('profileLinkDesktop')?.classList.add('hidden');
    const navProfilePic = document.getElementById('navProfilePic');
    if(navProfilePic) navProfilePic.style.display = 'none';

    // --- Slide-out Menu ---
    document.getElementById('slide-out-user-info')?.classList.add('hidden');
    document.getElementById('login-button-slideout')?.classList.remove('hidden');
    document.getElementById('logout-button-slideout')?.classList.add('hidden');
    document.getElementById('slide-out-favorites')?.classList.add('hidden');

    setActiveNavLink();
}

function setActiveNavLink() {
    // Use a more specific selector to avoid matching non-nav links
    const navLinks = document.querySelectorAll('div.hidden.md\:flex a.nav-link, #slide-out-menu a.slide-out-nav-link');
    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    navLinks.forEach(link => {
        const linkHref = (link.getAttribute('href') || "").split("?")[0];
        if (linkHref === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
