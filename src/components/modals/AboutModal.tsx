import { useTranslation } from 'react-i18next';
import { X, CheckCircle } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const features = [
    t('about.multiStore'),
    t('about.inventory'),
    t('about.sales'),
    t('about.team'),
    t('about.qrCodes'),
    t('about.multilingual'),
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('about.title')}
            </h2>
            <h3 className="text-xl text-primary-600 dark:text-primary-400">
              {t('about.appName')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('about.version')} 1.0.0
            </p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-300">
              {t('about.description')}
            </p>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              {t('about.features')}:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{t('about.developer')}:</span> Isakovs company
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{t('about.license')}:</span> SOME License
            </p>
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="btn btn-secondary">
              {t('about.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
