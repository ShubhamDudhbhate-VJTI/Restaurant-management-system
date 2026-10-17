import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import {
  Star,
  MessageSquare,
  TrendingUp,
  Users,
  ArrowLeft,
  Filter,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function FeedbackPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [sessionId, setSessionId] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');

  const query = useQuery({
    queryKey: ['feedback'],
    queryFn: async () => (await apiClient.get('/feedback')).data,
    enabled: user?.role === 'admin'
  });

  const submit = useMutation({
    mutationFn: () => apiClient.post('/feedback', { sessionId, rating: Number(rating), comment }),
    onSuccess: () => {
      setSessionId('');
      setComment('');
      client.invalidateQueries({ queryKey: ['feedback'] });
    }
  });

  if (user?.role === 'admin') {
    const feedbackList = query.data?.feedback || [];
    const stats = query.data?.stats || { averageRating: '0.0', totalFeedback: 0 };

    return (
      <div className="min-h-screen bg-[#f3eadf] text-[#28231f] font-sans">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 w-full border-b border-[#d9cbbd] bg-[#f3eadf]/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/admin">
                  <Button variant="ghost" size="icon" className="text-[#756b63] hover:text-[#28231f]">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#a3543e] p-2 text-white shadow-lg shadow-[#a3543e]/10">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h1 className="text-lg font-normal tracking-tight">Customer Voice</h1>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-10">
            <Card className="border-[#d9cbbd] bg-[#fffaf3] shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63]">Average Rating</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <p className="text-4xl font-normal text-[#28231f]">{stats.averageRating}</p>
                      <p className="text-sm font-bold text-[#356b4f]">/ 5.0</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#fcf3d7] p-4 text-[#8c6d1f]">
                    <Star className="h-8 w-8 fill-current" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#d9cbbd] bg-[#fffaf3] shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63]">Total Responses</p>
                    <p className="mt-2 text-4xl font-normal text-[#28231f]">{stats.totalFeedback}</p>
                  </div>
                  <div className="rounded-2xl bg-[#e7eff8] p-4 text-[#2b4a7d]">
                    <Users className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#d9cbbd] bg-[#fffaf3] shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#756b63]">Satisfaction Rate</p>
                    <p className="mt-2 text-4xl font-normal text-[#28231f]">
                      {Math.round((Number(stats.averageRating) / 5) * 100)}%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#dce5d7] p-4 text-[#356b4f]">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback List */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#d9cbbd] pb-4">
              <h2 className="text-2xl font-normal tracking-tight text-[#28231f]">Detailed Feedback</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-[#d9cbbd] text-[#756b63] font-bold uppercase tracking-widest text-[10px]">
                  <Filter className="mr-2 h-3.5 w-3.5" /> Filter
                </Button>
              </div>
            </div>

            {query.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32 w-full rounded-2xl bg-[#fffaf3] border border-[#d9cbbd]" />
                ))}
              </div>
            ) : feedbackList.length > 0 ? (
              <div className="grid gap-4">
                {feedbackList.map((item: any) => (
                  <Card key={item.id} className="border-[#d9cbbd] bg-[#fffaf3] hover:border-[#a3543e] transition-colors group">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-4 w-4",
                                    i < item.rating ? "fill-current" : "text-[#d9cbbd]"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#756b63]">
                              {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <p className="text-[#28231f] leading-relaxed italic">
                            "{item.comment || 'No comment provided.'}"
                          </p>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2">
                          <div className="text-right">
                            <p className="text-xs font-bold text-[#28231f]">{item.customerName || 'Anonymous Customer'}</p>
                            <p className="text-[9px] font-mono text-[#a3543e] uppercase">#{item.sessionId.slice(0, 8)}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#756b63] opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-[#d9cbbd] p-16 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-[#d9cbbd] mb-4" />
                <p className="font-black text-[#756b63] uppercase tracking-[0.2em] text-[10px]">No feedback records found</p>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3eadf] text-[#28231f] font-sans p-6">
      <div className="mx-auto max-w-xl space-y-6 pt-12">
        <div className="text-center space-y-2 mb-10">
          <h1 className="text-4xl font-normal tracking-tight">How was your visit?</h1>
          <p className="text-[#756b63] font-medium">Your feedback helps us refine the artisan experience.</p>
        </div>

        <Card className="border-[#d9cbbd] bg-[#fffaf3] shadow-2xl rounded-[2rem] overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#756b63]">Session Token</label>
                <input
                  required
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter your session ID"
                  className="w-full rounded-xl border border-[#d9cbbd] bg-white p-4 text-sm focus:ring-2 focus:ring-[#356b4f] outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#756b63]">Overall Rating</label>
                <div className="flex justify-between items-center gap-2 p-2 rounded-xl bg-[#f3eadf]/50 border border-[#d9cbbd]/50">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val.toString())}
                      className={cn(
                        "flex-1 py-3 rounded-lg transition-all flex flex-col items-center gap-1",
                        rating === val.toString()
                          ? "bg-[#356b4f] text-white shadow-md scale-105"
                          : "text-[#756b63] hover:bg-[#eadfd2]"
                      )}
                    >
                      <Star className={cn("h-5 w-5", rating === val.toString() ? "fill-current" : "")} />
                      <span className="text-[10px] font-bold">{val}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#756b63]">Your Thoughts</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  placeholder="Tell us about your experience..."
                  className="min-h-[120px] w-full rounded-xl border border-[#d9cbbd] bg-white p-4 text-sm focus:ring-2 focus:ring-[#356b4f] outline-none transition-all resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={submit.isPending}
                className="w-full h-14 bg-[#28231f] hover:bg-[#356b4f] text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all active:scale-95"
              >
                {submit.isPending ? 'TRANSMITTING...' : 'SUBMIT FEEDBACK'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
