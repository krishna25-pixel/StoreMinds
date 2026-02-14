# Deploying to GitHub & Vercel

## 1. GitHub
I have initialized a local Git repository for you.
1.  Create a new repository on GitHub.
2.  Run the commands GitHub gives you to push your code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
    git branch -M main
    git push -u origin main
    ```

## 2. Vercel
1.  Go to [Vercel.com](https://vercel.com) and sign up/login.
2.  Click **"Add New Project"**.
3.  Select **"Continue with GitHub"** and choose your new repository.
4.  **Important Settings**:
    - **Framework Preset**: Vite
    - **Root Directory**: `./` (default)
    - **Build Command**: `npm run build` (default)
    - **Output Directory**: `dist` (default)
    - **Environment Variables**:
      - Click "Environment Variables" to add any secrets if you have them later.
5.  Click **Deploy**.

## ⚠️ CRITICAL WARNING: Database Data Loss
You are using **SQLite** (`storeminds.db`), which is a file-based database.
- On Vercel, the file system is **read-only** or **ephemeral**.
- **This means your data (Inventory, Sales, Users) will be RESET every time you deploy.**
- It is highly recommended to use a Cloud Database (like **Turso**, **Neon**, or **Supabase**) for production apps on Vercel.

If you just want to demo the UI, Vercel is fine. But checking out with the POS might fail or not save permanently.
