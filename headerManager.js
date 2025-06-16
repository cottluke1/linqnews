// /js/headerManager.js
// This script provides a centralized solution for managing the site's header,
// including authentication state, mobile menu functionality, and active link highlighting.

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DEFINE CONSTANTS AND GET ELEMENTS ---
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) {
        console.error("Header placeholder element (#header-placeholder) not found. Header cannot be loaded.");
        return;
    }

    // --- 2. INJECT REQUIRED CSS STYLES ---
    const styles = `
        .nav-link { font-size: 0.875rem; color: #D1D5DB; font-weight: 500; transition: color 0.2s ease-in-out; border-radius: 0.375rem; }
        .nav-link:hover { color: #FFFFFF; }
        .nav-link.active { color: #FFFFFF; font-weight: 600; }
        .nav-link-button { font-size: 0.875rem; font-weight: 500; background-color: #00BFFF; color: white !important; padding: 0.5rem 1rem; border-radius: 0.375rem; transition: background-color 0.2s ease; }
        .nav-link-button:hover { background-color: #00A9E0; }
        .go-premium-btn { font-size: 0.875rem; font-weight: 600; background-color: #1F2937; color: #FFFFFF; padding: 0.5rem 1rem; border-radius: 9999px; border: 1px solid #4B5563; transition: all 0.2s ease; display: inline-block; text-decoration: none; }
        .go-premium-btn:hover { background-color: #374151; border-color: #6B7280; transform: scale(1.05); }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);


    // --- 3. FETCH AND INJECT HEADER HTML ---
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok for header.html');
            return response.text();
        })
        .then(data => {
            headerPlaceholder.innerHTML = data;
            // FIX: Initialize all functionality AFTER the header is loaded.
            initializeHeaderFunctionality();
        })
        .catch(error => {
            console.error('Error fetching header:', error);
            headerPlaceholder.innerHTML = "<p class='text-red-500 text-center py-3'>Error loading navigation.</p>";
        });


    // --- 4. INITIALIZE ALL HEADER FUNCTIONALITY ---
    function initializeHeaderFunctionality() {
        if (typeof firebase === 'undefined') {
            console.error('Firebase is not loaded. Header cannot function correctly.');
            return;
        }
        const auth = firebase.auth();
        
        // --- Setup Event Listeners Immediately ---
        setupEventListeners(auth);
        
        // --- Then, handle the auth-dependent UI ---
        auth.onAuthStateChanged(user => {
            updateAuthUI(user);
        });
    }

    // --- 5. SETUP STATIC EVENT LISTENERS (using Event Delegation) ---
    function setupEventListeners(auth) {
        const currentPath = window.location.pathname.split("/").pop() || "index.html";

        // Use event delegation on the header placeholder for efficiency and reliability
        headerPlaceholder.addEventListener('click', (event) => {
            const target = event.target.closest('a, button'); // Find the clicked link or button
            if (!target) return;

            // Prevent page reload if clicking the link for the current page
            if (target.matches('.nav-link') && target.getAttribute('href') === currentPath) {
                event.preventDefault();
            }

            // Handle mobile menu toggle
            if (target.id === 'mobile-menu-button') {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) mobileMenu.classList.toggle('hidden');
            }

            // Handle mobile logout
            if (target.id === 'logoutButtonMobile') {
                event.preventDefault();
                auth.signOut();
            }
        });
    }

    // --- 6. UPDATE UI BASED ON AUTH STATE ---
    function updateAuthUI(user) {
        const authLinkDesktop = document.getElementById('authLinkDesktopLogin');
        const profileLinkDesktop = document.getElementById('profileLinkDesktop');
        const navProfilePic = document.getElementById('navProfilePic');
        const authLinkMobile = document.getElementById('authLinkMobile');
        const profileLinkMobile = document.getElementById('profileLinkMobile');
        const logoutButtonMobile = document.getElementById('logoutButtonMobile');

        // Ensure elements exist before trying to modify them
        if (!authLinkDesktop || !profileLinkDesktop || !navProfilePic) return;

        if (user) {
            // --- USER IS LOGGED IN ---
            const initials = (user.displayName || user.email || "U").charAt(0).toUpperCase();
            const photoSrc = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${initials}`;
            
            // Preload the image to prevent the placeholder flash
            const image = new Image();
            image.src = photoSrc;

            image.onload = () => {
                // This code runs ONLY after the image is fully downloaded.
                navProfilePic.src = image.src;
                // Now that the image is ready, show the profile link and hide the login button.
                profileLinkDesktop.classList.remove('hidden');
                authLinkDesktop.classList.add('hidden');
            };
            image.onerror = () => {
                // Fallback in case the user's photoURL is broken
                navProfilePic.src = `https://placehold.co/40x40/2C2F33/EAEAEA?text=${initials}`;
                profileLinkDesktop.classList.remove('hidden');
                authLinkDesktop.classList.add('hidden');
            };

            // Update mobile menu
            authLinkMobile.classList.add('hidden');
            profileLinkMobile.classList.remove('hidden');
            logoutButtonMobile.classList.remove('hidden');
        } else {
            // --- USER IS LOGGED OUT ---
            profileLinkDesktop.classList.add('hidden');
            authLinkDesktop.classList.remove('hidden');
            authLinkMobile.classList.remove('hidden');
            profileLinkMobile.classList.add('hidden');
            logoutButtonMobile.classList.add('hidden');
        }
        
        // Style the active nav link regardless of auth state
        setActiveNavLink();
    }
    
    // --- 7. UTILITY FUNCTION ---
    function setActiveNavLink() {
        const currentPath = window.location.pathname.split("/").pop() || "index.html";
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    }
});
