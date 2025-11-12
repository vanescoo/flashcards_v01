
# Gemini Flashcards - Cloud-Only GCP Deployment Guide

Welcome! This guide is designed for a first-time deployment and will walk you through deploying the entire application using **only your web browser and the Google Cloud console**. You do not need to install Docker, Node.js, or any command-line tools on your personal computer.

---

### The Big Picture: What We Are Building

Our application has two main parts, and we need to find a home for each of them in the cloud:

1.  **The Frontend (The User Interface):** This is the React application you see in the browser. We will host this on **Firebase Hosting**.
2.  **The Backend (The Brains):** This is a small Node.js server. Its jobs are to talk to your database and securely call the Gemini API with your secret API key. We will host this on **Google Cloud Run**.

**The Key Tool: Google Cloud Shell**
We will perform all steps inside **Google Cloud Shell**. This is a powerful, free environment provided by Google that includes:
- A command-line terminal.
- A full code editor (like VS Code).
- All the necessary tools (`gcloud`, `firebase`, `docker`, `npm`) pre-installed.

---

## Step 1: Prerequisites

1.  **A Google Cloud Account:** You need an active GCP project with billing enabled.
2.  **Your Code in a Git Repository:** Your application code (all the files I've provided) must be in a Git repository like GitHub, GitLab, or Bitbucket. This is how you will get your code into the Cloud Shell.

---

## Step 2: Launch Cloud Shell and Get Your Code

1.  **Open the GCP Console:** Go to your [Google Cloud dashboard](https://console.cloud.google.com/).

2.  **Activate Cloud Shell:** In the top-right corner of the console, click the **Activate Cloud Shell** button. It looks like a terminal icon `>_`. A new panel will open at the bottom of your screen with a command-line terminal. All subsequent commands will be run here.

3.  **Clone Your Code Repository:** Run the following command in the Cloud Shell terminal, replacing the URL with your own repository's URL.
    ```bash
    git clone https://github.com/your-username/your-repository-name.git
    ```

4.  **Navigate into Your Project Directory:**
    ```bash
    cd your-repository-name
    ```

---

## Step 3: Configure Your GCP Project

Now, we'll prepare your GCP project to receive the application.

1.  **Set Your Project in the `gcloud` CLI:** Tell Cloud Shell which project you want to work on.
    ```bash
    gcloud config set project [YOUR_PROJECT_ID]
    ```
    (Replace `[YOUR_PROJECT_ID]` with the ID of your project from the GCP Console).

2.  **Enable the Necessary Cloud Services:** This is like flipping the "on" switch for the services we're going to use.
    ```bash
    gcloud services enable run.googleapis.com cloudbuild.googleapis.com firestore.googleapis.com
    ```
    - `run.googleapis.com`: For Google Cloud Run (our backend's home).
    - `cloudbuild.googleapis.com`: A tool that will automatically build our backend container for us.
    - `firestore.googleapis.com`: For our Firestore database.

3.  **Create the Firestore Database:**
    - In the GCP Console (the main web page, not the Cloud Shell), use the search bar at the top to search for "Firestore".
    - Click **"Create Database"**.
    - Choose **"Native Mode"**.
    - Choose a location (the default is fine, e.g., `us-central1`).
    - Click **"Create Database"**.

---

## Step 4: Deploy the Backend to Cloud Run

Here, we'll package our backend server and deploy it.

1.  **Navigate to the Backend Directory:** In your Cloud Shell terminal, go into the `backend` directory.
    ```bash
    cd backend
    ```

2.  **Build the Container with Cloud Build:** This command tells a GCP service (Cloud Build) to build your backend's container image.
    ```bash
    gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/flashcards-backend
    ```
    (Replace `[YOUR_PROJECT_ID]`). This step might take a few minutes.

3.  **Deploy the Container to Cloud Run:** Now, we tell Cloud Run to start running that container as a live web service.
    ```bash
    gcloud run deploy flashcards-backend \
      --image gcr.io/[YOUR_PROJECT_ID]/flashcards-backend \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars="API_KEY=YOUR_GEMINI_API_KEY_HERE"
    ```
    - Replace `[YOUR_PROJECT_ID]` and `YOUR_GEMINI_API_KEY_HERE`.
    - The `--allow-unauthenticated` flag is needed so Firebase Hosting can reach it. We will secure it in the next section.

---

## Step 5: Deploy the Frontend to Firebase Hosting

Finally, let's get the user interface online and connect it to the backend.

1.  **Navigate to the Project's Root Directory:**
    ```bash
    cd ..
    ```

2.  **Login to Firebase:**
    ```bash
    firebase login
    ```
    (This will likely just confirm the Google account you are already using in Cloud Shell).

3.  **Initialize Firebase in Your Project:** This is a one-time setup to create a `firebase.json` configuration file.
    ```bash
    firebase init hosting
    ```
    - **Which project?** Use the arrow keys to select the same GCP project you've been using.
    - **What do you want to use as your public directory?** Type `dist` and press Enter.
    - **Configure as a single-page app?** Type `y` and press Enter.
    - **Set up automatic builds and deploys with GitHub?** Type `n` and press Enter.

4.  **Install Frontend Dependencies:** Before we can build the frontend, we need to install its libraries.
    ```bash
    npm install
    ```

5.  **Build the React App:** This command compiles all your React code into a `dist` folder.
    ```bash
    npm run build
    ```

6.  **Deploy to Firebase!** This command uploads the contents of your `dist` folder to Firebase Hosting.
    ```bash
    firebase deploy
    ```

Your application is now **LIVE!** The terminal will give you a **Hosting URL** (e.g., `https://your-project-id.web.app`). Open this URL in your browser to use your fully deployed application.
