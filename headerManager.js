// /js/headerManager.js
// This script provides a centralized solution for managing the site's header,
// including authentication state, mobile menu functionality, and active link highlighting.
// It's designed to be included in every page to ensure a consistent user experience.

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DEFINE CONSTANTS AND GET ELEMENTS ---
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) {
        console.error("Header placeholder element (#header-placeholder) not found. Header cannot be loaded.");
        return;
    }

    // --- 2. INJECT REQUIRED CSS STYLES ---
    // Since we removed styles from header.html, we inject them here to ensure they
    // are always present when the header is loaded. This avoids needing to link a separate CSS file on every page.
    const styles = `
        .nav-link {
            font-size: 0.875rem; /* 14px */
            color: #D1D5DB; /* gray-300 */
            font-weight: 500;
            transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
            border-radius: 0.375rem; /* rounded-md */
        }
        .nav-link:hover {
            color: #FFFFFF;
            background-color: rgba(255, 255, 255, 0.05);
        }
        .nav-link.active {
            color: #FFFFFF;
            font-weight: 600;
            background-color: rgba(0, 191, 255, 0.1);
        }
        .nav-link-button {
            font-size: 0.875rem;
            font-weight: 500;
            background-color: #00BFFF;
            color: white !important;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem; /* rounded-md */
            transition: background-color 0.2s ease;
        }
        .nav-link-button:hover {
            background-color: #00A9E0;
        }
        .go-premium-btn {
            font-size: 0.875rem; /* text-sm */
            font-weight: 600; /* font-semibold */
            background-color: #1F2937; /* gray-800 */
            color: #FFFFFF; /* White text */
            padding: 0.5rem 1rem; /* py-2 px-4 */
            border-radius: 9999px; /* rounded-full */
            border: 1px solid #4B5563; /* gray-600 */
            transition: background-color 0.3s ease, transform 0.2s ease, border-color 0.3s ease;
            display: inline-block;
            text-decoration: none;
        }
        .go-premium-btn:hover {
            background-color: #374151; /* gray-700 */
            border-color: #6B7280; /* gray-500 */
            transform: scale(1.05);
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);


    // --- 3. FETCH AND INJECT HEADER HTML ---
    // We fetch the clean header.html fragment and inject it into the placeholder.
    // The 'invisible' class keeps it hidden until the auth check is complete, preventing flicker.
    fetch('header.html')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok for header.html');
            return response.text();
        })
        .then(data => {
            headerPlaceholder.innerHTML = data;
            const nav = headerPlaceholder.querySelector('nav');
            if (nav) {
                nav.classList.add('invisible'); // Keep it hidden initially
            }
            // Once the HTML is loaded, we can initialize the authentication and UI logic.
            initializeAuthAndUI();
        })
        .catch(error => {
            console.error('Error fetching header:', error);
            headerPlaceholder.innerHTML = "<p class='text-red-500 text-center py-3'>Error loading navigation.</p>";
        });


    // --- 4. INITIALIZE AUTHENTICATION AND UI LOGIC ---
    function initializeAuthAndUI() {
        // Ensure Firebase is initialized (assuming it's loaded on the page)
        if (typeof firebase === 'undefined') {
            console.error('Firebase is not loaded. Header cannot function correctly.');
            return;
        }
        const auth = firebase.auth();

        // This is the core logic. It listens for changes in the user's login state.
        auth.onAuthStateChanged(user => {
            // Get all the UI elements from the now-loaded header
            const nav = headerPlaceholder.querySelector('nav');
            const authLinkDesktop = document.getElementById('authLinkDesktopLogin');
            const profileLinkDesktop = document.getElementById('profileLinkDesktop');
            const navProfilePic = document.getElementById('navProfilePic');
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            const authLinkMobile = document.getElementById('authLinkMobile');
            const profileLinkMobile = document.getElementById('profileLinkMobile');
            const logoutButtonMobile = document.getElementById('logoutButtonMobile');

            if (user) {
                // --- USER IS LOGGED IN ---
                // Show profile, hide login
                authLinkDesktop.classList.add('hidden');
                profileLinkDesktop.classList.remove('hidden');

                // Update profile picture
                const initials = (user.displayName || user.email || "U").charAt(0).toUpperCase();
                navProfilePic.src = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${initials}`;

                // Update mobile menu for logged-in state
                authLinkMobile.classList.add('hidden');
                profileLinkMobile.classList.remove('hidden');
                logoutButtonMobile.classList.remove('hidden');

            } else {
                // --- USER IS LOGGED OUT ---
                // Show login, hide profile
                authLinkDesktop.classList.remove('hidden');
                profileLinkDesktop.classList.add('hidden');

                // Update mobile menu for logged-out state
                authLinkMobile.classList.remove('hidden');
                profileLinkMobile.classList.add('hidden');
                logoutButtonMobile.classList.add('hidden');
            }

            // --- Set up event listeners ---
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

            // --- FINAL UI UPDATES ---
            setActiveNavLink(); // Highlight the current page's link
            
            // FIX: Reveal the header only AFTER the auth check is complete. This solves the flicker.
            if (nav) {
                nav.classList.remove('invisible');
            }
        });
    }

    // --- 5. UTILITY FUNCTIONS ---
    function setActiveNavLink() {
        // This function adds the 'active' class to the correct nav link
        const currentPath = window.location.pathname.split("/").pop() || "index.html";
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            // Check if the link's href matches the current page's file name
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    }
});
