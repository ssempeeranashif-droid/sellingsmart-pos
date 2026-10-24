
const loginSection = document.getElementById("login-section");
const resetSection = document.getElementById("reset-section");

const showReset = document.getElementById("show-reset");
const backToLogin = document.getElementById("back-to-login");
const backToLoginAfterReset = document.getElementById(
    "back-to-login-after-reset"
);

const resetRequestSection = document.getElementById(
    "reset-request-section"
);
const resetCompleteSection = document.getElementById(
    "reset-complete-section"
);

const resetRequestForm = document.getElementById("reset-request-form");
const resetEmail = document.getElementById("reset-email");
const resetRequestMessage = document.getElementById(
    "reset-request-message"
);

const resetForm = document.getElementById("reset-password-form");
const newPassword = document.getElementById("new-password");
const confirmPassword = document.getElementById("confirm-password");
const passwordMessage = document.getElementById("password-message");

function showMessage(element, message, color) {
    if (!element) return;

    element.textContent = message;
    element.style.color = color;
}

function showResetRequest() {
    loginSection.hidden = true;
    resetSection.hidden = false;

    resetRequestSection.hidden = false;
    resetCompleteSection.hidden = true;

    resetRequestForm.reset();
    resetForm.reset();

    showMessage(resetRequestMessage, "", "");
    showMessage(passwordMessage, "", "");

    window.history.replaceState({}, document.title, window.location.pathname);
}

function returnToLogin() {
    resetSection.hidden = true;
    loginSection.hidden = false;

    resetRequestForm.reset();
    resetForm.reset();

    showMessage(resetRequestMessage, "", "");
    showMessage(passwordMessage, "", "");

    window.history.replaceState({}, document.title, window.location.pathname);
}

showReset.addEventListener("click", function (event) {
    event.preventDefault();
    showResetRequest();
});

backToLogin.addEventListener("click", function (event) {
    event.preventDefault();
    returnToLogin();
});

backToLoginAfterReset.addEventListener("click", function (event) {
    event.preventDefault();
    returnToLogin();
});

resetRequestForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = resetEmail.value.trim();

    if (!email) {
        showMessage(
            resetRequestMessage,
            "Please enter your registered email address.",
            "#d92d20"
        );
        return;
    }

    const submitButton = resetRequestForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;

    showMessage(
        resetRequestMessage,
        "Submitting your request...",
        "#7185a3"
    );

    try {
        const response = await fetch("/api/password-reset/request", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({ email: email })
        });

        const result = await response.json();

        if (!response.ok) {
            showMessage(
                resetRequestMessage,
                result.message || "Unable to submit your request. Please try again.",
                "#d92d20"
            );
            return;
        }

        showMessage(
            resetRequestMessage,
            result.message ||
                "If an account exists for that email, a password-reset link will be sent.",
            "#16803d"
        );

    } catch (error) {
        console.error("Password-reset request failed:", error);

        showMessage(
            resetRequestMessage,
            "Cannot connect to the server. Please try again later.",
            "#d92d20"
        );

    } finally {
        submitButton.disabled = false;
    }
});

const resetUrl = new URL(window.location.href);
const resetToken = resetUrl.searchParams.get("token");

if (resetToken) {
    loginSection.hidden = true;
    resetSection.hidden = false;

    resetRequestSection.hidden = true;
    resetCompleteSection.hidden = false;

    showMessage(passwordMessage, "", "");
}

resetForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!resetToken) {
        showMessage(
            passwordMessage,
            "Open the password-reset link sent to your email before choosing a new password.",
            "#d92d20"
        );
        return;
    }

    const password = newPassword.value;
    const confirmation = confirmPassword.value;

    if (password !== confirmation) {
        showMessage(
            passwordMessage,
            "Passwords do not match.",
            "#d92d20"
        );
        return;
    }

    const requirements = [
        {
            valid: password.length >= 8,
            message: "at least 8 characters"
        },
        {
            valid: /[A-Z]/.test(password),
            message: "at least one uppercase letter"
        },
        {
            valid: /[a-z]/.test(password),
            message: "at least one lowercase letter"
        },
        {
            valid: /[0-9]/.test(password),
            message: "at least one number"
        },
        {
            valid: /[^A-Za-z0-9]/.test(password),
            message: "at least one special character"
        }
    ];

    const missing = requirements
        .filter(requirement => !requirement.valid)
        .map(requirement => requirement.message);

    if (missing.length > 0) {
        showMessage(
            passwordMessage,
            "Password must contain " + missing.join(", ") + ".",
            "#d92d20"
        );
        return;
    }

    const passwordBytes = new TextEncoder().encode(password).length;

    if (passwordBytes > 72) {
        showMessage(
            passwordMessage,
            "Password must not exceed 72 bytes when encoded as UTF-8.",
            "#d92d20"
        );
        return;
    }

    const submitButton = resetForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;

    showMessage(
        passwordMessage,
        "Updating your password...",
        "#7185a3"
    );

    try {
        const response = await fetch("/api/password-reset/complete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                token: resetToken,
                newPassword: password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            showMessage(
                passwordMessage,
                result.message || "Unable to reset your password. Request a new link if it has expired.",
                "#d92d20"
            );
            return;
        }

            
        showMessage(
            passwordMessage,
            result.message || "Your password has been reset. You can now log in.",
            "#16803d"
        );

        resetForm.reset();

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

        setTimeout(() => {
            returnToLogin();
        }, 2500);

    } catch (error) {
        console.error("Password reset failed:", error);

        showMessage(
            passwordMessage,
            "Cannot connect to the server. Please try again later.",
            "#d92d20"
        );

    } finally {
        submitButton.disabled = false;
    }
});
       


const loginForm = document.getElementById("login-form");

const loginMessage = document.createElement("p");
loginMessage.id = "login-message";
loginMessage.setAttribute("role", "status");
loginMessage.style.marginTop = "15px";
loginMessage.style.fontSize = "14px";

loginForm.insertAdjacentElement("afterend", loginMessage);

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    loginMessage.textContent = "Checking your login details...";
    loginMessage.style.color = "#7185a3";

    const loginButton = loginForm.querySelector('button[type="submit"]');
    loginButton.disabled = true;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            loginMessage.textContent =
                result.message || "Login failed. Please try again.";

            loginMessage.style.color = "#d92d20";
            return;
        }

        loginMessage.textContent = "Login successful. Opening dashboard...";
        loginMessage.style.color = "#16803d";

        if (result.redirect === "/dashboard/") {
            window.location.href = result.redirect;
        }

    } catch (error) {
        console.error("Login request failed:", error);

        loginMessage.textContent =
            "Cannot connect to the server. Make sure the POS backend is running.";

        loginMessage.style.color = "#d92d20";

    } finally {
        loginButton.disabled = false;
    }
});


const resetNewPasswordInput = document.getElementById("new-password");

if (resetNewPasswordInput) {
    const requirements = {
        length: document.getElementById("reset-req-length"),
        upper: document.getElementById("reset-req-upper"),
        lower: document.getElementById("reset-req-lower"),
        number: document.getElementById("reset-req-number"),
        special: document.getElementById("reset-req-special")
    };

    const strengthBar = document.getElementById(
        "reset-password-strength-bar"
    );

    const strengthText = document.getElementById(
        "reset-password-strength-text"
    );

    resetNewPasswordInput.addEventListener("input", function () {
        const password = this.value;

        const checks = {
            length: password.length >= 8 &&
                new TextEncoder().encode(password).length <= 72,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };

        Object.keys(checks).forEach((key) => {
            if (requirements[key]) {
                requirements[key].classList.toggle(
                    "valid",
                    checks[key]
                );
            }
        });

        const score = Object.values(checks).filter(Boolean).length;

        if (!password) {
            strengthBar.style.width = "0";
            strengthText.textContent = "Password strength: Not entered";
            strengthText.style.color = "#667085";
            return;
        }

        const strengthLevels = [
            { label: "Very weak", color: "#d92d20" },
            { label: "Weak", color: "#d92d20" },
            { label: "Fair", color: "#dc6803" },
            { label: "Good", color: "#16803d" },
            { label: "Strong", color: "#16803d" },
            { label: "Strong", color: "#16803d" }
        ];

        const level = strengthLevels[score];

        strengthBar.style.width = `${(score / 5) * 100}%`;
        strengthBar.style.background = level.color;

        strengthText.textContent =
            `Password strength: ${level.label}`;

        strengthText.style.color = level.color;
    });
}
