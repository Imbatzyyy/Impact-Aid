// Decrypt a local migration archive into a NEW private directory. Does not restore a database.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const [source, destination] = process.argv.slice(2);
if (!source || !destination) throw new Error('Usage: node scripts/decrypt-migration-backup.mjs BACKUP_DIRECTORY NEW_OUTPUT_DIRECTORY');
process.umask(0o077);
if (fs.existsSync(destination)) throw new Error('Output directory already exists; choose a new private directory.');
const metadata = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'));
const encrypted = fs.readFileSync(path.join(source, 'migration-backup.encrypted.json'));
if (crypto.createHash('sha256').update(encrypted).digest('hex') !== metadata.sha256) throw new Error('Backup checksum mismatch.');
const envelope = JSON.parse(encrypted.toString());
if (envelope.format !== 'AES-256-GCM') throw new Error('Unsupported archive format.');
const key = Buffer.from(execFileSync('/usr/bin/security', ['find-generic-password', '-s', metadata.keychainService, '-a', metadata.keychainAccount, '-w'], { encoding: 'utf8' }).trim(), 'base64');
const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
const decrypted = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]);
const backup = JSON.parse(decrypted.toString());
if (backup.format !== 'impact-aid-backup-v1') throw new Error('Unsupported payload format.');
fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(destination, 'supabase-logical-rows.json'), JSON.stringify(backup.supabase));
fs.writeFileSync(path.join(destination, 'firebase-cutover-and-schema.tar.gz'), Buffer.from(backup.cutoverArchiveGzipBase64, 'base64'));
console.log('Backup authenticated and decrypted into the private output directory. No database was changed.');
