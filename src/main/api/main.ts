import { app, BrowserWindow } from 'electron';
import { createHomeWindow } from "./home";
import logger from 'electron-log';

app.whenReady().then(() => {
    createHomeWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createHomeWindow();
        }
    });
}).catch(e => logger.error(e));

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
