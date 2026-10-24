
require("dotenv").config();

const bcrypt = require("bcrypt");
const db = require("./database");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function createAdmin() {
    try {
        console.log("\n=== Create Vendrex POS Administrator ===\n");

        const fullName = (await ask("Administrator full name: ")).trim();
        const email = (await ask("Administrator email: ")).trim().toLowerCase();
        const password = await ask("Administrator password (minimum 8 characters): ");

        if (!fullName || !email || password.length < 8) {
            console.log(
                "\nPlease enter a name, a valid email, and a password of at least 8 characters."
            );
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const sql = `
            INSERT INTO users (full_name, email, password_hash, role, status)
            VALUES (?, ?, ?, 'Administrator', 'Active')
        `;

        db.query(sql, [fullName, email, passwordHash], (error, result) => {
            if (error) {
                if (error.code === "ER_DUP_ENTRY") {
                    console.log("\nAn account with that email already exists.");
                } else {
                    console.error("\nCould not create administrator:", error.message);
                }
            } else {
                console.log("\nAdministrator account created successfully!");
                console.log("User ID:", result.insertId);
                console.log("You can now test the login page.");
            }

            rl.close();
            db.end();
        });

    } catch (error) {
        console.error("Setup failed:", error.message);
        rl.close();
        db.end();
    }
}

createAdmin();
