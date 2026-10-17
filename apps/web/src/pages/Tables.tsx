import { useState } from 'react';
import { useTables } from '../hooks/useTables';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../hooks/useSession';
import { useOrders } from '../hooks/useOrders';
import { useNavigate } from 'react-router-dom';
import { TableStatus, Role, OrderStatus } from '@/contracts';
import { Camera } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../api/sessions';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import QrScanner from '../components/QrScanner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

gsap.registerPlugin(useGSAP);

export default function TablesPage() {
  const { data, isLoading, error } = useTables();
  const { user } = useAuth();
  const { session } = useSession();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cancellationError, setCancellationError] = useState<string | null>(null);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {tables.map(table => {
          let statusColorClasses = "bg-[#e1eee2] ring-[#a9c9ad] text-[#356b4f]";
          
          if (table.status === TableStatus.OCCUPIED) {
            statusColorClasses = "bg-[#f3eadf] ring-[#d9cbbd] text-[#756b63]";
          } else if (table.status === TableStatus.BILLING) {
             statusColorClasses = "bg-[#f8f0e7] ring-[#d9c0a9] text-[#a3543e]";
          }

          const occupiedByMe = table.status === TableStatus.OCCUPIED && session?.tableId === table.id;

          return (
            <div key={table.id} className="stagger-item group">
              <div className={`p-1.5 rounded-[2rem] ring-1 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl ${statusColorClasses.split(' ').slice(0, 2).join(' ')}`}>
                <div className="relative flex min-h-[260px] flex-col items-center justify-center overflow-hidden rounded-[calc(2rem-0.375rem)] bg-[#fffaf3] p-8 text-center shadow-[0_12px_30px_rgba(88,62,42,0.04)]">
                  <div className={`mb-6 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${statusColorClasses.split(' ').slice(2).join(' ')} ring-1 ring-current/20`}>
                    {table.status}
                  </div>
                  
                  <h3 className="text-4xl font-normal text-[#28231f] tracking-tight">{table.name}</h3>
                  <div className="mt-1 flex flex-col items-center gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9b8e83]">{table.seats} Seats Available</p>
                    <p className="text-[9px] font-mono text-[#a3543e] opacity-60 bg-[#f3eadf] px-2 py-0.5 rounded border border-[#d9cbbd]/30">Token: {table.qrToken}</p>
                  </div>

                  <div className="mt-8 w-full border-t border-[#f3eadf] pt-6">
                    {user?.role === Role.CUSTOMER && table.status === TableStatus.AVAILABLE && !session && (
                      <Button
                        onClick={() => setScannerOpen(true)}
                        variant="outline"
                        className="w-full rounded-xl border-[#d9cbbd] text-[#356b4f] hover:bg-[#e1eee2]"
                      >
                        <Camera className="h-4 w-4" />
                        Scan to sit
                      </Button>
                    )}

                    {occupiedByMe && (
                      <div className="space-y-3">
                        <Button
                          onClick={() => navigate('/menu')}
                          className="w-full rounded-xl bg-[#356b4f] hover:bg-[#2a553f] text-white"
                        >
                          View Menu
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setCancellationError(null);
                            const activeOrdersCount = orders?.filter(o => o.status !== OrderStatus.CANCELLED).length || 0;
                            if (activeOrdersCount > 0) {
                              navigate('/orders');
                            } else if (session) {
                              setShowReleaseConfirm(true);
                            }
                          }}
                          disabled={cancelSession.isPending}
                          className="w-full text-[10px] font-bold text-[#a3543e] hover:bg-[#f8e7e2]"
                        >
                          {cancelSession.isPending ? 'Releasing...' : 'Release Table'}
                        </Button>
                      </div>
                    )}

                    {table.status === TableStatus.OCCUPIED && !occupiedByMe && (
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9b8e83] py-2 italic">Currently in use</p>
                    )}
                  </div>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[#a9c9ad] bg-[#e1eee2] px-6 py-4 text-sm text-[#356b4f]">
              <span>
                You are currently seated at table <strong>{tables.find(t => t.id === session.tableId)?.name || session.tableId.slice(0, 8)}</strong>.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCancellationError(null);
                  const activeOrdersCount = orders?.filter(o => o.status !== OrderStatus.CANCELLED).length || 0;
                  if (activeOrdersCount > 0) {
                    navigate('/orders');
                  } else if (session) {
                    setShowReleaseConfirm(true);
                  }
                }}
                disabled={cancelSession.isPending}
                className="border-[#356b4f] text-[#356b4f] hover:bg-[#356b4f] hover:text-white rounded-xl px-6"
              >
                {cancelSession.isPending ? 'Releasing...' : 'Release Table'}
              </Button>
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

      <AlertDialog open={showReleaseConfirm} onOpenChange={setShowReleaseConfirm}>
        <AlertDialogContent className="bg-[#fffaf3] border-[#d9cbbd]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#28231f]">Release Table?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#756b63]">
              This will end your current session. You won't be able to add more items to your order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#d9cbbd] text-[#28231f] hover:bg-[#f3eadf]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => session && cancelSession.mutate(session.id)}
              className="bg-[#a3543e] hover:bg-[#8a4634] text-white"
            >
              Release Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
