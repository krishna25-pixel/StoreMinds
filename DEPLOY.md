# Deployment Instructions

Your application is ready for deployment!

## Quick Start (Production)
To run the application in production mode (Client Use):

1.  Open a terminal in this folder.
2.  Run the following command:
    ```bash
    npm start
    ```
3.  Open your browser to `http://localhost:3000`.

## Updating the App
If you make changes to the code, you must rebuild the frontend:

1.  Stop the server (`Ctrl+C`).
2.  Run the build command:
    ```bash
    npm run build
    ```
3.  Start the server again:
    ```bash
    npm start
    ```

## Development
To continue developing with hot-reload:

1.  Terminal 1: `node server/index.js`
2.  Terminal 2: `npm run dev`
