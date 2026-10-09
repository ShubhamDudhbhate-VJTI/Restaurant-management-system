import { useState } from 'react';
import { useTables } from '../hooks/useTables';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../hooks/useSession';
import { useNavigate } from 'react-router-dom';
import { TableStatus, Role } from '@/contracts';
import { Camera } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../api/sessions';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Skeleton } from '../components/ui/skeleton';
import QrScanner from '../components/QrScanner';

gsap.registerPlugin(useGSAP);

export default function TablesPage() {
  const { data, isLoading, error } = useTables();
  const { user } = useAuth();
  const { session } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cancellationError, setCancellationError] = useState<string | null>(null);
  const cancelSession = useMutation({
    mutationFn: sessionsApi.cancel,
    onSuccess: async () => {
      setCancellationError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['session', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['tables'] }),
      ]);
    },
    onError: (error) => {
      setCancellationError(error instanceof Error ? error.message : 'Unable to cancel this table.');
    }
  });

  const tables = data?.tables || [];

  useGSAP(() => {
    let mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const items = gsap.utils.toArray<HTMLElement>('.stagger-item');
      if (items.length === 0) return;
      gsap.fromTo(items, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
      );
    });
  }, [tables.length]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="p-1.5 rounded-[1.5rem] ring-1 ring-white/5 bg-white/5">
              <Skeleton className="h-[180px] w-full rounded-[calc(1.5rem-0.375rem)]" />
            </div>
          ))}
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-12 text-center font-light text-red-700">
          Failed to load tables. Please try again.
        </div>
      );
    }

    if (tables.length === 0) {
      return (
        <div className="rounded-3xl border border-[#d9cbbd] p-12 text-center font-light text-[#756b63]">
          No tables found. Admin needs to create some!
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map(table => {
          let statusColorOuter = "bg-[#e1eee2] ring-[#a9c9ad]";
          let statusColorInner = "text-[#356b4f]";
          
          if (table.status === TableStatus.OCCUPIED) {
            statusColorOuter = "bg-[#ece8e3] ring-[#c9c0b8]";
            statusColorInner = "text-[#756b63]";
          }
          const occupiedByMe = table.status === TableStatus.OCCUPIED && session?.tableId === table.id;

          return (
            <div key={table.id} className="stagger-item group">
              <div className={`p-1.5 rounded-[1.5rem] ring-1 transition-transform duration-300 hover:scale-[1.03] ${statusColorOuter}`}>
                <div className={`relative flex min-h-[230px] flex-col items-center justify-center overflow-hidden rounded-[calc(1.5rem-0.375rem)] bg-[#fffaf3] p-7 text-center shadow-[0_12px_30px_rgba(88,62,42,0.06)] ${occupiedByMe ? 'md:min-h-[270px]' : ''}`}>
                  <h3 className="text-2xl font-normal text-[#28231f]">{table.name}</h3>
                  <p className={`text-xs font-bold uppercase tracking-[0.2em] mt-2 ${statusColorInner}`}>{table.status}</p>
                  <p className="mt-3 font-mono text-xs text-[#9b8e83]">{table.seats} Seats</p>
                  
                  {user?.role === Role.CUSTOMER && table.status === TableStatus.AVAILABLE && !session && (
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-widest text-emerald-400 hover:text-emerald-300"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Scan QR to sit
                    </button>
                  )}
                  {occupiedByMe && (
                    <div className="mt-5 w-full border-t border-[#a9c9ad] pt-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#356b4f]">Occupied by me</p>
                      <button
                        type="button"
                        onClick={() => navigate('/menu')}
                        className="mt-4 rounded-full bg-[#356b4f] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#28573f]"
                      >
                        View menu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCancellationError(null);
                          if (session) cancelSession.mutate(session.id);
                        }}
                        disabled={cancelSession.isPending}
                        className="mt-4 block w-full text-xs font-semibold uppercase tracking-widest text-[#a3543e] transition-colors hover:text-[#7e3e2f] disabled:opacity-50"
                      >
                        {cancelSession.isPending ? 'Cancelling...' : 'Cancel table'}
                      </button>
                    </div>
                  )}
                  {table.status === TableStatus.OCCUPIED && !occupiedByMe && (
                    <p className="mt-4 border-t border-[#d9cbbd] pt-4 text-xs font-semibold uppercase tracking-widest text-[#9b8e83]">Currently occupied</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f3eadf] p-4 font-sans text-[#28231f] pb-32 md:p-12">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute left-[-10%] top-[10%] h-[50%] w-[50%] rounded-full bg-[#ead7c8]/40 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] h-[50%] w-[50%] rounded-full bg-[#dce5d7]/60 blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col gap-5 border-b border-white/10 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-4 inline-block rounded-full border border-[#cbbbaa] bg-[#eadfd2] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#a3543e]">
              Overview
            </div>
            <h1 className="text-4xl font-normal tracking-tight text-[#28231f] md:text-5xl">
              Restaurant Tables
            </h1>
          </div>
          {user?.role === Role.CUSTOMER && !session && (
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-300 px-5 text-sm font-semibold text-[#07130c] transition-colors hover:bg-emerald-200"
            >
              <Camera className="h-4 w-4" />
              Scan QR to sit
            </button>
          )}
          {user?.role === Role.CUSTOMER && session && (
            <div className="rounded-2xl border border-[#a9c9ad] bg-[#e1eee2] px-4 py-3 text-sm text-[#356b4f]">
              You are currently seated at table <strong>{session.tableId.slice(0, 8)}</strong>. You can cancel it before placing an order.
            </div>
          )}
        </header>

        {cancellationError && (
          <div role="alert" className="rounded-2xl border border-[#d9a79b] bg-[#f8e7e2] px-4 py-3 text-sm text-[#7e3e2f]">
            {cancellationError}
          </div>
        )}

        {renderContent()}
      </div>
      {scannerOpen && (
        <QrScanner
          onClose={() => setScannerOpen(false)}
          onResult={(token) => {
            setScannerOpen(false);
            navigate(`/t/${encodeURIComponent(token)}`);
          }}
        />
      )}
    </div>
  );
}
