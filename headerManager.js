/**
 * headerManager.js
 * This script dynamically loads the header, manages its state (mobile menu, active links),
 * and handles UI changes based on Firebase authentication status.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Fetch and inject the header HTML
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        fetch('header.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok for header.html');
                }
                return response.text();
            })
            .then(html => {
                headerPlaceholder.innerHTML = html;
                // Once HTML is in place, initialize all functionality
                initializeHeaderFunctionality();
            })
            .catch(error => {
                console.error('Failed to fetch header:', error);
                headerPlaceholder.innerHTML = '<p class="text-center text-red-500 py-4">Error loading navigation.</p>';
            });
    }

    // Function to contain all header logic after it's loaded
    function initializeHeaderFunctionality() {
        
        // 2. Mobile Menu Toggle Logic
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const overlay = document.getElementById('menu-overlay');
        const slideoutMenu = document.getElementById('mobile-slideout-menu');
        const openIcon = document.getElementById('menu-open-icon');
        const closeIcon = document.getElementById('menu-close-icon');

        const toggleMenu = () => {
            const isMenuOpen = !slideoutMenu.classList.contains('translate-x-full');
            if (isMenuOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        };
        
        const openMenu = () => {
            if (slideoutMenu) slideoutMenu.classList.remove('translate-x-full');
            if (overlay) overlay.classList.remove('hidden');
            if (openIcon) openIcon.classList.add('hidden');
            if (closeIcon) closeIcon.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        };

        const closeMenu = () => {
            if (slideoutMenu) slideoutMenu.classList.add('translate-x-full');
            if (overlay) overlay.classList.add('hidden');
            if (openIcon) openIcon.classList.remove('hidden');
            if (closeIcon) closeIcon.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        };

        mobileMenuButton?.addEventListener('click', toggleMenu);
        overlay?.addEventListener('click', closeMenu);

        // 3. Desktop Active Nav Link Logic
        const currentPath = window.location.pathname.split("/").pop() || "index.html";
        document.querySelectorAll('.nav-link-desktop').forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath === currentPath) {
                link.classList.add('active');
            }
        });

        // 4. Firebase Authentication UI Logic
        // IMPORTANT: Make sure your Firebase SDKs are loaded before this script
        // and that firebase is initialized.
        if (typeof firebase !== 'undefined') {
            const auth = firebase.auth();
            
            auth.onAuthStateChanged(user => {
                const isLoggedIn = !!user;

                // Toggle visibility of desktop elements
                document.getElementById('authLinkDesktopLogin')?.classList.toggle('hidden', isLoggedIn);
                document.getElementById('profileLinkDesktop')?.classList.toggle('hidden', !isLoggedIn);
                const navProfilePic = document.getElementById('navProfilePic');
                if (navProfilePic && user) {
                    navProfilePic.src = user.photoURL || `https://placehold.co/36x36/1a1a1a/ffffff?text=${user.email.charAt(0).toUpperCase()}`;
                }

                // Toggle visibility of mobile slideout elements
                document.getElementById('authLinkMobile')?.classList.toggle('hidden', isLoggedIn);
                document.getElementById('bottomProfileLinkMobile')?.classList.toggle('hidden', !isLoggedIn);
                document.getElementById('logoutButtonMobile')?.classList.toggle('hidden', !isLoggedIn);
                const slideoutUserInfo = document.getElementById('slideout-user-info');
                if (slideoutUserInfo) {
                    slideoutUserInfo.classList.toggle('hidden', !isLoggedIn);
                    if (isLoggedIn) {
                        document.getElementById('slideoutProfilePic').src = user.photoURL || `https://placehold.co/40x40/1a1a1a/ffffff?text=${user.email.charAt(0).toUpperCase()}`;
                        document.getElementById('slideoutDisplayName').textContent = user.displayName || 'User';
                        document.getElementById('slideoutEmail').textContent = user.email ? `@${user.email.split('@')[0]}` : '@user';
                    }
                }
            });

            // Add logout functionality
            const logoutButton = document.getElementById('logoutButtonMobile');
            logoutButton?.addEventListener('click', (e) => {
                e.preventDefault();
                auth.signOut();
            });

        } else {
            console.error("Firebase is not defined. Auth UI will not be updated.");
        }
    }
});
