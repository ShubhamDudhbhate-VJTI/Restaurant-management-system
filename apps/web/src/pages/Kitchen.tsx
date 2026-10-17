import { useEffect, useRef, useState } from 'react';
import { useKitchenOrders } from '../hooks/useKitchenOrders';
import { OrderStatus, type OrderWithItems } from '@/contracts';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Clock, CheckCircle2, AlertCircle, Utensils, ChefHat, X, Timer, Flame, BellRing } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';
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
import { ScrollArea } from '../components/ui/scroll-area';

gsap.registerPlugin(useGSAP);

function OrderCard({
  order,
  updateStatus,
  actionLabel,
  nextStatus,
  statusType,
  onCancelReq
}: {
  order: OrderWithItems,
  updateStatus: any,
  actionLabel: string,
  nextStatus: OrderStatus,
  statusType: 'placed' | 'preparing' | 'ready',
  onCancelReq?: (order: OrderWithItems) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(interval);
  }, []);
  
  useGSAP(() => {
    let mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(cardRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(1.2)'
      });
    });
  }, { scope: cardRef });

  const timeSince = Math.max(0, Math.floor((now - order.createdAt) / 60000));
  const isUrgent = timeSince > 15 && statusType !== 'ready';

  return (
    <div ref={cardRef} className="group relative">
      {/* Paper Stack Effect */}
      <div className="absolute inset-0 translate-x-1 translate-y-1 bg-[#d9cbbd]/30 rounded-2xl -z-10 group-hover:translate-x-1.5 group-hover:translate-y-1.5 transition-transform" />

      <div className={cn(
        "relative rounded-2xl border-2 bg-[#fffaf3] transition-all duration-300",
        isUrgent ? "border-[#a3543e] ring-4 ring-[#a3543e]/10" : "border-[#d9cbbd] group-hover:border-[#756b63]"
      )}>
        {/* Urgent Indicator */}
        {isUrgent && (
          <div className="absolute -top-3 -right-3 bg-[#a3543e] text-white p-1.5 rounded-full shadow-lg animate-bounce z-20">
            <Timer className="w-4 h-4" />
          </div>
        )}

        {/* Card Header: Table Info */}
        <div className={cn(
          "px-5 py-4 border-b-2 flex justify-between items-center",
          statusType === 'placed' ? "border-[#d9cbbd] bg-[#f3eadf]/30" :
          statusType === 'preparing' ? "border-[#a9c0d9]/50 bg-[#e7eff8]/30" :
          "border-[#d9c0a9]/50 bg-[#f8f0e7]/30"
        )}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63]">Table Node</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="font-normal text-2xl text-[#28231f] leading-none">{order.tableName || '??'}</h3>
              <span className="text-[9px] font-mono text-[#a3543e] opacity-60">({order.id.slice(0, 4).toUpperCase()})</span>
            </div>
          </div>
          <div className="text-right">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
              isUrgent ? "bg-[#a3543e] text-white border-[#a3543e]" : "bg-[#f3eadf] text-[#756b63] border-[#d9cbbd]"
            )}>
              <Clock className="w-3 h-3" /> {timeSince} min
            </div>
            <p className="text-[9px] font-mono text-[#756b63] mt-2 uppercase">#{order.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Order Items: Thermal Print Style */}
        <div className="p-5 space-y-4">
          <ul className="space-y-3">
            {order.items.map(item => (
              <li key={item.id} className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#28231f] text-white text-xs font-black shadow-sm shrink-0">
                    {item.quantity}
                  </span>
                  <span className="text-[#28231f] text-lg leading-tight font-medium">
                    {item.name}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {order.notes && (
            <div className="bg-[#fcf3d7] p-3 rounded-xl border border-[#d9c0a9] text-xs text-[#8c6d1f] flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="italic font-medium">"{order.notes}"</span>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="px-5 pb-5 pt-2 flex gap-3">
          {onCancelReq && (
            <button
              onClick={() => onCancelReq(order)}
              className="flex-1 h-12 rounded-xl border-2 border-[#d9a79b] text-[10px] font-black uppercase tracking-widest text-[#a3543e] hover:bg-[#f8e7e2] transition-colors active:scale-95 disabled:opacity-50"
              disabled={updateStatus.isPending}
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => updateStatus.mutate({ orderId: order.id, status: nextStatus })}
            disabled={updateStatus.isPending}
            className={cn(
              "h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 text-white flex-grow flex items-center justify-center gap-2",
              statusType === 'placed' ? "bg-[#28231f] hover:bg-[#356b4f]" :
              statusType === 'preparing' ? "bg-[#2b4a7d] hover:bg-[#1e3a63]" :
              "bg-[#356b4f] hover:bg-[#28573f]"
            )}
          >
            {updateStatus.isPending ? 'Processing...' : (
              <>
                {actionLabel}
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Decorative Perforation Line */}
        <div className="absolute -bottom-1 left-4 right-4 h-px border-b border-dashed border-[#d9cbbd] opacity-50" />
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const { orders, isLoading, error, updateStatus } = useKitchenOrders();
  const [cancelOrder, setCancelOrder] = useState<OrderWithItems | null>(null);

  const placed = orders?.filter(o => o.status === OrderStatus.PLACED).sort((a, b) => a.createdAt - b.createdAt) || [];
  const preparing = orders?.filter(o => o.status === OrderStatus.PREPARING).sort((a, b) => a.createdAt - b.createdAt) || [];
  const ready = orders?.filter(o => o.status === OrderStatus.READY).sort((a, b) => a.createdAt - b.createdAt) || [];

  return (
    <div className="min-h-screen bg-[#f3eadf] text-[#28231f] font-sans relative flex flex-col h-screen overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute left-[-10%] top-[10%] h-[50%] w-[50%] rounded-full bg-[#ead7c8]/40 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] h-[50%] w-[50%] rounded-full bg-[#dce5d7]/60 blur-[120px]"></div>
      </div>

      {/* Navigation / Header */}
      <nav className="relative z-20 w-full border-b border-[#d9cbbd] bg-[#f3eadf]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1800px] px-6">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-[#356b4f] p-2.5 text-white shadow-lg shadow-emerald-900/10">
                <ChefHat className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-normal tracking-tight text-[#28231f]">Kitchen Terminal</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#356b4f]">Station Live</span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#756b63]">Current Load</span>
                <span className="text-xl font-black text-[#28231f]">{placed.length + preparing.length} Active Rounds</span>
              </div>
              <div className="h-10 w-px bg-[#d9cbbd]" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#756b63]">System Status</span>
                <span className="text-sm font-bold text-[#356b4f]">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1 overflow-hidden p-6">
        {isLoading ? (
          <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#fffaf3] border border-[#d9cbbd] rounded-3xl p-6 space-y-6">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-12 border-2 border-dashed border-[#a3543e] bg-[#f8e7e2] rounded-[2.5rem] max-w-lg">
              <AlertCircle className="w-12 h-12 text-[#a3543e] mx-auto mb-4" />
              <h2 className="text-xl font-black uppercase tracking-widest text-[#a3543e] mb-2">Sync Error</h2>
              <p className="text-[#a3543e]/80 font-medium italic">{(error as Error).message || "Failed to load kitchen board. Reconnecting..."}</p>
            </div>
          </div>
        ) : (
          <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Column 1: NEW ORDERS */}
            <div className="flex flex-col bg-[#fffaf3] border border-[#d9cbbd] rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-[#d9cbbd]/50 bg-[#f3eadf]/20 flex justify-between items-center">
                <h2 className="font-normal text-2xl text-[#28231f] flex items-center gap-3">
                  <Flame className="w-6 h-6 text-[#756b63]" />
                  New Orders
                </h2>
                <div className="bg-[#28231f] text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest shadow-lg">
                  {placed.length}
                </div>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8 pr-4">
                  {placed.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      updateStatus={updateStatus}
                      actionLabel="Accept Round"
                      nextStatus={OrderStatus.PREPARING}
                      statusType="placed"
                      onCancelReq={setCancelOrder}
                    />
                  ))}
                  {placed.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                      <Timer className="w-12 h-12 text-[#d9cbbd] mx-auto opacity-30" />
                      <p className="text-[#756b63] font-bold uppercase tracking-widest text-xs italic">Awaiting new tickets...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Column 2: PREPARING */}
            <div className="flex flex-col bg-[#f8fbff] border border-[#a9c0d9] rounded-[2.5rem] overflow-hidden shadow-sm shadow-blue-900/5">
              <div className="p-6 border-b border-[#a9c0d9]/50 bg-[#e7eff8]/20 flex justify-between items-center">
                <h2 className="font-normal text-2xl text-[#2b4a7d] flex items-center gap-3">
                  <Utensils className="w-6 h-6 text-[#2b4a7d]" />
                  In Prep
                </h2>
                <div className="bg-[#2b4a7d] text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest shadow-lg shadow-blue-900/10">
                  {preparing.length}
                </div>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8 pr-4">
                  {preparing.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      updateStatus={updateStatus}
                      actionLabel="Pass to Ready"
                      nextStatus={OrderStatus.READY}
                      statusType="preparing"
                      onCancelReq={setCancelOrder}
                    />
                  ))}
                  {preparing.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                      <Flame className="w-12 h-12 text-[#a9c0d9] mx-auto opacity-30" />
                      <p className="text-[#7d9bba] font-bold uppercase tracking-widest text-xs italic">Stations idle</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Column 3: READY */}
            <div className="flex flex-col bg-[#fffaf3] border border-[#d9c0a9] rounded-[2.5rem] overflow-hidden shadow-sm shadow-amber-900/5">
              <div className="p-6 border-b border-[#d9c0a9]/50 bg-[#f8f0e7]/20 flex justify-between items-center">
                <h2 className="font-normal text-2xl text-[#7d4a2b] flex items-center gap-3">
                  <BellRing className="w-6 h-6 text-[#7d4a2b]" />
                  Ready to Serve
                </h2>
                <div className="bg-[#356b4f] text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest shadow-lg shadow-emerald-900/10">
                  {ready.length}
                </div>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8 pr-4">
                  {ready.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      updateStatus={updateStatus}
                      actionLabel="Served"
                      nextStatus={OrderStatus.SERVED}
                      statusType="ready"
                    />
                  ))}
                  {ready.length === 0 && (
                    <div className="py-20 text-center space-y-4 flex flex-col items-center">
                      <CheckCircle2 className="w-12 h-12 text-[#d9c0a9] opacity-30" />
                      <p className="text-[#ba9b7d] font-bold uppercase tracking-widest text-xs italic">All items cleared</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

          </div>
        )}
      </main>

      {/* Cancellation Dialog */}
      <AlertDialog open={!!cancelOrder} onOpenChange={(open) => !open && setCancelOrder(null)}>
        <AlertDialogContent className="bg-[#fffaf3] border-[#d9cbbd] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-normal text-[#28231f]">Cancel Order Round?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#756b63] text-sm font-medium">
              You are about to cancel the ticket for <span className="font-black text-[#28231f]">{cancelOrder?.tableName}</span>. This will notify the waiter and remove it from the display.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl border-[#d9cbbd] text-[#756b63] font-black uppercase tracking-widest text-[10px] flex-1">Abort</AlertDialogCancel>
            <AlertDialogAction
              className="h-12 rounded-xl bg-[#a3543e] hover:bg-[#8e4936] text-white font-black uppercase tracking-widest text-[10px] flex-1 shadow-lg shadow-[#a3543e]/10"
              onClick={() => {
                if (cancelOrder) {
                  updateStatus.mutate({ orderId: cancelOrder.id, status: OrderStatus.CANCELLED });
                  setCancelOrder(null);
                }
              }}
            >
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(88, 62, 42, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
