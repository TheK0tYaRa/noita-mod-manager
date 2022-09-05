import { ipcMain, nativeTheme } from "electron";

/**
 * Common ipcMain handlers
 */

ipcMain.handle('dark-mode:toggle', () => {
    if (nativeTheme.shouldUseDarkColors) {
        nativeTheme.themeSource = 'light';
    } else {
        nativeTheme.themeSource = 'dark';
    }
    return nativeTheme.shouldUseDarkColors;
});

ipcMain.handle('dark-mode:system', () => {
    nativeTheme.themeSource = 'system';
});