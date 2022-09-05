
import { app, BrowserWindow } from 'electron';
import { createHomeWindow } from "./home";
import logger from 'electron-log';
require("./init");

app.whenReady().then(() => {
    let window = createHomeWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createHomeWindow();
        }
    });
    window.webContents.openDevTools();
}).catch(e => logger.error(e));

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});