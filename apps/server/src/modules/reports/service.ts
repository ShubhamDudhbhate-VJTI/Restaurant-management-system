import { reportsRepository } from './repository';

export class ReportsService {
  async getDashboardStats() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const data = await reportsRepository.getTodayStats(start);

    const averageRating = data.feedback.length
      ? data.feedback.reduce((sum, item) => sum + item.rating, 0) / data.feedback.length
      : 0;

    return {
      orders: data.orders.length,
      revenueCents: data.sessions.reduce((sum, item) => sum + (item.totalCents || 0), 0),
      occupiedTables: data.tables.filter((table) => table.status === 'occupied' || table.status === 'billing').length,
      totalTables: data.tables.length,
      averageRating: Number(averageRating.toFixed(1))
    };
  }

  async getSalesReport() {
    const data = await reportsRepository.getSalesData();
    const now = Date.now();

    const counts = new Map<string, number>();
    for (const item of data.orderItems) {
      counts.set(item.name, (counts.get(item.name) || 0) + item.quantity);
    }

    return {
      daily: data.sessions.filter((item) => item.endedAt && item.endedAt.getTime() >= now - 86400000).length,
      weekly: data.sessions.filter((item) => item.endedAt && item.endedAt.getTime() >= now - 7 * 86400000).length,
      monthly: data.sessions.filter((item) => item.endedAt && item.endedAt.getTime() >= now - 30 * 86400000).length,
      popularItems: [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }))
    };
  }
}

export const reportsService = new ReportsService();
