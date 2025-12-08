import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  User,
  QrCode,
  Store,
  Users,
  Settings,
  Info,
  Mail,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import NotificationDropdown from '../notifications/NotificationDropdown';
import Toast from '../common/Toast';
import LanguageSwitcher from '../common/LanguageSwitcher';
import AboutModal from '../modals/AboutModal';
import ContactModal from '../modals/ContactModal';

interface MainLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[]; // Roles that can access this menu item
}

// Define all navigation items with role-based access (outside component to avoid recreation)
const allNavigation: NavigationItem[] = [
  {
    name: 'nav.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER],
  },
  {
    name: 'nav.inventory',
    href: '/inventory',
    icon: Package,
    roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER],
  },
  {
    name: 'nav.pos',
    href: '/pos',
    icon: ShoppingCart,
    roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER],
  },
  {
    name: 'nav.productCodes',
    href: '/product-codes',
    icon: QrCode,
    roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER],
  },
  {
    name: 'nav.reports',
    href: '/reports',
    icon: BarChart3,
    roles: [UserRole.OWNER, UserRole.MANAGER], // CASHIER cannot access
  },
  {
    name: 'nav.team',
    href: '/team',
    icon: Users,
    roles: [UserRole.OWNER, UserRole.MANAGER], // CASHIER cannot access
  },
  {
    name: 'nav.stores',
    href: '/settings/stores',
    icon: Store,
    roles: [UserRole.OWNER], // Only OWNER can manage stores
  },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter navigation based on user role
  const navigation = user?.role
    ? allNavigation.filter((item) => item.roles.includes(user.role))
    : [];

  const isActive = (path: string) => {
    if (path === '/inventory') {
      return location.pathname.startsWith('/inventory');
    }
    if (path === '/settings/stores') {
      return location.pathname.startsWith('/settings');
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Retail POS
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{t(item.name)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Links */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="space-y-1">
            <Link
              to="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Settings className="w-4 h-4" />
              <span>{t('nav.settings')}</span>
            </Link>
            <button
              onClick={() => {
                setShowAboutModal(true);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Info className="w-4 h-4" />
              <span>{t('nav.about')}</span>
            </button>
            <button
              onClick={() => {
                setShowContactModal(true);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>{t('nav.contact')}</span>
            </button>
          </div>
        </div>

        {/* User section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.role}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 btn btn-danger flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 lg:flex-none">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t(navigation.find((item) => isActive(item.href))?.name || 'nav.dashboard')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString(i18n.language, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <NotificationDropdown />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>

      {/* Toast Notifications */}
      <Toast />

      {/* Modals */}
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </div>
  );
}
