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
        .nav-link {
            font-size: 0.875rem;
            color: #D1D5DB;
            font-weight: 500;
            transition: color 0.2s ease-in-out;
            border-radius: 0.375rem;
        }
        .nav-link:hover {
            color: #FFFFFF;
        }
        .nav-link.active {
            color: #FFFFFF;
            font-weight: 600;
        }
        .nav-link-button {
            font-size: 0.875rem;
            font-weight: 500;
            background-color: #00BFFF;
            color: white !important;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            transition: background-color 0.2s ease;
        }
        .nav-link-button:hover {
            background-color: #00A9E0;
        }
        .go-premium-btn {
            font-size: 0.875rem;
            font-weight: 600;
            background-color: #1F2937;
            color: #FFFFFF;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            border: 1px solid #4B5563;
            transition: background-color 0.3s ease, transform 0.2s ease, border-color 0.3s ease;
            display: inline-block;
            text-decoration: none;
        }
        .go-premium-btn:hover {
            background-color: #374151;
            border-color: #6B7280;
            transform: scale(1.05);
        }
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
            initializeAuthAndUI();
        })
        .catch(error => {
            console.error('Error fetching header:', error);
            headerPlaceholder.innerHTML = "<p class='text-red-500 text-center py-3'>Error loading navigation.</p>";
        });


    // --- 4. INITIALIZE AUTHENTICATION AND UI LOGIC ---
    function initializeAuthAndUI() {
        if (typeof firebase === 'undefined') {
            console.error('Firebase is not loaded. Header cannot function correctly.');
            return;
        }
        const auth = firebase.auth();

        auth.onAuthStateChanged(user => {
            const authLinkDesktop = document.getElementById('authLinkDesktopLogin');
            const profileLinkDesktop = document.getElementById('profileLinkDesktop');
            const navProfilePic = document.getElementById('navProfilePic');
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            const authLinkMobile = document.getElementById('authLinkMobile');
            const profileLinkMobile = document.getElementById('profileLinkMobile');
            const logoutButtonMobile = document.getElementById('logoutButtonMobile');

            if (user) {
                const initials = (user.displayName || user.email || "U").charAt(0).toUpperCase();
                const photoSrc = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${initials}`;
                const image = new Image();
                image.src = photoSrc;
                image.onload = () => {
                    navProfilePic.src = image.src;
                    authLinkDesktop.classList.add('hidden');
                    profileLinkDesktop.classList.remove('hidden');
                };
                image.onerror = () => {
                    navProfilePic.src = `https://placehold.co/40x40/2C2F33/EAEAEA?text=${initials}`;
                    authLinkDesktop.classList.add('hidden');
                    profileLinkDesktop.classList.remove('hidden');
                };
                authLinkMobile.classList.add('hidden');
                profileLinkMobile.classList.remove('hidden');
                logoutButtonMobile.classList.remove('hidden');
            } else {
                authLinkDesktop.classList.remove('hidden');
                profileLinkDesktop.classList.add('hidden');
                authLinkMobile.classList.remove('hidden');
                profileLinkMobile.classList.add('hidden');
                logoutButtonMobile.classList.add('hidden');
            }

            if (mobileMenuButton && mobileMenu) {
                mobileMenuButton.addEventListener('click', () => {
                    mobileMenu.classList.toggle('hidden');
                });
            }
            if (logoutButtonMobile) {
                logoutButtonMobile.addEventListener('click', (e) => {
                    e.preventDefault();
                    auth.signOut();
                });
            }
            setActiveNavLink(); 
        });
    }

    // --- 5. UTILITY AND EVENT LISTENER FUNCTIONS ---
    function setActiveNavLink() {
        const currentPath = window.location.pathname.split("/").pop() || "index.html";
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            link.classList.remove('active');
            if (linkPath === currentPath) {
                link.classList.add('active');
            }

            // FIX: Add click listener to prevent re-navigation
            link.addEventListener('click', (event) => {
                if (link.getAttribute('href') === currentPath) {
                    event.preventDefault(); // Stop the browser from navigating
                }
            });
        });
    }
});
