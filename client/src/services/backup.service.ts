import type { VaultEntry, VaultFolder } from '@/types';

interface BackupData {
  version: number;
  exportedAt: number;
  vault: { name: string };
  entries: VaultEntry[];
  folders: VaultFolder[];
}

export async function exportEncryptedBackup(
  vaultName: string,
  entries: VaultEntry[],
  folders: VaultFolder[]
): Promise<string> {
  const backup: BackupData = {
    version: 1,
    exportedAt: Date.now(),
    vault: { name: vaultName },
    entries,
    folders,
  };
  return JSON.stringify(backup, null, 2);
}

export async function importEncryptedBackup(
  json: string
): Promise<BackupData> {
  const data = JSON.parse(json) as BackupData;
  if (!data.version || !data.entries || !data.folders) {
    throw new Error('Invalid backup file format');
  }
  return data;
}

export function generateCsvHeader(): string {
  return 'title,username,password,url,type,notes,tags,favorite,folder';
}

export function convertToCsv(entries: VaultEntry[]): string {
  const lines = [generateCsvHeader()];
  for (const entry of entries) {
    const row = [
      escapeCsv(entry.title),
      escapeCsv(entry.username),
      escapeCsv(entry.password),
      escapeCsv(entry.url),
      escapeCsv(entry.type),
      escapeCsv(entry.notes),
      escapeCsv(entry.tags.join(';')),
      entry.favorite ? 'true' : 'false',
      escapeCsv(entry.folderId || ''),
    ];
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

interface CsvEntry {
  title: string;
  username: string;
  password: string;
  url: string;
  type: string;
  notes: string;
  tags: string;
  favorite: string;
  folder: string;
}

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function parseCsvImport(csv: string): CsvEntry[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCsvRow(lines[0]);
  const results: CsvEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvRow(lines[i]);
    if (values.length >= 4) {
      const entry: Record<string, string> = {};
      headers.forEach((h, idx) => { entry[h.trim()] = values[idx] || ''; });
      results.push(entry as unknown as CsvEntry);
    }
  }

  return results;
}

export function detectCsvFormat(csv: string): '1password' | 'bitwarden' | 'lastpass' | 'keepass' | 'unknown' {
  const header = csv.trim().split('\n')[0].toLowerCase();
  if (header.includes('url') && header.includes('username') && header.includes('password')) return 'bitwarden';
  if (header.includes('url') && header.includes('username') && header.includes('extra')) return '1password';
  if (header.includes('name') && header.includes('url') && header.includes('password')) return 'lastpass';
  if (header.includes('group') && header.includes('title') && header.includes('username')) return 'keepass';
  return 'unknown';
}
