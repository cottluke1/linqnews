// /js/headerManager.js
// This script provides a centralized solution for managing the site's header.
// UPDATED: Styles have been refined to match the reference image, including icons.

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DEFINE CONSTANTS AND GET ELEMENTS ---
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) {
        console.error("Header placeholder element (#header-placeholder) not found. Header cannot be loaded.");
        return;
    }

    // --- 2. INJECT REQUIRED CSS STYLES ---
    // Added Font Awesome and updated styles for the new design.
    const fontAwesomeLink = document.createElement('link');
    fontAwesomeLink.rel = 'stylesheet';
    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(fontAwesomeLink);
    
    const styles = `
        /* Base Nav Link Styles */
        .nav-link { font-size: 0.875rem; color: #D1D5DB; font-weight: 500; transition: color 0.2s ease-in-out; border-radius: 0.375rem; text-decoration: none; }
        .nav-link:hover { color: #FFFFFF; }
        .nav-link.active { color: #FFFFFF; font-weight: 600; }
        .nav-link-button { font-size: 0.875rem; font-weight: 500; background-color: #00BFFF; color: white !important; padding: 0.5rem 1rem; border-radius: 0.375rem; transition: background-color 0.2s ease; }
        .nav-link-button:hover { background-color: #00A9E0; }
        .go-premium-btn { font-size: 0.875rem; font-weight: 600; background-color: #1F2937; color: #FFFFFF; padding: 0.5rem 1rem; border-radius: 9999px; border: 1px solid #4B5563; transition: all 0.2s ease; display: inline-block; text-decoration: none; }
        .go-premium-btn:hover { background-color: #374151; border-color: #6B7280; transform: scale(1.05); }

        /* Slide-Out Menu Styles - Refined to match image */
        #slide-out-menu {
            position: fixed;
            top: 0;
            right: 0;
            width: 85%;
            max-width: 320px;
            height: 100vh;
            background-color: #000000; /* Darker background */
            z-index: 2000;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
            display: flex;
            flex-direction: column;
        }
        #slide-out-menu.open {
            transform: translateX(0);
            box-shadow: -10px 0 25px rgba(0,0,0,0.5);
        }
        #slide-out-profile-section {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #1F2937;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        #slide-out-profile-pic {
            width: 50px; /* Smaller picture */
            height: 50px;
            border-radius: 50%;
            object-fit: cover;
        }
        .profile-info {
             flex-grow: 1;
        }
        .profile-info #slide-out-display-name {
            font-weight: 700; /* Bolder */
            font-size: 1rem;
            color: #FFF;
        }
        .profile-info #slide-out-username {
            font-size: 0.9rem;
            color: #6B7280; /* Lighter gray */
        }
        #slide-out-close-btn {
            font-size: 1.5rem;
            color: #9CA3AF;
            background: none;
            border: none;
            cursor: pointer;
            margin-left: auto;
        }

        .slide-out-nav {
            padding: 1rem;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }
        .slide-out-nav .nav-link {
            font-size: 1.125rem; /* Larger font */
            font-weight: 700; /* Bolder */
            padding: 1rem;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            gap: 1.5rem; /* More space between icon and text */
        }
        .slide-out-nav .nav-link .icon {
            width: 24px; /* Fixed width for alignment */
            text-align: center;
            font-size: 1.25rem;
        }
        .slide-out-nav .nav-link:hover {
            background-color: #1F2937;
        }
        .slide-out-nav hr {
            border-color: #1F2937;
            margin: 0.5rem 0;
        }
        .slide-out-nav .premium-link {
            color: #E2E8F0; /* Regular color, icon handles premium look */
        }
         .slide-out-nav .premium-link .icon {
            color: #A855F7; /* Purple premium icon */
        }
        .slide-out-nav .beta-tag {
            font-size: 0.65rem;
            font-weight: 700;
            background-color: #0E7490;
            color: #E2E8F0;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 0.5rem;
        }
        .slide-out-nav .logout-button {
            margin-top: auto;
        }
        .slide-out-nav .logout-button .icon {
            color: #F87171;
        }
        
        /* Menu Overlay */
        #menu-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(9, 9, 11, 0.7); /* Darker overlay with a slight blur */
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            z-index: 1999;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            pointer-events: none;
        }
        #menu-overlay.open {
            opacity: 1;
            pointer-events: auto;
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
        const db = firebase.firestore();
        let unsubscribeUserListener = null;

        const cachedPhoto = localStorage.getItem('navProfileURL');
        if (cachedPhoto) {
            updateDesktopProfilePic(cachedPhoto);
        }
        
        setupEventListeners(auth);
        
        auth.onAuthStateChanged(user => {
            if (unsubscribeUserListener) {
                unsubscribeUserListener();
                unsubscribeUserListener = null;
            }

            if (user) {
                unsubscribeUserListener = db.collection('users').doc(user.uid).onSnapshot(doc => {
                    const userData = doc.exists ? doc.data() : {};
                    updateAuthUI(user, userData);
                }, error => {
                    console.error("Error listening to user document:", error);
                    updateAuthUI(user, {});
                });
            } else {
                updateAuthUI(null, null);
            }
        });
    }
    
    // --- 5. MENU AND EVENT LISTENER SETUP ---
    function setupEventListeners(auth) {
        const slideOutMenuButton = document.getElementById('slide-out-menu-button');
        const slideOutCloseButton = document.getElementById('slide-out-close-btn');
        const menuOverlay = document.getElementById('menu-overlay');
        const logoutButton = document.getElementById('slide-out-logout-button');
        const slideOutMenu = document.getElementById('slide-out-menu');

        const openMenu = () => {
            slideOutMenu?.classList.add('open');
            menuOverlay?.classList.add('open');
        };
        const closeMenu = () => {
            slideOutMenu?.classList.remove('open');
            menuOverlay?.classList.remove('open');
        };

        slideOutMenuButton?.addEventListener('click', openMenu);
        slideOutCloseButton?.addEventListener('click', closeMenu);
        menuOverlay?.addEventListener('click', closeMenu);

        logoutButton?.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.removeItem('navProfileURL');
            auth.signOut();
            closeMenu();
        });
        
        slideOutMenu?.addEventListener('click', (event) => {
            if (event.target.closest('.nav-link') && !event.target.closest('.logout-button')) {
                closeMenu();
            }
        });
    }

    // --- 6. UPDATE UI BASED ON AUTH STATE ---
    function updateAuthUI(user, userData) {
        // Desktop elements
        const authLinkDesktop = document.getElementById('authLinkDesktopLogin');
        const profileLinkDesktop = document.getElementById('profileLinkDesktop');
        
        // Slide-out menu elements
        const profileSection = document.getElementById('slide-out-profile-section');
        const profilePic = document.getElementById('slide-out-profile-pic');
        const displayName = document.getElementById('slide-out-display-name');
        const username = document.getElementById('slide-out-username');
        const profileLink = document.getElementById('slide-out-profile-link');
        const loginLink = document.getElementById('slide-out-login-link');
        const logoutButton = document.getElementById('slide-out-logout-button');

        if (!authLinkDesktop || !profileLinkDesktop || !profileSection) return;

        if (user) {
            // --- LOGGED-IN STATE ---
            const name = userData?.displayName || user.displayName || "User";
            const email = userData?.email || user.email || "";
            const initials = name.charAt(0).toUpperCase();
            const photoSrc = userData?.photoURL || user.photoURL || `https://placehold.co/80x80/1F2937/EAEAEA?text=${initials}`;
            
            localStorage.setItem('navProfileURL', photoSrc);

            updateDesktopProfilePic(photoSrc, name);
            authLinkDesktop.classList.add('hidden');
            profileLinkDesktop.classList.remove('hidden');

            profileSection.classList.remove('hidden');
            profilePic.src = photoSrc;
            displayName.textContent = name;
            username.textContent = email;
            profileLink.classList.remove('hidden');
            logoutButton.classList.remove('hidden');
            loginLink.classList.add('hidden');

        } else {
            // --- LOGGED-OUT STATE ---
            profileLinkDesktop.classList.add('hidden');
            authLinkDesktop.classList.remove('hidden');
            profileLinkDesktop.innerHTML = '<img id="navProfilePic" style="display:none;" src="" alt="User" class="rounded-full w-9 h-9 object-cover border-2 border-gray-600 hover:border-cyan-400 transition">';

            profileSection.classList.add('hidden');
            profileLink.classList.add('hidden');
            logoutButton.classList.add('hidden');
            loginLink.classList.remove('hidden');
        }
        setActiveNavLink();
    }
    
    // --- 7. UTILITY FUNCTIONS ---
    function updateDesktopProfilePic(imgSrc, altText = 'User Avatar') {
        const profileLinkDesktop = document.getElementById('profileLinkDesktop');
        if (!profileLinkDesktop) return;

        const image = new Image();
        image.src = imgSrc;
        
        const createAndAppendImage = (finalSrc) => {
            profileLinkDesktop.innerHTML = '';
            const newImg = document.createElement('img');
            newImg.id = 'navProfilePic';
            newImg.src = finalSrc;
            newImg.alt = altText;
            newImg.className = 'rounded-full w-9 h-9 object-cover border-2 border-gray-600 hover:border-cyan-400 transition';
            profileLinkDesktop.appendChild(newImg);
        };
        
        image.onload = () => createAndAppendImage(image.src);
        image.onerror = () => {
             const initials = (altText || "U").charAt(0).toUpperCase();
             createAndAppendImage(`https://placehold.co/40x40/2C2F33/EAEAEA?text=${initials}`);
        };
    }

    function setActiveNavLink() {
        const currentPath = window.location.pathname.split("/").pop().split("?")[0] || "index.html";
        const navLinks = document.querySelectorAll('div.hidden.md\\:flex a.nav-link, .slide-out-nav a.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkHrefRaw = link.getAttribute('href');
            if (linkHrefRaw) {
                const linkHref = linkHrefRaw.split("?")[0];
                if (linkHref === currentPath) {
                    link.classList.add('active');
                }
            }
        });
    }
});
