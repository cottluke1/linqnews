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
    // UPDATED: Added styles for the new slide-out menu and overlay
    const styles = `
        .nav-link { font-size: 0.875rem; color: #D1D5DB; font-weight: 500; transition: color 0.2s ease-in-out; border-radius: 0.375rem; }
        .nav-link:hover { color: #FFFFFF; }
        .nav-link.active { color: #FFFFFF; font-weight: 600; }
        .nav-link-button { font-size: 0.875rem; font-weight: 500; background-color: #00BFFF; color: white !important; padding: 0.5rem 1rem; border-radius: 0.375rem; transition: background-color 0.2s ease; }
        .nav-link-button:hover { background-color: #00A9E0; }
        .go-premium-btn { font-size: 0.875rem; font-weight: 600; background-color: #1F2937; color: #FFFFFF; padding: 0.5rem 1rem; border-radius: 9999px; border: 1px solid #4B5563; transition: all 0.2s ease; display: inline-block; text-decoration: none; }
        .go-premium-btn:hover { background-color: #374151; border-color: #6B7280; transform: scale(1.05); }

        /* Styles for the new mobile slide-out panel */
        /* FIX: Made the background-color rule more specific and important to prevent transparency issues. */
        nav #slide-out-panel {
            background-color: #000000 !important;
        }
        .nav-link-mobile {
            font-size: 1rem;
            color: #D1D5DB;
            font-weight: 500;
            padding: 0.75rem 1rem;
            border-radius: 0.375rem;
            transition: background-color 0.2s ease, color 0.2s ease;
            display: block;
        }
        .nav-link-mobile:hover {
            background-color: rgba(255, 255, 255, 0.05);
            color: #FFFFFF;
        }
        .nav-link-mobile.active {
            color: #FFFFFF;
            font-weight: 600;
            background-color: rgba(0, 191, 255, 0.1);
        }
        #slide-out-panel.open {
            transform: translateX(0);
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

        // Immediately restore cached avatar from localStorage if available
        const cachedPhoto = localStorage.getItem('navProfileURL');
        if (cachedPhoto) {
            const profileLinkDesktop = document.getElementById('profileLinkDesktop');
            const authLinkDesktop = document.getElementById('authLinkDesktopLogin');
            if (profileLinkDesktop && authLinkDesktop) {
                profileLinkDesktop.innerHTML = `<img id="navProfilePic" src="${cachedPhoto}" alt="User" class="rounded-full w-9 h-9 object-cover border-2 border-gray-600 hover:border-cyan-400 transition">`;
                profileLinkDesktop.classList.remove('hidden');
                authLinkDesktop.classList.add('hidden');
            }
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

    // --- 5. SETUP EVENT LISTENERS ---
    function setupEventListeners(auth) {
        const slideOutPanel = document.getElementById('slide-out-panel');
        const menuOverlay = document.getElementById('menu-overlay');

        const openMobileMenu = () => {
            if (slideOutPanel) slideOutPanel.classList.add('open');
            if (menuOverlay) menuOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        };

        const closeMobileMenu = () => {
            if (slideOutPanel) slideOutPanel.classList.remove('open');
            if (menuOverlay) menuOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        };
        
        headerPlaceholder.addEventListener('click', (event) => {
            const target = event.target.closest('a, button');
            if (!target) return;
            
            if (target.id === 'mobile-menu-button') openMobileMenu();
            if (target.id === 'slideout-close-button') closeMobileMenu();
            
            if (target.id === 'logoutButtonMobile') {
                event.preventDefault();
                localStorage.removeItem('navProfileURL');
                closeMobileMenu(); 
                auth.signOut();
            }
        });
        
        if (menuOverlay) {
            menuOverlay.addEventListener('click', closeMobileMenu);
        }
    }

    // --- 6. UPDATE UI BASED ON AUTH STATE ---
    // FIX: Reinforced logic to ensure correct links are shown based on authentication state.
    function updateAuthUI(user, userData) {
        // Desktop elements
        const authLinkDesktop = document.getElementById('authLinkDesktopLogin');
        const profileLinkDesktop = document.getElementById('profileLinkDesktop');
        
        // Mobile elements
        const authLinkMobile = document.getElementById('authLinkMobile');
        const profileLinkMobile = document.getElementById('profileLinkMobile');
        const logoutButtonMobile = document.getElementById('logoutButtonMobile');

        // Exit if elements aren't found
        if (!authLinkDesktop || !profileLinkDesktop || !authLinkMobile || !profileLinkMobile || !logoutButtonMobile) {
            console.error("One or more auth UI elements are missing from the DOM.");
            return;
        }

        if (user) {
            // --- USER IS LOGGED IN ---
            const name = (userData?.displayName || user.displayName || user.email || "U");
            const initials = name.charAt(0).toUpperCase();
            const photoSrc = userData?.photoURL || user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${initials}`;
            
            localStorage.setItem('navProfileURL', photoSrc);

            // Set desktop profile picture
            const image = new Image();
            image.src = photoSrc;
            const createImage = (imgSrc) => {
                profileLinkDesktop.innerHTML = ''; 
                const newImg = document.createElement('img');
                newImg.id = 'navProfilePic';
                newImg.src = imgSrc;
                newImg.alt = user.displayName || 'User Avatar';
                newImg.className = 'rounded-full w-9 h-9 object-cover border-2 border-gray-600 hover:border-cyan-400 transition';
                profileLinkDesktop.appendChild(newImg);
            };
            image.onload = () => createImage(image.src);
            image.onerror = () => createImage(`https://placehold.co/40x40/2C2F33/EAEAEA?text=${initials}`);
            
            // Update Desktop UI
            profileLinkDesktop.classList.remove('hidden');
            authLinkDesktop.classList.add('hidden');
            
            // Update Mobile UI
            authLinkMobile.classList.add('hidden');
            profileLinkMobile.classList.remove('hidden');
            logoutButtonMobile.classList.remove('hidden');

        } else {
            // --- USER IS LOGGED OUT ---
            // Update Desktop UI
            profileLinkDesktop.classList.add('hidden');
            authLinkDesktop.classList.remove('hidden');
            profileLinkDesktop.innerHTML = '<img id="navProfilePic" style="display:none;" src="" alt="User" class="rounded-full w-9 h-9 object-cover border-2 border-gray-600 hover:border-cyan-400 transition">';
            
            // Update Mobile UI
            authLinkMobile.classList.remove('hidden');
            profileLinkMobile.classList.add('hidden');
            logoutButtonMobile.classList.add('hidden');
        }
        setActiveNavLink();
    }
    
    // --- 7. UTILITY FUNCTION ---
    function setActiveNavLink() {
        const currentPath = window.location.pathname.split("/").pop().split("?")[0] || "index.html";
        const navLinks = document.querySelectorAll('.nav-link, .nav-link-mobile');
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
