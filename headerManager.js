// /js/headerManager.js
// Improved: Handles auth, nav centering, profile persistence, and SPA-style routing

document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) return;

    fetch('header.html')
        .then(res => res.text())
        .then(html => {
            headerPlaceholder.innerHTML = html;

            // Wait one animation frame to ensure elements are fully parsed before initializing
            requestAnimationFrame(() => {
                initHeader();
            });
        });
});


    function initHeader() {
        if (typeof firebase === 'undefined') return;
    
        const auth = firebase.auth();
    
        auth.onAuthStateChanged(user => {
            // Call updateAuthUI twice: immediately and again in the next animation frame
            updateAuthUI(user);
            requestAnimationFrame(() => updateAuthUI(user));
        });
    
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.add('text-center', 'w-full');
        });
    
        const navContainer = document.querySelector('.flex.items-center.space-x-2');
        if (navContainer) navContainer.classList.add('justify-center', 'w-full');
    
        interceptNavClicks();
        setupMobileMenu(auth);
    }


    function updateAuthUI(user) {
        const isLoggedIn = !!user;

        document.getElementById('authLinkDesktopLogin')?.classList.toggle('hidden', isLoggedIn);
        document.getElementById('profileLinkDesktop')?.classList.toggle('hidden', !isLoggedIn);

        const pic = document.getElementById('navProfilePic');
        if (pic) {
            if (isLoggedIn) {
                const photo = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${user.email[0].toUpperCase()}`;
                pic.src = photo;
                pic.style.display = 'block';
            } else {
                pic.style.display = 'none';
            }
        }

        document.getElementById('authLinkMobile')?.classList.toggle('hidden', isLoggedIn);
        document.getElementById('bottomProfileLinkMobile')?.classList.toggle('hidden', !isLoggedIn);
        document.getElementById('logoutButtonMobile')?.classList.toggle('hidden', !isLoggedIn);
        document.getElementById('slideout-user-info')?.classList.toggle('hidden', !isLoggedIn);

        if (isLoggedIn) {
            document.getElementById('slideoutProfilePic').src = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${user.email[0].toUpperCase()}`;
            document.getElementById('slideoutDisplayName').textContent = user.displayName || 'User';
            document.getElementById('slideoutEmail').textContent = `@${user.email.split('@')[0]}`;
        }
    }

    function setupMobileMenu(auth) {
        document.getElementById('mobile-menu-button')?.addEventListener('click', () => {
            document.getElementById('mobile-slideout-menu')?.classList.remove('translate-x-full');
            document.getElementById('menu-overlay')?.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        });

        const close = () => {
            document.getElementById('mobile-slideout-menu')?.classList.add('translate-x-full');
            document.getElementById('menu-overlay')?.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        };

        document.getElementById('mobile-menu-close-button')?.addEventListener('click', close);
        document.getElementById('menu-overlay')?.addEventListener('click', close);

        document.getElementById('logoutButtonMobile')?.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut();
            close();
        });
    }

    function interceptNavClicks() {
        document.querySelectorAll('.nav-link, .slideout-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http')) {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    history.pushState({}, '', href);
                    loadPage(href);
                });
            }
        });

        window.addEventListener('popstate', () => {
            loadPage(location.pathname.split('/').pop());
        });
    }

    function loadPage(path) {
        const content = document.getElementById('main-content');
        if (!content) return;
        fetch(path)
            .then(res => res.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newMain = doc.getElementById('main-content');
                if (newMain) {
                    content.innerHTML = newMain.innerHTML;
                    window.scrollTo(0, 0);
                }
            });
    }
});
