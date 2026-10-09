import { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scanApi } from '../api/sessions';
import { socket } from '../lib/socket';
import { SocketEvents } from '@/contracts';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function ScanResultPage() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['scan', qrToken],
    queryFn: () => scanApi.getScanResult(qrToken!),
    enabled: !!qrToken
  });

  const seatMutation = useMutation({
    mutationFn: () => scanApi.takeTable(qrToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['scan', qrToken] });
      // GSAP success animation
      const statusCard = containerRef.current?.querySelector<HTMLElement>('.status-card');
      if (statusCard) {
        gsap.to(statusCard, { scale: 1.02, duration: 0.2, yoyo: true, repeat: 1 });
      }
    }
  });

  useEffect(() => {
    socket.connect();
    
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['scan', qrToken] });
    };

    socket.on(SocketEvents.TABLE_UPDATED, handleUpdate);

    return () => {
      socket.off(SocketEvents.TABLE_UPDATED, handleUpdate);
    };
  }, [queryClient, qrToken]);

  useGSAP(() => {
    if (!isLoading && data) {
      let mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const elements = gsap.utils.toArray<HTMLElement>('.anim-fade-up');
        if (elements.length === 0) return;
        gsap.from(elements, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out'
        });
      });
    }
  }, [isLoading, data]);

  if (isLoading) return <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center text-white/50">Connecting to table...</div>;
  if (error) return <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center text-red-500/80">Invalid or expired QR code.</div>;
  
  if (!data) return null;

  const { table, relation } = data;

  const renderContent = () => {
    switch (relation) {
      case 'can_seat':
        return (
          <>
            <p className="text-white/60 mt-6 text-lg font-light anim-fade-up">
              This table is free and ready for you.
            </p>
            <div className="mt-10 space-y-4 anim-fade-up w-full max-w-[280px] mx-auto">
              <button 
                className="w-full h-14 bg-emerald-500 text-black rounded-full font-bold uppercase tracking-wider transition-transform active:scale-95 disabled:opacity-50" 
                onClick={() => seatMutation.mutate()}
                disabled={seatMutation.isPending}
              >
                {seatMutation.isPending ? 'Securing...' : 'Take this table'}
              </button>
            </div>
          </>
        );
      case 'seated_here':
        return (
          <>
            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase mt-6 anim-fade-up">
              Active Session
            </div>
            <p className="text-white/60 mt-4 text-lg font-light anim-fade-up">You are seated here.</p>
            <div className="mt-10 anim-fade-up w-full max-w-[280px] mx-auto">
              <button className="w-full h-14 bg-white/10 text-white border border-white/20 rounded-full font-bold uppercase tracking-wider hover:bg-white/20 transition-colors" onClick={() => navigate('/menu')}>
                View Menu
              </button>
            </div>
          </>
        );
      case 'occupied':
        return (
          <>
            <p className="text-white/60 mt-6 text-lg font-light anim-fade-up">This table is currently unavailable.</p>
            <div className="mt-10 anim-fade-up w-full max-w-[280px] mx-auto">
              <button
                className="w-full h-14 bg-white/10 text-white border border-white/20 rounded-full font-bold uppercase tracking-wider hover:bg-white/20 transition-colors"
                onClick={() => navigate('/customer/reservations')}
              >
                Make a reservation
              </button>
            </div>
          </>
        );
      case 'blocked':
        return (
          <>
            <p className="text-red-400/80 mt-6 text-lg font-light anim-fade-up">You already have an active session elsewhere.</p>
            <div className="mt-10 anim-fade-up w-full max-w-[280px] mx-auto">
              <button className="w-full h-14 bg-white/10 text-white border border-white/20 rounded-full font-bold uppercase tracking-wider hover:bg-white/20 transition-colors" onClick={() => navigate('/')}>
                Return to Dashboard
              </button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="light-app-page min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px]"></div>
      </div>

      <div className="status-card w-full max-w-md p-1.5 rounded-[2.5rem] bg-white/5 ring-1 ring-white/10 relative z-10">
        <div className="rounded-[calc(2.5rem-0.375rem)] bg-[#0A0A0A] p-10 md:p-14 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] text-center flex flex-col items-center justify-center min-h-[400px]">
          
          <div className="w-20 h-20 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center mb-8 anim-fade-up">
            <span className="text-2xl font-light text-white/80">{table.seats}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white/90 anim-fade-up">
            {table.name}
          </h1>
          
          {renderContent()}

        </div>
      </div>
    </div>
  );
}
