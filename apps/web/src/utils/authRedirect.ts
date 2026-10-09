import { Role } from '@/contracts';

export function getDefaultRedirectPath(role: Role, searchParams: URLSearchParams): string {
  const next = searchParams.get('next');
  if (next && next.startsWith('/')) {
    return next;
  }
  
  const defaultRoute: Record<Role, string> = {
    [Role.ADMIN]: '/admin',
    [Role.KITCHEN]: '/kitchen',
    [Role.CASHIER]: '/cashier',
    [Role.WAITER]: '/waiter',
    [Role.CUSTOMER]: '/tables',
    [Role.RUNNER]: '/runner'
  };
  
  return defaultRoute[role] || '/';
}
