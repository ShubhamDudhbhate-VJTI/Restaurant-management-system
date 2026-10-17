import { useOrders } from '../hooks/useOrders';
import { OrderStatus } from '@/contracts';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { History as HistoryIcon, Clock } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { format } from 'date-fns';

gsap.registerPlugin(useGSAP);

export default function HistoryPage() {
  const { history, isLoadingHistory } = useOrders();

  useGSAP(() => {
    if (history && history.length > 0) {
      gsap.fromTo(
        '.history-card',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [history?.length]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.SERVED: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case OrderStatus.CANCELLED: return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-[#756b63] bg-[#f3eadf] border-[#d9cbbd]';
    }
  };

  const servedOrCancelled = history?.filter(o => o.status === OrderStatus.SERVED || o.status === OrderStatus.CANCELLED) || [];

  return (
    <div className="min-h-[100dvh] bg-[#f3eadf] text-[#28231f] p-4 md:p-12 font-sans relative overflow-hidden pb-32">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-purple-100/40 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/40 blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-12">
        <header className="flex flex-col py-6 border-b border-[#d9cbbd]">
          <div className="inline-block w-fit rounded-full px-3 py-1 bg-[#eadfd2] border border-[#cbbbaa] text-[10px] uppercase tracking-[0.2em] font-medium text-[#a3543e] mb-4">
            Dining History
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#28231f]">
            Past Orders
          </h1>
        </header>

        {isLoadingHistory ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl bg-[#fffaf3] border border-[#d9cbbd]" />
            ))}
          </div>
        ) : servedOrCancelled.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <HistoryIcon className="w-16 h-16 text-[#d9cbbd] mb-6 stroke-1" />
            <p className="text-[#756b63] text-xl font-light">No past orders found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {servedOrCancelled.map(order => (
              <div key={order.id} className="history-card group p-6 rounded-2xl bg-[#fffaf3] border border-[#d9cbbd] hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#756b63] tracking-widest uppercase">#{order.id.slice(0, 8)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#756b63] text-sm">
                      <Clock className="w-4 h-4" />
                      {format(new Date(order.createdAt), 'MMM dd, yyyy • hh:mm a')}
                    </div>
                    {order.tableName && (
                      <div className="text-[10px] text-[#756b63] uppercase tracking-widest">
                        Table {order.tableName}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 md:px-12">
                     <div className="text-sm text-[#28231f] line-clamp-2 md:line-clamp-1">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                     </div>
                  </div>

                  <div className="text-2xl font-bold text-[#356b4f]">
                    ₹{(order.items.reduce((acc, item) => acc + (item.priceCents * item.quantity), 0) / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
