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
        body.overflow-hidden { overflow: hidden; }
        .nav-link { font-size: 0.875rem; color: #D1D5DB; font-weight: 500; transition: color 0.2s ease-in-out; border-radius: 0.375rem; }
        .nav-link:hover { color: #FFFFFF; }
        .nav-link.active { color: #FFFFFF; font-weight: 600; }
        .nav-link-button { font-size: 0.875rem; font-weight: 500; background-color: #00BFFF; color: white !important; padding: 0.5rem 1rem; border-radius: 0.375rem; transition: background-color 0.2s ease; }
        .nav-link-button:hover { background-color: #00A9E0; }
        .go-premium-btn { font-size: 0.875rem; font-weight: 600; background-color: #1F2937; color: #FFFFFF; padding: 0.5rem 1rem; border-radius: 9999px; border: 1px solid #4B5563; transition: all 0.2s ease; display: inline-block; text-decoration: none; }
        .go-premium-btn:hover { background-color: #374151; border-color: #6B7280; transform: scale(1.05); }
        .slideout-link { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border-radius: 9999px; font-weight: 500; font-size: 1rem; color: #D1D5DB; text-decoration: none; }
        .slideout-link:hover { background-color: #27272a; color: white; }
        .slideout-link.active { color: #FFFFFF; font-weight: 700; }
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
        
        setupEventListeners(auth);
        
        auth.onAuthStateChanged(user => {
            updateAuthUI(user);
        });
    }

    // --- 5. SETUP EVENT LISTENERS (Mobile Menu & Links) ---
    function setupEventListeners(auth) {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenuCloseButton = document.getElementById('mobile-menu-close-button');
        const slideoutMenu = document.getElementById('mobile-slideout-menu');
        const menuOverlay = document.getElementById('menu-overlay');

        const openMenu = () => {
            if (slideoutMenu && menuOverlay) {
                menuOverlay.classList.remove('hidden');
                menuOverlay.classList.add('opacity-100');
                slideoutMenu.classList.remove('translate-x-full');
                slideoutMenu.classList.add('translate-x-0');
                document.body.classList.add('overflow-hidden');
            }
        };

        const closeMenu = () => {
            if (slideoutMenu && menuOverlay) {
                menuOverlay.classList.remove('opacity-100');
                menuOverlay.classList.add('hidden');
                slideoutMenu.classList.remove('translate-x-0');
                slideoutMenu.classList.add('translate-x-full');
                document.body.classList.remove('overflow-hidden');
            }
        };

        if(mobileMenuButton) mobileMenuButton.addEventListener('click', openMenu);
        if(mobileMenuCloseButton) mobileMenuCloseButton.addEventListener('click', closeMenu);
        if(menuOverlay) menuOverlay.addEventListener('click', closeMenu);

        // Logout listener
        const logoutButtonMobile = document.getElementById('logoutButtonMobile');
        if(logoutButtonMobile) {
            logoutButtonMobile.addEventListener('click', (event) => {
                event.preventDefault();
                auth.signOut();
                closeMenu();
            });
        }
    }

    // --- 6. UPDATE UI BASED ON AUTH STATE ---
    function updateAuthUI(user) {
        // Desktop Elements
        const authLinkDesktop = document.getElementById('authLinkDesktopLogin');
        const profileLinkDesktop = document.getElementById('profileLinkDesktop');
        const navProfilePic = document.getElementById('navProfilePic');
        
        // Mobile Slideout Elements
        const authLinkMobile = document.getElementById('authLinkMobile');
        const logoutButtonMobile = document.getElementById('logoutButtonMobile');
        const slideoutUserInfo = document.getElementById('slideout-user-info');
        const slideoutProfilePic = document.getElementById('slideoutProfilePic');
        const slideoutDisplayName = document.getElementById('slideoutDisplayName');
        const slideoutEmail = document.getElementById('slideoutEmail');

        if (!authLinkDesktop || !profileLinkDesktop || !navProfilePic) return;

        if (user) {
            // -- LOGGED IN STATE --
            const initials = (user.displayName || user.email || "U").charAt(0).toUpperCase();
            const photoSrc = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${initials}`;
            
            // Desktop UI
            navProfilePic.src = photoSrc;
            navProfilePic.style.display = 'block';
            profileLinkDesktop.classList.remove('hidden');
            authLinkDesktop.classList.add('hidden');

            // Mobile UI
            slideoutProfilePic.src = photoSrc;
            slideoutDisplayName.textContent = user.displayName || 'User';
            slideoutEmail.textContent = user.email ? `@${user.email.split('@')[0]}` : '';
            
            slideoutUserInfo.classList.remove('hidden');
            authLinkMobile.classList.add('hidden');
            logoutButtonMobile.classList.remove('hidden');

        } else {
            // -- LOGGED OUT STATE --
            // Desktop UI
            profileLinkDesktop.classList.add('hidden');
            authLinkDesktop.classList.remove('hidden');
            navProfilePic.style.display = 'none';

            // Mobile UI
            slideoutUserInfo.classList.add('hidden');
            authLinkMobile.classList.remove('hidden');
            logoutButtonMobile.classList.add('hidden');
        }
        setActiveNavLink();
    }
    
    // --- 7. UTILITY FUNCTION to highlight active nav link ---
    function setActiveNavLink() {
        const currentPath = window.location.pathname.split("/").pop() || "index.html";
        // Combine selectors for desktop and mobile links
        const navLinks = document.querySelectorAll('.nav-link, .slideout-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkHrefRaw = link.getAttribute('href');
            if (linkHrefRaw) {
                // Handle cases like "earnings.html" vs "previous_earnings.html"
                const linkHref = linkHrefRaw.split("?")[0];
                if (linkHref === currentPath) {
                    link.classList.add('active');
                } else if (currentPath === 'previous_earnings.html' && linkHref === 'earnings.html') {
                    link.classList.add('active');
                }
            }
        });
    }
});
