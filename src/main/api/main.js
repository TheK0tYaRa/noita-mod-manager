"use strict";

const { app, BrowserWindow } = require('electron');
const { createHomeWindow } = require("./home/controller");
const logger = require('electron-log');
require("./init/common");

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