// /js/headerManager.js

document.addEventListener('DOMContentLoaded', () => {
    // Find the placeholder element in the HTML where the header will be injected.
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) return; // Exit if the placeholder isn't found on the page.

    // Function to set the active state on the correct navigation link.
    function setActiveNavLink() {
        const currentPath = window.location.pathname.split("/").pop() || "index.html";
        // Query within the headerPlaceholder to ensure we only affect header links.
        headerPlaceholder.querySelectorAll('a.nav-link').forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPath) {
                 link.classList.add('active');
            }
        });
    }

    // Fetch the content of header.html.
    fetch('header.html')
        .then(res => {
            // Check if the request was successful.
            if (!res.ok) {
                return Promise.reject('Header fetch failed');
            }
            return res.text(); // Get the HTML content as text.
        })
        .then(html => {
            // Inject the fetched HTML into the placeholder.
            headerPlaceholder.innerHTML = html;
            const nav = headerPlaceholder.querySelector('nav');
            // Initially hide the navigation bar to prevent flickering.
            if (nav) {
                nav.classList.add('invisible');
            }

            // Set up a listener for Firebase authentication state changes.
            firebase.auth().onAuthStateChanged(user => {
                // Get references to the login button and the user profile link/picture.
                const authLink = document.getElementById('authLinkDesktopLogin');
                const profileLink = document.getElementById('profileLinkDesktop');
                const profilePic = document.getElementById('navProfilePic');

                if (user) {
                    // If a user is logged in:
                    // Hide the login button.
                    authLink?.classList.add('hidden');
                    // Show the profile link.
                    profileLink?.classList.remove('hidden');
                    
                    // Determine the text for the placeholder avatar.
                    const name = user.displayName || user.email || "U";
                    // Set the profile picture source. Use photoURL if available, otherwise generate a placeholder.
                    if (profilePic) {
                        profilePic.src = user.photoURL || `https://placehold.co/40x40/2C2F33/EAEAEA?text=${name[0].toUpperCase()}`;
                    }
                } else {
                    // If no user is logged in:
                    // Show the login button.
                    authLink?.classList.remove('hidden');
                    // Hide the profile link.
                    profileLink?.classList.add('hidden');
                }

                // After updating the UI, set the active navigation link.
                setActiveNavLink();

                // Make the navigation bar visible after the auth check is complete.
                if (nav) {
                    nav.classList.remove('invisible');
                }
            });
        })
        .catch(err => {
            // Log any errors that occur during the header loading process.
            console.error('Header load error:', err);
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = "<p class='text-red-500 text-center py-3'>Error loading navigation.</p>";
            }
        });
});
