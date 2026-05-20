import { describe, it, expect } from 'vitest';
import {
  exportEncryptedBackup,
  importEncryptedBackup,
  generateCsvHeader,
  convertToCsv,
  parseCsvImport,
  detectCsvFormat,
} from '../backup.service';
import type { VaultEntry, VaultFolder } from '@/types';

const mockEntry = (overrides: Partial<VaultEntry> = {}): VaultEntry => ({
  id: '1',
  vaultId: 'v1',
  folderId: null,
  type: 'password',
  title: 'Test Entry',
  username: 'testuser',
  password: 'secret123',
  url: 'https://example.com',
  notes: 'my notes',
  totpSecret: null,
  tags: ['work', 'important'],
  customFields: [],
  favorite: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null,
  origin: 'server',
  ...overrides,
});

const mockFolder = (overrides: Partial<VaultFolder> = {}): VaultFolder => ({
  id: 'f1',
  name: 'Work',
  parentId: null,
  sortOrder: 0,
  entryCount: 3,
  ...overrides,
});

describe('exportEncryptedBackup', () => {
  it('produces valid JSON with version and metadata', async () => {
    const json = await exportEncryptedBackup('MyVault', [mockEntry()], [mockFolder()]);
    const data = JSON.parse(json);
    expect(data.version).toBe(1);
    expect(data.vault.name).toBe('MyVault');
    expect(data.entries).toHaveLength(1);
    expect(data.folders).toHaveLength(1);
    expect(data.exportedAt).toBeDefined();
  });
});

describe('importEncryptedBackup', () => {
  it('parses valid backup JSON', async () => {
    const json = JSON.stringify({
      version: 1,
      exportedAt: Date.now(),
      vault: { name: 'Test' },
      entries: [mockEntry()],
      folders: [mockFolder()],
    });
    const data = await importEncryptedBackup(json);
    expect(data.version).toBe(1);
    expect(data.entries).toHaveLength(1);
  });

  it('throws for invalid backup format', async () => {
    await expect(importEncryptedBackup('{}')).rejects.toThrow('Invalid backup file format');
    await expect(importEncryptedBackup('{"version":1}')).rejects.toThrow('Invalid backup file format');
  });

  it('throws for invalid JSON', async () => {
    await expect(importEncryptedBackup('not json')).rejects.toThrow();
  });
});

describe('generateCsvHeader', () => {
  it('returns correct CSV header', () => {
    const header = generateCsvHeader();
    expect(header).toBe('title,username,password,url,type,notes,tags,favorite,folder');
  });
});

describe('convertToCsv', () => {
  it('converts entries to CSV format', () => {
    const entries = [mockEntry({ tags: ['work'] })];
    const csv = convertToCsv(entries);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe(generateCsvHeader());
    expect(lines[1]).toContain('Test Entry');
    expect(lines[1]).toContain('testuser');
  });

  it('escapes fields with commas or quotes', () => {
    const entries = [mockEntry({ title: 'Hello, World', notes: 'Say "hi"' })];
    const csv = convertToCsv(entries);
    expect(csv).toContain('"Hello, World"');
    expect(csv).toContain('"Say ""hi"""');
  });
});

describe('parseCsvImport', () => {
  it('parses valid CSV content', () => {
    const csv = 'title,username,password,url,type,notes,tags,favorite,folder\n' +
      'My Entry,user,pass,https://x.com,password,note here,tag1,false,\n' +
      'Entry2,user2,pass2,,,notes2,,true,f1\n';
    const entries = parseCsvImport(csv);
    expect(entries).toHaveLength(2);
    expect(entries[0].title).toBe('My Entry');
    expect(entries[1].title).toBe('Entry2');
  });

  it('returns empty array for CSV with only headers', () => {
    const csv = 'title,username,password,url,type,notes,tags,favorite,folder\n';
    expect(parseCsvImport(csv)).toEqual([]);
  });

  it('handles quoted fields in CSV', () => {
    const csv = 'title,username,password,url,type,notes,tags,favorite,folder\n"Hello, World","user, name","pass""word",,,,hello,false,';
    const entries = parseCsvImport(csv);
    expect(entries[0].title).toBe('Hello, World');
    expect(entries[0].username).toBe('user, name');
    expect(entries[0].password).toBe('pass"word');
  });

  it('returns empty array for empty CSV', () => {
    expect(parseCsvImport('')).toEqual([]);
  });
});

describe('detectCsvFormat', () => {
  it('detects Bitwarden format', () => {
    const csv = 'url,username,password,notes\nhttps://x.com,user,pass,note';
    expect(detectCsvFormat(csv)).toBe('bitwarden');
  });

  it('detects 1Password format', () => {
    const csv = 'url,username,extra,password\nhttps://x.com,user,note,pass';
    expect(detectCsvFormat(csv)).toBe('1password');
  });

  it('detects LastPass format', () => {
    const csv = 'name,url,password,extra\nMySite,https://x.com,pass,note';
    expect(detectCsvFormat(csv)).toBe('lastpass');
  });

  it('detects KeePass format', () => {
    const csv = 'group,title,username,password,url\nFolder,MySite,user,pass,https://x.com';
    expect(detectCsvFormat(csv)).toBe('keepass');
  });

  it('returns unknown for unrecognized format', () => {
    const csv = 'foo,bar,baz\n1,2,3';
    expect(detectCsvFormat(csv)).toBe('unknown');
  });
});
