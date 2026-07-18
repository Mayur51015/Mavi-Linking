# Contributing to Mavi-Linking

First off, thank you for taking the time to contribute! 🎉 Contributions from the community make projects like this amazing. 

This guide will help you set up the project locally, understand our project structure, adapt to our coding standards, and navigate the contribution workflow smoothly. Please take a moment to review these guidelines before getting started.

---

## 📌 Code of Conduct
By participating in this project, you agree to maintain a respectful, welcoming, and collaborative environment for everyone. Please be kind, constructive, and helpful to fellow contributors.

---

## 🛠️ Prerequisites & Local Setup

### Prerequisites
Before you begin, ensure you have the following installed on your local machine:
* Node.js (v16 or higher recommended)
* npm or yarn
* MongoDB (running locally or a remote URI string)

### Step-by-Step Installation
1. Fork the Repository: Click the "Fork" button at the top right of the repository page to create your own copy of the project.
2. Clone Your Fork: Open your terminal and run the following command (replace YOUR_USERNAME with your GitHub username):
   git clone https://github.com/YOUR_USERNAME/Mavi-Linking.git
3. Navigate to the Directory:
   cd Mavi-Linking
4. Create a New Branch: Always create a descriptive branch for your changes instead of working directly on the main branch.
   git checkout -b feature/your-feature-name

### Running the Application Locally
The project is split into a client and a server environment. You need to configure and install dependencies for both.

Setup the Server:
1. Navigate to the server folder: cd server
2. Install dependencies: npm install
3. Configure your environment: Copy .env.example to a new file named .env and fill in your MongoDB URI, port config, and other required variables.
4. Start the backend: npm run dev

Setup the Client:
1. Open a new terminal window and navigate to the client folder: cd client
2. Install front-end dependencies: npm install
3. Start the Vite front-end development server: npm run dev

---

## 📂 Repository Structure
To keep your changes organized, please familiarize yourself with the structural layouts:

* client/ - React front-end built with Vite.
  * src/components/ - Reusable UI widgets and presentation layers.
  * src/pages/ - Feature-specific dashboard layouts and screen workflows.
  * src/context/ - Global application state management.
* server/ - Node.js and Express backend app.
  * src/config/ - Database configurations and socket orchestrators.
  * src/models/ - Mongoose schemas handling data collection rules.
  * src/controllers/ - Route operational behaviors and core business logic handlers.
  * src/services/ - Integration services (e.g., LeetCode parsers, AI analyzers).

---

## 🌿 Git Branch Naming Conventions
To keep the repository organized, please use the following prefix formats for your branches:
* feature/ for adding new features or components (e.g., feature/add-radar-chart)
* fix/ for fixing bugs or unexpected behavior (e.g., fix/auth-token-refresh)
* docs/ for documentation updates, typos, or comments (e.g., docs/add-contributing-guide)
* refactor/ for restructuring code without changing its functionality (e.g., refactor/clean-routes)

---

## 📝 Commit Message Guidelines
Clear commit messages help everyone understand the history of the codebase. Please use the imperative mood and follow this format:

Format: <type>: <short summary of changes in present tense>

Examples:
* feat: implement student validation controller inside teacher modules
* fix: resolve broken alignment inside profile document loader views
* docs: create comprehensive contributing guidelines for setup tracking

---

## 🎨 Coding Standards & Best Practices

To maintain high code quality across the entire MERN workspace, follow these explicit rules:

### Client Standards (React / JavaScript)
* Write structural templates using functional components and clean React Hooks.
* Use const for variables that won't be reassigned and let for mutable pointers; avoid var.
* Apply descriptive camelCase variable names for functions, hooks, and context bindings.
* Clean out temporary diagnostic console.log calls before pushing up your branches.

### Server Standards (Node.js / Express)
* Keep routes clean; wrap logical processes cleanly inside designated Controller or Service layers.
* Always enforce async/await patterns alongside bulletproof try/catch error handling blocks.
* Validate all payload properties using global middlewares before passing data to Mongoose hooks.
* Maintain clean formatting guidelines across all application structures.

---

## 🔄 Contribution Workflow

### 1. Reporting Issues & Claiming Tasks
* Look through the open issues to find tasks you'd like to work on. 
* If you find a bug or want to suggest an optimization that isn't listed, open a new issue describing the problem or feature request clearly.
* Wait to be assigned to an issue by a maintainer before you begin writing code to prevent overlapping work.

### 2. Opening a Pull Request (PR)
Once your changes are ready and tested locally:
1. Commit and push your branch to your forked repository:
   git push origin feature/your-feature-name
2. Navigate to the original repository on GitHub. You should see a prompt to open a Pull Request.
3. Fill out the PR template with a clear title and a description explaining what your code changes accomplish.
4. Link the PR to the issue it resolves by writing "Closes #IssueNumber" in the description.

---

## ✅ Pre-PR Checklist
Before clicking "Create pull request", make sure you can check off all of the following:
- [ ] Both client and server instances spin up locally without console failures.
- [ ] My changes match the existing formatting styles and architectural rules.
- [ ] The newly added features have been validated manually across UI layout states.
- [ ] My local working branch is completely up to date with upstream main commits.
- [ ] All commit messages explicitly align with repo prefix typing definitions.

---

Thank you again for your contribution! Your efforts help make Mavi-Linking better for everyone. Happy coding! 🚀