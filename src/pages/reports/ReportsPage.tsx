import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Calendar,
  Loader2,
  Download,
  FileText,
  X,
  RefreshCw,
} from 'lucide-react';
import { reportsService } from '../../services/reports.service';
import { useToastStore } from '../../store/toastStore';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function ReportsPage() {
  const { t } = useTranslation();
  const { success } = useToastStore();
  const [dateRange, setDateRange] = useState('7days');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    salesData: true,
    topProducts: true,
    paymentMethods: true,
    inventoryValue: true,
  });

  // Calculate date range - memoized to prevent infinite re-renders
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999); // End of today
    const start = new Date(end); // Start from end date

    switch (dateRange) {
      case '7days':
        start.setDate(start.getDate() - 6); // 7 days including today
        start.setHours(0, 0, 0, 0);
        break;
      case '30days':
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        break;
      case '90days':
        start.setDate(start.getDate() - 89);
        start.setHours(0, 0, 0, 0);
        break;
      case '1year':
        start.setFullYear(end.getFullYear() - 1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [dateRange]);

  // Fetch reports data
  const { data: salesData = [], isLoading: salesLoading, refetch: refetchSalesData } = useQuery({
    queryKey: ['sales-report', startDate, endDate, groupBy],
    queryFn: () => reportsService.getSalesReport({ startDate, endDate, groupBy }),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: topProducts = [], isLoading: topProductsLoading, refetch: refetchTopProducts } = useQuery({
    queryKey: ['top-products', startDate, endDate],
    queryFn: () => reportsService.getTopProducts({ startDate, endDate, limit: 5 }),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: paymentMethods = [], isLoading: paymentLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['payment-methods', startDate, endDate],
    queryFn: () => reportsService.getPaymentMethodBreakdown({ startDate, endDate }),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: inventoryValue, isLoading: inventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ['inventory-value'],
    queryFn: () => reportsService.getInventoryValue(),
    retry: 1,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Refresh all data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchSalesData(),
        refetchTopProducts(),
        refetchPayments(),
        refetchInventory(),
      ]);
      success(t('reports.dataRefreshed') || 'Data refreshed successfully! You now have the most recent data.');
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate totals from sales data
  const totals = salesData.reduce(
    (acc, item) => ({
      revenue: acc.revenue + item.revenue,
      transactions: acc.transactions + item.transactions,
      items: acc.items + item.items,
    }),
    { revenue: 0, transactions: 0, items: 0 }
  );

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const sections: string[] = [];
      if (exportOptions.salesData) sections.push('salesData');
      if (exportOptions.topProducts) sections.push('topProducts');
      if (exportOptions.paymentMethods) sections.push('paymentMethods');
      if (exportOptions.inventoryValue) sections.push('inventoryValue');

      await reportsService.exportCSV({
        startDate,
        endDate,
        sections,
      });

      setShowExportDialog(false);
    } catch (error) {
      console.error('Export CSV error:', error);
      alert(t('reports.exportError'));
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      const sections: string[] = [];
      if (exportOptions.salesData) sections.push('salesData');
      if (exportOptions.topProducts) sections.push('topProducts');
      if (exportOptions.paymentMethods) sections.push('paymentMethods');
      if (exportOptions.inventoryValue) sections.push('inventoryValue');

      await reportsService.exportPDF({
        startDate,
        endDate,
        sections,
      });

      setShowExportDialog(false);
    } catch (error) {
      console.error('Export PDF error:', error);
      alert(t('reports.exportError'));
    }
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('reports.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('reports.subtitle')}
          </p>
        </div>

        {/* Date Range Selector & Export */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowExportDialog(true)}
            className="btn btn-primary flex items-center justify-center gap-2 order-2 sm:order-1"
          >
            <Download className="w-5 h-5" />
            <span>{t('common.export')}</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary flex items-center justify-center gap-2 order-3 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh latest data"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-3">
            <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input flex-1 sm:w-40"
            >
              <option value="7days">{t('reports.last7Days')}</option>
              <option value="30days">{t('reports.last30Days')}</option>
              <option value="90days">{t('reports.last90Days')}</option>
              <option value="1year">{t('reports.lastYear')}</option>
            </select>
          </div>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="input flex-1 sm:w-32 order-3"
          >
            <option value="day">{t('reports.byDay')}</option>
            <option value="week">{t('reports.byWeek')}</option>
            <option value="month">{t('reports.byMonth')}</option>
          </select>
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('common.export')} {t('reports.title')}
              </h3>
              <button
                onClick={() => setShowExportDialog(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('reports.selectSections')}
              </p>

              <div className="space-y-3 mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.salesData}
                    onChange={(e) => setExportOptions({ ...exportOptions, salesData: e.target.checked })}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('reports.salesData')}
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.topProducts}
                    onChange={(e) => setExportOptions({ ...exportOptions, topProducts: e.target.checked })}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('reports.topProducts')}
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.paymentMethods}
                    onChange={(e) => setExportOptions({ ...exportOptions, paymentMethods: e.target.checked })}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('reports.salesByPayment')}
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.inventoryValue}
                    onChange={(e) => setExportOptions({ ...exportOptions, inventoryValue: e.target.checked })}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('reports.inventoryValue')}
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={exportToCSV}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                  disabled={!Object.values(exportOptions).some(v => v)}
                >
                  <FileText className="w-5 h-5" />
                  {t('reports.exportCSV')}
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                  disabled={!Object.values(exportOptions).some(v => v)}
                >
                  <Download className="w-5 h-5" />
                  {t('reports.exportPDF')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('reports.totalSales')}</h3>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          {salesLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                ${totals.revenue.toFixed(2)}
              </p>
            </>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.todayTransactions')}</h3>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          {salesLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{totals.transactions}</p>
            </>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.items')}</h3>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          {salesLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{totals.items}</p>
            </>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('reports.avgOrderValue')}</h3>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          {salesLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                ${totals.transactions > 0 ? (totals.revenue / totals.transactions).toFixed(2) : '0.00'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('reports.salesTrend')}
          </h2>
          {salesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Transactions Chart */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('dashboard.todayTransactions')} & {t('dashboard.items')}
          </h2>
          {salesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="transactions" fill="#10B981" name="Transactions" />
                <Bar dataKey="items" fill="#8B5CF6" name="Items" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment Methods */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('reports.salesByPayment')}
          </h2>
          {paymentLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {t('reports.noData')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods as any}
                  dataKey="count"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.method}: ${entry.percent}%`}
                >
                  {paymentMethods.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('reports.topProducts')}
          </h2>
          {topProductsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : topProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {t('reports.noData')}
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.productName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {product.sku} • {product.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {product.quantitySold} sold
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ${product.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inventory Value */}
      {inventoryValue && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('reports.inventoryValue')}
          </h2>
          {inventoryLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('reports.totalCostValue')}</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${inventoryValue.totalCostValue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t('reports.totalSellingValue')}
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${inventoryValue.totalSellingValue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t('reports.potentialProfit')}
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ${inventoryValue.potentialProfit.toFixed(2)}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('reports.totalItems')}</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {inventoryValue.totalItems}
                  </p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {t('common.category')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {t('dashboard.items')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {t('reports.costValue')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {t('reports.sellingValue')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {t('reports.potentialProfit')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {inventoryValue.categoryBreakdown.map((cat) => (
                      <tr key={cat.category}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {cat.category}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                          {cat.items}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                          ${cat.costValue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                          ${cat.sellingValue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400 text-right">
                          ${cat.potentialProfit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
