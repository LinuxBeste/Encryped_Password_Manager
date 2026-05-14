import { Shield, Lock } from 'lucide-react';

interface LockOverlayProps {
  onUnlock: () => void;
}

// Blurred overlay shown when the vault is locked, with an unlock button
export function LockOverlay({ onUnlock }: LockOverlayProps) {
  return (
    <div className="absolute inset-0 z-40 backdrop-blur-xl bg-app/80 flex items-center justify-center animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-accent" />
        </div>
        <p className="text-body text-text-muted">Vault is locked</p>
        <button
          onClick={onUnlock}
          className="flex items-center gap-2 px-4 h-9 rounded-md bg-accent text-white text-ui font-medium hover:brightness-110 transition-all duration-150"
        >
          <Shield className="w-4 h-4" />
          Unlock
        </button>
      </div>
    </div>
  );
}
