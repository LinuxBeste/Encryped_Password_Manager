import { useState } from 'react';
import {
  KeyRound, Star, Lock, FileText, CreditCard, User, Terminal,
  ChevronDown, ChevronRight, Settings, LogOut, Shield, Circle
} from 'lucide-react';
import { FolderTree } from '../folders/FolderTree';

type NavItem = {
  id: string;
  label: string;
  icon: typeof KeyRound;
  count?: number;
};

const navItems: NavItem[] = [
  { id: 'all', label: 'All Items', icon: Lock },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'passwords', label: 'Passwords', icon: KeyRound },
  { id: 'notes', label: 'Secure Notes', icon: FileText },
  { id: 'credit-cards', label: 'Credit Cards', icon: CreditCard },
  { id: 'identities', label: 'Identities', icon: User },
  { id: 'ssh-keys', label: 'SSH Keys', icon: Terminal },
];

interface SidebarProps {
  selectedNav: string;
  onSelectNav: (id: string) => void;
  onLock: () => void;
  onSettings: () => void;
  userName?: string;
  userEmail?: string;
  syncStatus: 'synced' | 'syncing' | 'error';
}

export function Sidebar({ selectedNav, onSelectNav, onLock, onSettings, userName, userEmail, syncStatus }: SidebarProps) {
  const [foldersOpen, setFoldersOpen] = useState(true);

  return (
    <div className="w-60 bg-app border-r border-border flex flex-col h-full select-none">
      <div className="h-12 flex items-center gap-2.5 px-4 border-b border-border">
        <Shield className="w-5 h-5 text-accent" />
        <span className="text-ui font-semibold text-text-primary">VaultLock</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectNav(item.id)}
            className={`
              w-full flex items-center gap-3 h-9 px-4 text-body transition-all duration-150
              ${selectedNav === item.id
                ? 'bg-surface text-text-primary border-l-[3px] border-accent'
                : 'text-text-muted hover:text-text-primary hover:bg-hover border-l-[3px] border-transparent'
              }
            `}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        ))}

        <div className="mt-4 mb-1 px-4">
          <button
            onClick={() => setFoldersOpen(!foldersOpen)}
            className="flex items-center gap-1.5 text-caption text-text-muted uppercase tracking-wide font-medium hover:text-text-primary transition-colors duration-150"
          >
            {foldersOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            Folders
          </button>
        </div>

        {foldersOpen && <FolderTree />}
      </nav>

      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center gap-2 px-2">
          <Circle
            className={`w-2 h-2 ${
              syncStatus === 'synced' ? 'text-accent-green' :
              syncStatus === 'syncing' ? 'text-accent-amber' : 'text-accent-red'
            }`}
            fill="currentColor"
          />
          <span className="text-caption text-text-muted">
            {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Error'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onSettings}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-body text-text-muted hover:text-text-primary hover:bg-hover transition-colors duration-150"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={onLock}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-body text-text-muted hover:text-text-primary hover:bg-hover transition-colors duration-150"
          >
            <LogOut className="w-4 h-4" />
            Lock
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-2">
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-caption font-medium text-accent">
              {(userName || userEmail || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-caption text-text-primary truncate">{userName || 'User'}</p>
            {userEmail && <p className="text-caption text-text-muted truncate">{userEmail}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
