const { app, BrowserWindow, dialog, ipcMain, protocol, net, session } = require('electron');
const { join, resolve, sep } = require('node:path');
const { pathToFileURL } = require('node:url');
const { existsSync } = require('node:fs');
const { writeFile } = require('node:fs/promises');
const { convertDocx } = require('./converter.cjs');
protocol.registerSchemesAsPrivileged([{ scheme: 'abzaro', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
let mainWindow, converting = false;
function officePath() {
  if (process.platform !== 'win32') return '/usr/bin/libreoffice'; // development tests only
  const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']].filter(Boolean);
  return roots.map(root => join(root, 'LibreOffice', 'program', 'soffice.exe')).find(existsSync);
}
app.whenReady().then(() => {
  const site = resolve(app.isPackaged ? join(process.resourcesPath, 'site') : join(__dirname, '..', 'out'));
  protocol.handle('abzaro', request => {
    try {
      const url = new URL(request.url);
      if (url.hostname !== 'app' || request.method !== 'GET') return new Response('Not found', { status: 404 });
      let path = decodeURIComponent(url.pathname);
      if (path.endsWith('/')) path += 'index.html';
      const file = resolve(site, '.' + path);
      if (!file.startsWith(site + sep)) return new Response('Forbidden', {status: 403});
      return net.fetch(pathToFileURL(file).href);
    } catch { return new Response('Bad request', {status: 400}); }
  });
  // Keep the trial offline. Only app resources and in-memory assets are allowed.
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: !/^(abzaro|file|blob|data|devtools):/i.test(details.url) });
  });
  mainWindow = new BrowserWindow({ width: 1280, height: 850, minWidth: 360, minHeight: 600, show: true,
    webPreferences: { preload: join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true } });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => { if (!url.startsWith('abzaro://app/')) event.preventDefault(); });
  mainWindow.loadURL('abzaro://app/');
  ipcMain.handle('convert-docx', async (event, data, name) => {
    if (event.sender !== mainWindow.webContents || !event.senderFrame.url.startsWith('abzaro://app/')) throw new Error('دسترسی مجاز نیست.');
    if (converting) throw new Error('یک تبدیل دیگر در حال انجام است.');
    if (!(data instanceof Uint8Array) || data.byteLength > 20 * 1024 * 1024 || typeof name !== 'string' || !/\.docx$/i.test(name)) throw new Error('فایل DOCX معتبر نیست یا بیش از ۲۰ مگابایت است.');
    const binary = officePath();
    if (!binary) throw new Error('LibreOffice روی ویندوز پیدا نشد. برنامه را نصب یا نصب ابزارو را تکرار کنید.');
    const defaultName = name.replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').replace(/\.docx$/i, '.pdf');
    const result = await dialog.showSaveDialog(mainWindow, { title: 'ذخیرهٔ PDF', defaultPath: defaultName, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
    if (result.canceled || !result.filePath) return { canceled: true };
    converting = true;
    try { await writeFile(result.filePath, await convertDocx(data, binary)); return { canceled: false }; }
    finally { converting = false; }
  });
});
app.on('window-all-closed', () => app.quit());
