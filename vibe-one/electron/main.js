import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simplicity in this protected environment
        },
        backgroundColor: '#09090b', // Match dark theme
        autoHideMenuBar: true,
    });

    // In production, load the local bundle.
    // In development, load the Vite dev server.
    if (app.isPackaged) {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
        // DEBUG: Open DevTools to see build errors
        win.webContents.openDevTools({ mode: 'detach' });
    } else {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools({ mode: 'detach' });
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
