/**
 * Apply Bootstrap's light or dark colour mode based on the user's system preference, and keep it in sync if the
 * preference changes while the page is open.
 *
 * Load this in the page's <head> so the colour mode is set before the page is rendered.
 */
(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyColorMode = () => {
        document.documentElement.setAttribute('data-bs-theme', darkModeQuery.matches ? 'dark' : 'light');
    };
    applyColorMode();
    darkModeQuery.addEventListener('change', applyColorMode);
})();
