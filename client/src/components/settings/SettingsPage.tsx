import { useState } from 'react';
import {
  Settings, Shield, Palette, Key, Server, HardDrive,
  ShieldCheck, Keyboard, AlertTriangle, X
} from 'lucide-react';
import { GeneralTab } from './tabs/GeneralTab';
import { SecurityTab } from './tabs/SecurityTab';
import { AppearanceTab } from './tabs/AppearanceTab';
import { GeneratorTab } from './tabs/GeneratorTab';
import { SyncTab } from './tabs/SyncTab';
import { BackupTab } from './tabs/BackupTab';
import { TOTPTab } from './tabs/TOTPTab';
import { ShortcutsTab } from './tabs/ShortcutsTab';
import { DangerZoneTab } from './tabs/DangerZoneTab';

interface Tab {
  id: string;
  label: string;
  icon: typeof Settings;
}

const tabs: Tab[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'generator', label: 'Generator', icon: Key },
  { id: 'sync', label: 'Sync', icon: Server },
  { id: 'backup', label: 'Backup', icon: HardDrive },
  { id: 'totp', label: 'TOTP / 2FA', icon: ShieldCheck },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

interface SettingsPageProps {
  onClose: () => void;
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState('general');

  const renderTab = () => {
    switch (activeTab) {
      case 'general': return <GeneralTab />;
      case 'security': return <SecurityTab />;
      case 'appearance': return <AppearanceTab />;
      case 'generator': return <GeneratorTab />;
      case 'sync': return <SyncTab />;
      case 'backup': return <BackupTab />;
      case 'totp': return <TOTPTab />;
      case 'shortcuts': return <ShortcutsTab />;
      case 'danger': return <DangerZoneTab />;
      default: return <GeneralTab />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-heading font-semibold text-text-primary">Settings</h1>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-hover transition-colors duration-150"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-48 border-r border-border py-2 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center gap-2.5 h-9 px-4 text-body transition-all duration-150
                ${activeTab === tab.id
                  ? 'bg-surface text-text-primary border-l-[3px] border-accent'
                  : 'text-text-muted hover:text-text-primary hover:bg-hover border-l-[3px] border-transparent'
                }
              `}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
