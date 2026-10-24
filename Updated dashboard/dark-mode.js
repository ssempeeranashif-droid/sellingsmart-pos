
document.addEventListener("DOMContentLoaded", function () {
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const darkModeIcon = document.getElementById("dark-mode-icon");

    if (!darkModeToggle) {
        return;
    }

    const savedTheme = localStorage.getItem("vendrex-theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }

    function updateThemeButton() {
        const isDarkMode = document.body.classList.contains("dark-mode");

        darkModeToggle.setAttribute(
            "aria-label",
            isDarkMode ? "Switch to light mode" : "Switch to dark mode"
        );

        darkModeToggle.setAttribute(
            "title",
            isDarkMode ? "Switch to light mode" : "Switch to dark mode"
        );

        if (darkModeIcon) {
            if (isDarkMode) {
                darkModeIcon.innerHTML =
                    '<circle cx="12" cy="12" r="4"></circle>' +
                    '<path d="M12 2v2"></path>' +
                    '<path d="M12 20v2"></path>' +
                    '<path d="m4.93 4.93 1.42 1.42"></path>' +
                    '<path d="m17.65 17.65 1.42 1.42"></path>' +
                    '<path d="M2 12h2"></path>' +
                    '<path d="M20 12h2"></path>' +
                    '<path d="m6.35 17.65-1.42 1.42"></path>' +
                    '<path d="m19.07 4.93-1.42 1.42"></path>';
            } else {
                darkModeIcon.innerHTML =
                    '<path d="M21 12.79A9 9 0 1 1 11.21 3 ' +
                    '7 7 0 0 0 21 12.79Z"></path>';
            }
        }
    }

    updateThemeButton();

    darkModeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");

        const isDarkMode = document.body.classList.contains("dark-mode");

        localStorage.setItem(
            "vendrex-theme",
            isDarkMode ? "dark" : "light"
        );

        updateThemeButton();
    });
});
