# HonTech Developer Learning Curriculum

This document is your personal roadmap to understanding every piece of code we "vibe coded" to build the HonTech Operations System. Because you built a massive, complex system first, you are going to learn the fundamentals by building small practice projects that lead directly up to understanding HonTech.

---

## 🏗️ The Tech Stack (What We Used)
This system was built using the **MEN Stack** (MongoDB, Express, Node.js) with a Vanilla JavaScript frontend. Here is exactly what you need to learn, broken down into manageable pieces:

### 1. The Frontend ("The Face")
*   **HTML5 & CSS3 / SASS:** How we structured the dashboard and styled the TV monitor.
*   **Vanilla JavaScript (ES6+):** 
    *   Variables (`let`, `const`), Arrays, and Objects.
    *   **DOM Manipulation:** How JavaScript grabs an HTML element (like a button) and changes its color or text.
    *   **Fetch API / Async Await:** How your frontend "talks" to your backend over the internet to get the live job queue.

### 2. The Backend Server ("The Brain & Traffic Cop")
*   **Node.js:** The environment that allows JavaScript to run on a server instead of just in a browser.
*   **Express.js:** The framework we used to build our API.
    *   **Routing:** How we handle different URLs (e.g., `app.get('/api/jobs')`).
    *   **Middleware:** Functions that run in the middle of a request (like checking if a user is logged in before showing them data).

### 3. The Database ("The Memory")
*   **MongoDB:** The NoSQL database where all our Jobs and Users are stored as "Documents" (which look exactly like JavaScript Objects).
*   **Mongoose (ODM):** The tool we use inside Node.js to connect to MongoDB and enforce rules (like "An email is required").

### 4. Advanced Concepts (What makes HonTech "Professional")
*   **Authentication (JWT & Bcrypt):** How we securely hash passwords and use JSON Web Tokens to keep users logged in.
*   **OAuth 2.0:** How we allowed users to "Log in with Google."
*   **Environment Variables (`.env`):** How we hide secret keys so hackers don't steal them.

---

## 🧗‍♂️ Your Project Progression Roadmap

**Yes, you MUST build simple projects first.** If you try to read the HonTech code right now, you will get frustrated. Build these three mini-projects first. I promise, by the time you finish Project 3, you will completely understand the HonTech code!

### Project 1: The "To-Do List" (Frontend Only)
*   **Goal:** Learn Vanilla JavaScript and DOM Manipulation.
*   **What you build:** A simple HTML page with an input box and a button. When you click the button, JavaScript adds the text to a list below. When you click an item, it deletes it.
*   **Why:** This teaches you exactly how the HonTech TV Monitor updates its screen without reloading the page.

### Project 2: The "Weather API Fetcher" (Frontend + External Backend)
*   **Goal:** Learn Async/Await and the Fetch API.
*   **What you build:** A website where you type a city name, and your JavaScript `fetch()`es data from a free public Weather API and displays the temperature.
*   **Why:** This teaches you how the HonTech dashboard asks the backend for the current `Jobs` queue.

### Project 3: The "Mini-Library Server" (Node.js + Express + MongoDB)
*   **Goal:** Learn how to build your own API and Database.
*   **What you build:** A backend server with Express.js that has 3 routes:
    1.  `GET /books` (Gets all books from MongoDB).
    2.  `POST /books` (Saves a new book to MongoDB).
    3.  `DELETE /books/:id` (Deletes a book).
*   **Why:** This is the exact architecture of HonTech. Instead of "Books," HonTech uses "Jobs." If you can build this, you understand 80% of your Capstone's backend.

---

### 💡 Final Advice
Do not rush! Spend a week or two on each practice project. Whenever you get stuck or don't understand a concept, come back to me and ask: *"Explain what 'app.use()' does in Express like I am 5 years old."* I am here to tutor you!
