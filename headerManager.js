// /js/headerManager.js
// This script fetches the header, handles authentication state, centers navigation,
// and implements SPA-style page loading for a smoother user experience.

document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) {
        console.error("Header placeholder element not found.");
        return;
    }

    // Fetch the header content and inject it into the placeholder
    fetch('header.html')
        .then(response => response.text())
        .then(html => {
            headerPlaceholder.innerHTML = html;
            return waitForElement('#authLinkMobile');
        })
        .then(() => {
            initializeHeaderFunctionality();
        })
        .catch(error => {
            console.error('Error loading header or waiting for DOM:', error);
            headerPlaceholder.innerHTML = "<p class='text-center text-red-500'>Error loading navigation.</p>";
        });
});

function waitForElement(selector, timeout = 2000) {
    return new Promise((resolve, reject) => {
        const start = performance.now();
        const check = () => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            if (performance.now() - start > timeout) return reject('Timeout waiting for ' + selector);
            requestAnimationFrame(check);
        };
        check();
    });
}

function initializeHeaderFunctionality() {
    if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined') {
        console.error("Firebase is not available. Header functionality will be limited.");
        return;
    }

    const auth = firebase.auth();

    auth.onAuthStateChanged(user => {
        updateAuthUI(user);
        requestAnimationFrame(() => updateAuthUI(user));
    });

    setupMobileMenu(auth);
    interceptNavigationClicks();
    window.addEventListener('popstate', handleBrowserNavigation);
    updateActiveLink(window.location.pathname);
}

function updateAuthUI(user) {
    requestAnimationFrame(() => {
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
    });
}

function setupMobileMenu(auth) {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const closeButton = document.getElementById('mobile-menu-close-button');
    const overlay = document.getElementById('menu-overlay');
    const slideoutMenu = document.getElementById('mobile-slideout-menu');
    const logoutButton = document.getElementById('logoutButtonMobile');

    const openMenu = () => {
        slideoutMenu?.classList.remove('translate-x-full');
        overlay?.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    };

    const closeMenu = () => {
        slideoutMenu?.classList.add('translate-x-full');
        overlay?.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    };

    mobileMenuButton?.addEventListener('click', openMenu);
    closeButton?.addEventListener('click', closeMenu);
    overlay?.addEventListener('click', closeMenu);
    logoutButton?.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut();
        closeMenu();
    });
}

function interceptNavigationClicks() {
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');

        if (!link || link.target === '_blank' || link.href.startsWith('http') || link.hash) return;

        e.preventDefault();
        const destinationPath = new URL(link.href).pathname;

        if (window.location.pathname !== destinationPath) {
            window.history.pushState({ path: destinationPath }, '', destinationPath);
            loadPageContent(destinationPath);
        }

        document.getElementById('mobile-slideout-menu')?.classList.add('translate-x-full');
        document.getElementById('menu-overlay')?.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    });
}

async function loadPageContent(path) {
    const mainContentArea = document.querySelector('main');
    if (!mainContentArea) return (window.location.href = path);

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Fetch failed for ${path}`);

        const newPageHtml = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(newPageHtml, 'text/html');

        const newMainContent = doc.querySelector('main');
        const newTitle = doc.querySelector('title');

        if (newMainContent) {
            mainContentArea.innerHTML = newMainContent.innerHTML;
            document.title = newTitle ? newTitle.textContent : 'Linq';

            newMainContent.querySelectorAll('script').forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.textContent = oldScript.textContent;
                document.body.appendChild(newScript).parentNode.removeChild(newScript);
            });

            updateActiveLink(path);
            window.scrollTo(0, 0);
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
    if (pageName === '') pageName = 'index.html';

    document.querySelectorAll('nav a').forEach(link => {
        const linkName = new URL(link.href).pathname.split('/').pop();
        if (linkName === pageName || (pageName === 'index.html' && linkName === '')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
