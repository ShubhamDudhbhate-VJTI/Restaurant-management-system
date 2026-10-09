import { useEffect, useRef, useState } from 'react';
import { useKitchenOrders } from '../hooks/useKitchenOrders';
import { OrderStatus, type OrderWithItems } from '@/contracts';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Clock, CheckCircle } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

gsap.registerPlugin(useGSAP);

function OrderCard({ order, updateStatus, actionLabel, nextStatus, tintColor }: { order: OrderWithItems, updateStatus: any, actionLabel: string, nextStatus: OrderStatus, tintColor: 'white' | 'blue' | 'amber' }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);
  
  useGSAP(() => {
    let mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(cardRef.current, { y: 20, opacity: 0, duration: 0.4, ease: 'power2.out' });
    });
  }, { scope: cardRef });

  const timeSince = Math.max(0, Math.floor((now - order.createdAt) / 60000));

  const getTintClasses = () => {
    if (tintColor === 'blue') return 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20';
    if (tintColor === 'amber') return 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20';
    return 'text-white bg-white/10 border-white/20 hover:bg-white/20';
  };

  return (
    <div ref={cardRef} className="group">
      <div className="p-1 rounded-[1.5rem] bg-white/5 ring-1 ring-white/10 transition-transform duration-300 hover:scale-[1.01]">
        <div className="rounded-[calc(1.5rem-0.25rem)] bg-[#0A0A0A] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-light text-xl text-white">{order.tableName || 'Unknown Table'}</h3>
            <span className="text-xs font-mono text-white/40 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeSince}m ago
            </span>
          </div>
          <ul className="space-y-2 text-sm flex-1">
            {order.items.map(item => (
              <li key={item.id} className="flex justify-between items-start">
                <span className="font-mono text-white/40 mt-0.5">{item.quantity}x</span>
                <span className="text-white/80 flex-1 ml-3 leading-tight">{item.name}</span>
              </li>
            ))}
          </ul>
          <div className="pt-4 border-t border-white/5 mt-auto">
            <button 
              className={`w-full py-2.5 rounded-xl text-sm font-semibold uppercase tracking-widest transition-colors border ${getTintClasses()}`}
              onClick={() => updateStatus.mutate({ orderId: order.id, status: nextStatus })}
              disabled={updateStatus.isPending}
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const { orders, isLoading, error, updateStatus } = useKitchenOrders();

  const placed = orders?.filter(o => o.status === OrderStatus.PLACED).sort((a, b) => a.createdAt - b.createdAt) || [];
  const preparing = orders?.filter(o => o.status === OrderStatus.PREPARING).sort((a, b) => a.createdAt - b.createdAt) || [];
  const ready = orders?.filter(o => o.status === OrderStatus.READY).sort((a, b) => a.createdAt - b.createdAt) || [];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden pb-4">
          {[1, 2, 3].map(col => (
            <div key={col} className="flex flex-col bg-white/5 border border-white/10 rounded-3xl p-5 overflow-hidden backdrop-blur-sm">
              <h2 className="font-light text-white/80 mb-6 flex items-center gap-2 text-xl">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-8 rounded-full" />
              </h2>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {[1, 2, 3].map(card => (
                  <Skeleton key={card} className="h-[200px] w-full rounded-[1.5rem]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="text-center p-12 border border-red-500/20 bg-red-500/5 rounded-3xl text-red-400 font-light border-dashed">
            {(error as Error).message || "Failed to load kitchen board."}
          </div>
        </div>
      );
    }

    return (
      <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden pb-4">
        {/* Column 1: Placed */}
        <div className="flex flex-col bg-white/5 border border-white/10 rounded-3xl p-5 overflow-hidden backdrop-blur-sm">
          <h2 className="font-light text-white/80 mb-6 flex justify-between items-center text-xl">
            Placed 
            <span className="bg-white/10 text-white border border-white/10 px-3 py-1 rounded-full text-xs font-medium">{placed.length}</span>
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {placed.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                updateStatus={updateStatus} 
                actionLabel="Start Prep" 
                nextStatus={OrderStatus.PREPARING} 
                tintColor="white"
              />
            ))}
            {placed.length === 0 && <div className="text-center text-sm text-white/30 mt-12 font-light">No new orders</div>}
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div className="flex flex-col bg-blue-950/20 border border-blue-500/20 rounded-3xl p-5 overflow-hidden backdrop-blur-sm">
          <h2 className="font-light text-blue-400/90 mb-6 flex justify-between items-center text-xl">
            Preparing 
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-medium">{preparing.length}</span>
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {preparing.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                updateStatus={updateStatus} 
                actionLabel="Mark Ready" 
                nextStatus={OrderStatus.READY} 
                tintColor="blue"
              />
            ))}
            {preparing.length === 0 && <div className="text-center text-sm text-blue-400/30 mt-12 font-light">Nothing in prep</div>}
          </div>
        </div>

        {/* Column 3: Ready */}
        <div className="flex flex-col bg-amber-950/20 border border-amber-500/20 rounded-3xl p-5 overflow-hidden backdrop-blur-sm">
          <h2 className="font-light text-amber-400/90 mb-6 flex justify-between items-center text-xl">
            Ready for Pickup 
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-medium">{ready.length}</span>
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {ready.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                updateStatus={updateStatus} 
                actionLabel="Served" 
                nextStatus={OrderStatus.SERVED}
                tintColor="amber" 
              />
            ))}
            {ready.length === 0 && <div className="text-center text-sm text-amber-400/30 mt-12 font-light flex flex-col items-center gap-3">
              <CheckCircle className="w-8 h-8 stroke-1" />
              All orders served
            </div>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="light-app-page min-h-[100dvh] bg-[#050505] text-white p-4 md:p-8 font-sans relative overflow-hidden flex flex-col h-screen">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]"></div>
      </div>

      <header className="relative z-10 mb-8 flex justify-between items-center pb-6 border-b border-white/10">
        <div>
          <div className="inline-block rounded-full px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.2em] font-medium text-emerald-400 mb-2">
            Back of House
          </div>
          <h1 className="text-3xl font-light tracking-tight text-white/90">Kitchen Display</h1>
        </div>
      </header>
      
      {renderContent()}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
