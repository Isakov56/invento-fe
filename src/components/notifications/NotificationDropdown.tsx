import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Package, TrendingDown, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsService } from '../../services/products.service';
import { useSettings } from '../../hooks/useSettings';
import { useToastStore } from '../../store/toastStore';
import type { Product, ProductVariant } from '../../types';

interface LowStockItem {
  product: Product;
  variant: ProductVariant;
}

const LOW_STOCK_WARNING_SHOWN_KEY = 'lowStockWarningShown';

export default function NotificationDropdown() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { lowStockThreshold } = useSettings();
  const { warning } = useToastStore();
  const [hasShownWarning, setHasShownWarning] = useState(() => {
    // Check if warning was shown in this session
    return sessionStorage.getItem(LOW_STOCK_WARNING_SHOWN_KEY) === 'true';
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.getAll(),
    refetchInterval: 60000, // Refetch every minute
  });

  // Get low stock items
  const lowStockItems: LowStockItem[] = [];
  products.forEach((product) => {
    product.variants?.forEach((variant) => {
      if (variant.stockQuantity <= lowStockThreshold) {
        lowStockItems.push({ product, variant });
      }
    });
  });

  const unreadCount = lowStockItems.length;

  // Show warning toast once per session when low stock items are detected
  useEffect(() => {
    if (lowStockItems.length > 0 && !hasShownWarning) {
      warning(
        t('notifications.lowStockWarning', { count: lowStockItems.length }),
        8000 // Show for 8 seconds
      );
      sessionStorage.setItem(LOW_STOCK_WARNING_SHOWN_KEY, 'true');
      setHasShownWarning(true);
    }
  }, [lowStockItems.length, hasShownWarning, warning, t]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title={t('notifications.title')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed sm:absolute right-4 sm:right-0 left-4 sm:left-auto mt-2 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('notifications.title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {unreadCount} {t('notifications.lowStockItems')}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('notifications.noNotifications')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {lowStockItems.map(({ product, variant }, index) => (
                  <div
                    key={`${product.id}-${variant.id}-${index}`}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {variant.size && `Size: ${variant.size}`}
                          {variant.size && variant.color && ' • '}
                          {variant.color && `Color: ${variant.color}`}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                            {t('notifications.stock')}: {variant.stockQuantity}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            SKU: {variant.sku}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {lowStockItems.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/inventory';
                }}
                className="w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                {t('notifications.viewInventory')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
