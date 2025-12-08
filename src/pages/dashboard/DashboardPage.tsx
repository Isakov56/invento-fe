import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertCircle,
  Loader2,
  DollarSign,
} from 'lucide-react';
import { transactionsService } from '../../services/transactions.service';
import { productsService } from '../../services/products.service';
import StatCard from '../../components/dashboard/StatCard';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Check if user can view transaction stats (OWNER and MANAGER only)
  const canViewStats = user?.role === UserRole.OWNER || user?.role === UserRole.MANAGER;

  // Fetch transaction stats - only for OWNER and MANAGER
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['transaction-stats'],
    queryFn: () => transactionsService.getStats(),
    enabled: canViewStats, // Only fetch if user has permission
    retry: 1,
  });

  // Fetch today's transactions - only for OWNER and MANAGER
  const { data: todayTransactions = [], isLoading: transactionsLoading, isError: transactionsError } = useQuery({
    queryKey: ['today-transactions'],
    queryFn: () => transactionsService.getToday(),
    enabled: canViewStats, // Only fetch if user has permission
    retry: 1,
  });

  // Fetch low stock products
  const { data: lowStockProducts = [], isLoading: lowStockLoading, isError: lowStockError } = useQuery({
    queryKey: ['low-stock-products'],
    queryFn: () => productsService.getLowStock(),
    retry: 1,
  });

  // Fetch all products for count
  const { data: allProducts = [], isLoading: productsLoading, isError: productsError } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => productsService.getAll(),
    retry: 1,
  });

  // Calculate total items sold today (not used currently but may be useful later)
  // const totalItemsSold = todayTransactions.reduce(
  //   (sum, txn) => sum + txn.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
  //   0
  // );

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('dashboard.welcomeBack', { name: user?.firstName })}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${canViewStats ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6 mb-8`}>
        {/* Today's Revenue - Only OWNER and MANAGER */}
        {canViewStats && (
          <StatCard
            title={t('dashboard.todayRevenue')}
            value={`$${(stats?.todayRevenue || 0).toFixed(2)}`}
            subtitle={t('dashboard.revenue')}
            icon={DollarSign}
            iconColor="text-green-600 dark:text-green-400"
            iconBg="bg-green-100 dark:bg-green-900/30"
            isLoading={statsLoading}
            isError={statsError}
          />
        )}

        {/* Total Products */}
        <StatCard
          title={t('dashboard.totalProducts')}
          value={allProducts.length}
          subtitle={t('dashboard.products')}
          icon={Package}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          isLoading={productsLoading}
          isError={productsError}
        />

        {/* Today's Transactions - Only OWNER and MANAGER */}
        {canViewStats && (
          <StatCard
            title={t('dashboard.todayTransactions')}
            value={todayTransactions.length}
            subtitle={t('dashboard.transactions')}
            icon={ShoppingCart}
            iconColor="text-purple-600 dark:text-purple-400"
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            isLoading={transactionsLoading}
            isError={transactionsError}
          />
        )}

        {/* Low Stock Items */}
        <StatCard
          title={t('dashboard.lowStockItems')}
          value={lowStockProducts.length}
          subtitle={t('dashboard.items')}
          icon={AlertCircle}
          iconColor="text-red-600 dark:text-red-400"
          iconBg="bg-red-100 dark:bg-red-900/30"
          isLoading={lowStockLoading}
          isError={lowStockError}
        />
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {t('dashboard.quickActions')}
        </h2>
        <div className={`grid grid-cols-1 md:grid-cols-${canViewStats ? '3' : '1'} gap-4`}>
          <button
            onClick={() => navigate('/pos')}
            className="btn btn-primary p-4 h-auto flex flex-col items-center gap-2"
          >
            <ShoppingCart className="w-8 h-8" />
            <span>{t('dashboard.newSale')}</span>
          </button>
          {/* Add Product - Only OWNER and MANAGER */}
          {canViewStats && (
            <button
              onClick={() => navigate('/inventory/products/new')}
              className="btn btn-secondary p-4 h-auto flex flex-col items-center gap-2"
            >
              <Package className="w-8 h-8" />
              <span>{t('dashboard.addProduct')}</span>
            </button>
          )}
          {/* View Reports - Only OWNER and MANAGER */}
          {canViewStats && (
            <button
              onClick={() => navigate('/reports')}
              className="btn btn-secondary p-4 h-auto flex flex-col items-center gap-2"
            >
              <TrendingUp className="w-8 h-8" />
              <span>{t('dashboard.viewReports')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Recent Transactions - Only OWNER and MANAGER */}
      {canViewStats && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.recentTransactions')}
            </h2>
            <button
              onClick={() => navigate('/reports')}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {t('dashboard.viewAll')}
            </button>
          </div>

        {transactionsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : transactionsError ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">Connection error</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Unable to load transactions. Please check your connection.
            </p>
          </div>
        ) : todayTransactions.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noTransactions')}</p>
            <button
              onClick={() => navigate('/pos')}
              className="btn btn-primary mt-4"
            >
              {t('dashboard.makeFirstSale')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {t('dashboard.transactionNumber')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {t('dashboard.cashier')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {t('dashboard.items')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {t('dashboard.payment')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {t('common.total')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {t('common.time')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {todayTransactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.transactionNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {transaction.cashier?.firstName} {transaction.cashier?.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {transaction.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700">
                        {transaction.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">
                      ${transaction.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {new Date(transaction.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
