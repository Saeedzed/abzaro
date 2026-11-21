const { mkdtemp, writeFile, readFile, rm, stat } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');

async function convertDocx(bytes, binary, timeoutMs = 120000) {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > 20 * 1024 * 1024) throw new Error('حجم فایل باید بین ۱ بایت و ۲۰ مگابایت باشد.');
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('فایل DOCX معتبر نیست.');
  const dir = await mkdtemp(join(tmpdir(), 'abzaro-doc-'));
  try {
    const input = join(dir, 'document.docx'), profile = join(dir, 'profile');
    await writeFile(input, bytes);
    const { mkdir } = require('node:fs/promises');
    await mkdir(join(profile, 'user'), { recursive: true });
    await writeFile(join(profile, 'user', 'registrymodifications.xcu'), `<?xml version="1.0" encoding="UTF-8"?><oor:items xmlns:oor="http://openoffice.org/2001/registry"><item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop><prop oor:name="BlockUntrustedRefererLinks" oor:op="fuse"><value>true</value></prop></item><item oor:path="/org.openoffice.Office.Writer/Content/Update"><prop oor:name="Link" oor:op="fuse"><value>1</value></prop></item></oor:items>`);
    await new Promise((resolve, reject) => {
      const child = spawn(binary, [`-env:UserInstallation=${pathToFileURL(profile).href}`, '--headless', '--nologo', '--nodefault', '--nofirststartwizard', '--convert-to', 'pdf:writer_pdf_Export', '--outdir', dir, input], { windowsHide: true, stdio: 'ignore', shell: false });
      let done = false;
      const finish = error => { if (done) return; done = true; clearTimeout(timer); error ? reject(error) : resolve(); };
      const timer = setTimeout(() => {
        if (process.platform === 'win32' && child.pid) spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
        else child.kill('SIGKILL');
        finish(new Error('زمان تبدیل تمام شد.'));
      }, timeoutMs);
      child.once('error', () => finish(new Error('LibreOffice پیدا نشد یا اجرا نشد.')));
      child.once('close', code => finish(code === 0 ? null : new Error('تبدیل فایل انجام نشد؛ فایل را بررسی کنید.')));
    });
    const output = join(dir, 'document.pdf');
    const size = (await stat(output)).size;
    if (!size || size > 100 * 1024 * 1024) throw new Error('خروجی معتبر نیست یا بیش از حد بزرگ است.');
    const pdf = await readFile(output);
    if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error('فایل PDF معتبر تولید نشد.');
    return pdf;
  } finally { await rm(dir, { recursive: true, force: true }).catch(() => {}); }
}
module.exports = { convertDocx };
