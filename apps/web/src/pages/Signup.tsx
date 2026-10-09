import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignupSchema, SignupInput } from '@/contracts';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { getDefaultRedirectPath } from '../utils/authRedirect';

export default function Signup() {
  const { signup, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema)
  });

  if (user) {
    return <Navigate to={getDefaultRedirectPath(user.role, searchParams)} replace />;
  }

  const onSubmit = async (data: SignupInput) => {
    try {
      setError(null);
      await signup(data);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f5f6f1] flex items-center justify-center p-4 font-sans">
      <div className="relative z-10 w-full max-w-md border border-[#dfe4dc] bg-white p-8 md:p-12 shadow-[0_20px_60px_rgba(23,45,29,0.08)] text-center">
          
          <h1 className="text-3xl font-semibold tracking-tight text-[#151a17] mb-2">
            Create an account
          </h1>
          <p className="text-[#64706a] text-sm mb-8">
            Enter your details to get started
          </p>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left">
            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-semibold text-[#536059]">Name</label>
              <input
                id="name"
                placeholder="John Doe"
                {...register('name')}
                className="w-full bg-white border border-[#cbd5cc] rounded-md px-4 py-3 text-[#151a17] placeholder:text-[#8a968d] focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all"
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-[#536059]">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className="w-full bg-white border border-[#cbd5cc] rounded-md px-4 py-3 text-[#151a17] placeholder:text-[#8a968d] focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all"
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold text-[#536059]">Password</label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="w-full bg-white border border-[#cbd5cc] rounded-md px-4 py-3 text-[#151a17] placeholder:text-[#8a968d] focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all"
              />
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>
            
            <button 
              type="submit" 
              className="w-full mt-6 bg-[#176b46] text-white py-3.5 rounded-md font-semibold hover:bg-[#0f5939] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#dfe4dc] text-sm text-[#64706a]">
            Already have an account? 
            <Link to={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} className="ml-2 text-[#176b46] hover:text-[#0f5939] font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
  );
}
