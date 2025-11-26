/**
 * Toggles the visibility of the user menu.
 */
function toggleUserMenu(event) {
    if (event) {
        event.stopPropagation();
    }
    const menu = document.getElementById('userMenu');
    const arrow = document.querySelector('.arrow-icon');

    if (menu) {
        // Check if active class is present
        const isActive = menu.classList.contains('active');

        if (isActive) {
            menu.classList.remove('active');
            if (arrow) arrow.classList.remove('rotate-180');
        } else {
            menu.classList.add('active');
            if (arrow) arrow.classList.add('rotate-180');
        }
    }
}

// Close menu when clicking outside
document.addEventListener('click', function (event) {
    const menu = document.getElementById('userMenu');
    const arrow = document.querySelector('.arrow-icon');

    if (menu && menu.classList.contains('active')) {
        // If click is outside menu and not on the arrow icon
        if (!menu.contains(event.target) && !event.target.classList.contains('arrow-icon')) {
            menu.classList.remove('active');
            if (arrow) {
                arrow.classList.remove('rotate-180');
            }
        }
    }
});

/**
 * Logs out the user after confirmation.
 * Redirects to the login page.
 */
function logout() {
    if (confirm('¿Cerrar sesión?')) {
        // Check if we are in a subdirectory (pages/) or root
        // Assuming this script is used in pages/ mostly based on current usage
        // But let's make it robust or just keep the existing logic which was '../index.html'
        // Since all files using this are in pages/, '../index.html' is correct.
        window.location.href = '../index.html';
    }
}

/**
 * Shows the success message for password recovery.
 */
function showSuccessMessage() {
    const messageElement = document.getElementById('recoveryMessage');
    if (messageElement) {
        messageElement.style.display = 'block';
    }
}
/**
 * Toggles the state of an accordion item.
 * @param {HTMLElement} headerElement - The header element that was clicked.
 */
function toggleAccordion(headerElement) {
    const item = headerElement.parentElement;
    const arrow = headerElement.querySelector('.arrow-icon');

    // Toggle active class
    if (item.classList.contains('active')) {
        item.classList.remove('active');
        if (arrow) arrow.classList.remove('rotate-180');
    } else {
        item.classList.add('active');
        if (arrow) arrow.classList.add('rotate-180');
    }
}
