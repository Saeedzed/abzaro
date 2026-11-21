import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { Transform } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const dir=join(root,'runtime'), target=join(dir,'LibreOffice.msi');
const expected='480fecf759fc6393bd614fbf43753eb95a8198fc1a065d41b727e3b664cd1e59';
const url='https://download.documentfoundation.org/libreoffice/stable/26.2.7/win/x86_64/LibreOffice_26.2.7_Win_x86-64.msi';
await mkdir(dir,{recursive:true});
try {
 const response=await fetch(url); if(!response.ok || !response.body) throw Error(`Download failed: ${response.status}`);
 const hash=createHash('sha256');
 await pipeline(Readable.fromWeb(response.body),new Transform({transform(chunk,_encoding,cb){hash.update(chunk);cb(null,chunk)}}),createWriteStream(target));
 if(hash.digest('hex')!==expected) throw Error('LibreOffice checksum mismatch');
 console.log('LibreOffice download verified');
} catch(error) { await rm(target,{force:true}); throw error; }
