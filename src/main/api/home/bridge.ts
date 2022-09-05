import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('darkMode', {
	toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
	system: () => ipcRenderer.invoke('dark-mode:system'),
});

contextBridge.exposeInMainWorld('modManager', {
	getXmlMods: () => ipcRenderer.invoke('mod-manager:get-xml-mods'),
	sendMods: (mods) => ipcRenderer.send('mod-manager:save-ui-mods', mods),
	getPresetNames: () => ipcRenderer.invoke('mod-manager:get-preset-names'),
	getPresetByName: (presetName) => ipcRenderer.send('mod-manager:get-preset', presetName),
	savePreset: (preset) => ipcRenderer.send('mod-manager:save-preset', preset),
});

contextBridge.exposeInMainWorld('logger', {
	info: (...params) => ipcRenderer.send('logger:info', ...params),
});