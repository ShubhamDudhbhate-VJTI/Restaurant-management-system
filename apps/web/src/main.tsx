import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/geist-sans';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './components/ui/toast';
import { NotificationHandler } from './components/NotificationHandler';
import Login from './pages/Login';
import Signup from './pages/Signup';
// ... existing imports
import TablesPage from './pages/Tables';
import AdminPage from './pages/Admin';
import AdminMenuPage from './pages/admin/Menu';
import ScanResultPage from './pages/ScanResult';
import MenuPage from './pages/Menu';
import OrdersPage from './pages/Orders';
import HistoryPage from './pages/History';
import KitchenPage from './pages/Kitchen';
import CashierPage from './pages/Cashier';
import ReservationsPage from './pages/Reservations';
import StaffPage from './pages/Staff';
import ReportsPage from './pages/Reports';
import WaiterPage from './pages/Waiter';
import FeedbackPage from './pages/Feedback';
import AuditLogsPage from './pages/AuditLogs';
import Landing from './pages/Landing';
import { Role } from '@/contracts';
import './index.css';

const queryClient = new QueryClient();


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <NotificationHandler />
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/" element={<Landing />} />
          
          <Route path="/tables" element={
            <ProtectedRoute>
              <TablesPage />
            </ProtectedRoute>
          } />

          <Route path="/t/:qrToken" element={
            <ProtectedRoute>
              <ScanResultPage />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/menu" element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminMenuPage />
            </ProtectedRoute>
          } />
          
          <Route path="/menu" element={
            <ProtectedRoute>
              <MenuPage />
            </ProtectedRoute>
          } />
          
          <Route path="/orders" element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />

          <Route path="/history" element={
            <ProtectedRoute allowedRoles={[Role.CUSTOMER, Role.ADMIN]}>
              <HistoryPage />
            </ProtectedRoute>
          } />
          
          <Route path="/kitchen" element={
            <ProtectedRoute allowedRoles={[Role.KITCHEN, Role.ADMIN]}>
              <KitchenPage />
            </ProtectedRoute>
          } />
          
          <Route path="/cashier" element={
            <ProtectedRoute allowedRoles={[Role.CASHIER, Role.ADMIN]}>
              <CashierPage />
            </ProtectedRoute>
          } />
          <Route path="/waiter" element={<ProtectedRoute allowedRoles={[Role.WAITER, Role.ADMIN]}><WaiterPage /></ProtectedRoute>} />
          <Route path="/customer/reservations" element={<ProtectedRoute allowedRoles={[Role.CUSTOMER]}><ReservationsPage /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><StaffPage /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><ReportsPage /></ProtectedRoute>} />
          <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><FeedbackPage /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><AuditLogsPage /></ProtectedRoute>} />
          <Route path="/customer/feedback" element={<ProtectedRoute allowedRoles={[Role.CUSTOMER]}><FeedbackPage /></ProtectedRoute>} />
          <Route path="/admin/reservations" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><ReservationsPage /></ProtectedRoute>} />

        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
