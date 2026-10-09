import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, Keyboard, X } from 'lucide-react';

type QrScannerProps = {
  onResult: (value: string) => void;
  onClose: () => void;
};

function extractToken(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/t\/([^/]+)/);
    return match?.[1] ?? '';
  } catch {
    const match = trimmed.match(/(?:^|\/)t\/([^/?#]+)/);
    return match?.[1] ?? trimmed.replace(/^\/+|\/+$/g, '');
  }
}

export default function QrScanner({ onResult, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const reader = new BrowserQRCodeReader();
    let mounted = true;

    reader.decodeFromConstraints(
      { video: { facingMode: { ideal: 'environment' } } },
      videoRef.current!,
      (result, errorValue) => {
        if (!mounted) return;
        if (result) {
          const token = extractToken(result.getText());
          if (token) onResult(token);
        } else if (errorValue && errorValue.name !== 'NotFoundException') {
          setError('The camera could not read this code. Try better lighting or enter the token below.');
        }
      },
    ).then((controls) => {
      controlsRef.current = controls;
    }).catch(() => {
      if (mounted) setError('Camera access was blocked. Allow camera permission or enter the token below.');
    });

    return () => {
      mounted = false;
      controlsRef.current?.stop();
    };
  }, [onResult]);

  const submitManual = (event: React.FormEvent) => {
    event.preventDefault();
    const token = extractToken(manualValue);
    if (!token) {
      setError('Enter a QR token or a full table URL.');
      return;
    }
    onResult(token);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="qr-scanner-title">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#111513] p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Table access</p>
            <h2 id="qr-scanner-title" className="mt-1 text-2xl font-semibold">Scan table QR</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close QR scanner">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mt-5 aspect-square overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline aria-label="Camera preview for scanning a table QR code" />
          <div className="pointer-events-none absolute inset-[16%] rounded-2xl border-2 border-emerald-300/80 shadow-[0_0_0_999px_rgba(0,0,0,0.32)]" />
          <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/70">Point the camera at the table QR code</div>
        </div>

        {error && <p className="mt-3 rounded-xl bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-white/35">
          <span className="h-px flex-1 bg-white/10" />
          or enter manually
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={submitManual} className="flex gap-2">
          <label htmlFor="manual-qr-token" className="sr-only">QR token or table URL</label>
          <input
            id="manual-qr-token"
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            placeholder="Token or /t/token"
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-emerald-300"
          />
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-[#07130c] hover:bg-emerald-200">
            <Keyboard className="h-4 w-4" />
            Open
          </button>
        </form>
        <p className="mt-3 flex items-center gap-2 text-xs text-white/40"><Camera className="h-3.5 w-3.5" /> Camera access requires HTTPS or localhost.</p>
      </div>
    </div>
  );
}
