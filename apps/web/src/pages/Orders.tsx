import { useOrders } from '../hooks/useOrders';
import { OrderStatus } from '@/contracts';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Clock } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';

gsap.registerPlugin(useGSAP);

export default function OrdersPage() {
  const { orders, isLoadingOrders, ordersError, bill, cancelOrder } = useOrders();

  useGSAP(() => {
    let mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (orders && orders.length > 0) {
        const cards = gsap.utils.toArray<HTMLElement>('.order-card');
        if (cards.length === 0) return;
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out", stagger: 0.1, clearProps: "all" }
        );
      }
    });
  }, [orders?.length]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PLACED: return 'text-white/60 bg-white/5 border-white/10';
      case OrderStatus.PREPARING: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case OrderStatus.READY: return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case OrderStatus.SERVED: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-red-400 bg-red-500/10 border-red-500/20';
    }
  };
  const statusSteps = [OrderStatus.PLACED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED];

  const renderContent = () => {
    if (isLoadingOrders) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-1.5 rounded-[2rem] ring-1 ring-white/5 bg-white/5">
              <Skeleton className="h-[240px] w-full rounded-[calc(2rem-0.375rem)]" />
            </div>
          ))}
        </div>
      );
    }

    if (ordersError) {
      return (
        <div className="text-center p-12 border border-red-500/20 bg-red-500/5 rounded-3xl text-red-400 font-light border-dashed">
          {(ordersError as Error).message || "Failed to load orders."}
        </div>
      );
    }

    if (orders?.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Clock className="w-16 h-16 text-white/20 mb-6 stroke-1" />
          <p className="text-white/50 text-xl font-light">No orders placed yet.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orders?.map(order => (
          <div key={order.id} className="order-card group">
            <div className="p-1.5 rounded-[2rem] bg-white/5 ring-1 ring-white/10 transition-transform duration-500 hover:scale-[1.02]">
              <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#0A0A0A] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative flex flex-col justify-between min-h-[240px]">
                
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-mono text-white/40 uppercase tracking-widest">#{order.id.slice(0, 8)}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="mb-6 grid grid-cols-4 gap-1">
                    {statusSteps.map((step, index) => {
                      const currentIndex = statusSteps.indexOf(order.status);
                      const active = index <= currentIndex;
                      return <div key={step} className="space-y-1"><div className={`h-1 rounded-full ${active ? 'bg-emerald-400' : 'bg-white/10'}`} /><span className={`block text-[9px] ${active ? 'text-emerald-300' : 'text-white/35'}`}>{step}</span></div>;
                    })}
                  </div>
                  
                  <ul className="space-y-3">
                    {order.items.map(item => (
                      <li key={item.id} className="flex justify-between text-sm">
                        <span className="text-white/80"><span className="text-white/40 mr-2">{item.quantity}x</span> {item.name}</span>
                        <span className="text-emerald-400/80 font-medium">₹{((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {order.status === OrderStatus.PLACED && (
                  <div className="mt-8 pt-4 border-t border-white/5 flex justify-end">
                    <button 
                      onClick={() => cancelOrder.mutate(order.id)}
                      disabled={cancelOrder.isPending}
                      className="text-xs font-semibold text-red-500/80 uppercase tracking-widest hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="light-app-page min-h-[100dvh] bg-[#050505] text-white p-4 md:p-12 font-sans relative overflow-hidden pb-32">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 border-b border-white/10">
          <div>
            <div className="inline-block rounded-full px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.2em] font-medium text-emerald-400 mb-4">
              Order Status
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white/90">
              Your Orders
            </h1>
          </div>
        </header>

        <div className="space-y-6">
          {renderContent()}
        </div>

        {bill && orders && orders.length > 0 && (
          <div className="mt-16 pt-12 border-t border-white/10">
            <h2 className="text-3xl font-light text-white mb-8">Current Bill</h2>
            
            <div className="p-1.5 rounded-[2rem] bg-white/5 ring-1 ring-white/10">
              <div className="rounded-[calc(2rem-0.375rem)] bg-[#0A0A0A] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] space-y-4 text-sm font-light">
                <div className="flex justify-between">
                  <span className="text-white/60">Subtotal</span>
                  <span className="text-white">₹{(bill.subtotalCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">CGST (2.5%)</span>
                  <span className="text-white">₹{(bill.cgstCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">SGST (2.5%)</span>
                  <span className="text-white">₹{(bill.sgstCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-normal text-2xl pt-6 border-t border-white/10 mt-6 text-emerald-400">
                  <span>Total</span>
                  <span>₹{(bill.totalCents / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
