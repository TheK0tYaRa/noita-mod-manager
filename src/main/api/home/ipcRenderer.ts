import { contextBridge, ipcRenderer } from 'electron';
import logger from 'electron-log';
import { Mod } from "./index";

contextBridge.exposeInMainWorld('logger', {
	info: (...params: any[]) => logger.info("[ipcRenderer][INFO]", ...params),
	error: (...params: any[]) => logger.error("[ipcRenderer][ERROR]", ...params),
});

contextBridge.exposeInMainWorld('darkMode', {
	toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
	system: () => ipcRenderer.invoke('dark-mode:system'),
});

contextBridge.exposeInMainWorld('modManager', {
	deletePreset: async (presetName: string) => ipcRenderer.send('mod-manager:delete-preset', presetName),
	getMods: async () => ipcRenderer.invoke('mod-manager:get-mods'),
	getCurrentPreset: async () => ipcRenderer.invoke('mod-manager:get-current-preset'),
	getPresets: async () => ipcRenderer.invoke('mod-manager:get-preset-names'),
	loadPreset: async (presetName: string) => ipcRenderer.send('mod-manager:load-preset', presetName),
	savePreset: async (mods: Mod[]) => ipcRenderer.send('mod-manager:save-preset', mods),
	savePresetAs: async (presetName: string, mods: Mod[]) => ipcRenderer.send('mod-manager:new-preset', presetName, mods),
});

contextBridge.exposeInMainWorld('registerCallback', {
	reloadModTable: (callback: Function) => {
		logger.info("registered reloadModTable callback");
		presetCallback = callback;
	}, 
});

let presetCallback: Function;
ipcRenderer.on("mod-manager:preset-is-loaded", (_event, mods) => presetCallback(mods));
