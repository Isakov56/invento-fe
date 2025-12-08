import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X, Package, TrendingDown } from 'lucide-react';
import { productsService } from '../../services/products.service';
import { useNavigate } from 'react-router-dom';

export default function LowStockAlert() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['low-stock-alert'],
    queryFn: () => productsService.getLowStock(),
    refetchInterval: 60000, // Refetch every minute
  });

  if (dismissed || lowStockProducts.length === 0) {
    return null;
  }

  // Group variants by product
  const productsMap = new Map();
  lowStockProducts.forEach((product) => {
    if (!productsMap.has(product.id)) {
      productsMap.set(product.id, {
        ...product,
        lowStockVariants: [],
      });
    }
    const productData = productsMap.get(product.id);
    productData.lowStockVariants.push(...(product.variants || []));
  });

  const lowStockItems = Array.from(productsMap.values());
  const totalLowStockVariants = lowStockItems.reduce(
    (sum, p) => sum + p.lowStockVariants.length,
    0
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <TrendingDown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{t('dashboard.lowStockAlert')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('dashboard.itemsNeedRestocking', { count: totalLowStockVariants })}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Show first 3 low stock items */}
        <div className="space-y-2 mb-3">
          {lowStockItems.slice(0, 3).map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded"
            >
              <Package className="w-4 h-4 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {product.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('dashboard.variantsLow', { count: product.lowStockVariants.length })}
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {t('dashboard.left', { count: product.lowStockVariants[0]?.stockQuantity || 0 })}
              </span>
            </div>
          ))}
          {lowStockItems.length > 3 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              {t('dashboard.moreProducts', { count: lowStockItems.length - 3 })}
            </p>
          )}
        </div>

        <button
          onClick={() => {
            setDismissed(true);
            navigate('/inventory/products');
          }}
          className="w-full btn btn-primary text-sm"
        >
          {t('dashboard.viewInventory')}
        </button>
      </div>
    </div>
  );
}
