document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) return;

    fetch('header.html')
        .then(res => res.text())
        .then(html => {
            headerPlaceholder.innerHTML = html;
            initHeader();
        });

    function initHeader() {
        if (typeof firebase === 'undefined') return;
        const auth = firebase.auth();

        auth.onAuthStateChanged(user => {
            const isLoggedIn = !!user;

            // DESKTOP
            document.getElementById('authLinkDesktopLogin')?.classList.toggle('hidden', isLoggedIn);
            document.getElementById('profileLinkDesktop')?.classList.toggle('hidden', !isLoggedIn);

            const navProfilePic = document.getElementById('navProfilePic');
            if (navProfilePic) {
                navProfilePic.style.display = isLoggedIn ? 'block' : 'none';
                if (isLoggedIn) {
                    const photo = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${user.email[0].toUpperCase()}`;
                    navProfilePic.src = photo;
                }
            }

            // MOBILE
            document.getElementById('authLinkMobile')?.classList.toggle('hidden', isLoggedIn);
            document.getElementById('bottomProfileLinkMobile')?.classList.toggle('hidden', !isLoggedIn);
            document.getElementById('logoutButtonMobile')?.classList.toggle('hidden', !isLoggedIn);
            document.getElementById('slideout-user-info')?.classList.toggle('hidden', !isLoggedIn);

            if (isLoggedIn) {
                const photo = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${user.email[0].toUpperCase()}`;
                document.getElementById('slideoutProfilePic').src = photo;
                document.getElementById('slideoutDisplayName').textContent = user.displayName || 'User';
                document.getElementById('slideoutEmail').textContent = `@${user.email.split('@')[0]}`;
            }
        });

        // Mobile menu
        document.getElementById('mobile-menu-button')?.addEventListener('click', () => {
            document.getElementById('mobile-slideout-menu')?.classList.remove('translate-x-full');
            document.getElementById('menu-overlay')?.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        });

        document.getElementById('mobile-menu-close-button')?.addEventListener('click', closeMobileMenu);
        document.getElementById('menu-overlay')?.addEventListener('click', closeMobileMenu);

        document.getElementById('logoutButtonMobile')?.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut();
            closeMobileMenu();
        });

        function closeMobileMenu() {
            document.getElementById('mobile-slideout-menu')?.classList.add('translate-x-full');
            document.getElementById('menu-overlay')?.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    }
});
