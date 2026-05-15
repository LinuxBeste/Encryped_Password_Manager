import type { VaultEntry, VaultFolder } from '@/types';

interface BackupData {
  version: number;
  exportedAt: number;
  vault: { name: string };
  entries: VaultEntry[];
  folders: VaultFolder[];
}

// Serialize vault data to JSON backup string
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

// Parse and validate a JSON backup string
export async function importEncryptedBackup(
  json: string
): Promise<BackupData> {
  const data = JSON.parse(json) as BackupData;
  if (!data.version || !data.entries || !data.folders) {
    throw new Error('Invalid backup file format');
  }
  return data;
}

// Generate CSV header row for export
export function generateCsvHeader(): string {
  return 'title,username,password,url,type,notes,tags,favorite,folder';
}

// Convert entries array to CSV string
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

// Escape a CSV field value if it contains special characters
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

// Parse a single CSV line into fields, handling quoted values
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

// Parse CSV string into an array of structured entries
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

// Detect which password manager format a CSV uses based on its header
export function detectCsvFormat(csv: string): '1password' | 'bitwarden' | 'lastpass' | 'keepass' | 'unknown' {
  const header = csv.trim().split('\n')[0].toLowerCase();
  const fields = header.split(',').map((f) => f.trim());
  if (fields.includes('url') && fields.includes('username') && fields.includes('password') && !fields.includes('extra') && !fields.includes('group')) return 'bitwarden';
  if (fields.includes('url') && fields.includes('username') && fields.includes('extra')) return '1password';
  if (fields.includes('name') && fields.includes('url') && fields.includes('password')) return 'lastpass';
  if (fields.includes('group') && fields.includes('title') && fields.includes('username')) return 'keepass';
  return 'unknown';
}
