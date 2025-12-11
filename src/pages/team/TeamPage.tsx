import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Edit2, Trash2, X, Mail, Lock, User, Phone, Store, AlertCircle, Loader2 } from 'lucide-react';
import { employeeService, type Employee, type CreateEmployeeData } from '../../services/employee.service';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { storesService } from '../../services/stores.service';
import SkeletonLoader from '../../components/common/SkeletonLoader';

export default function TeamPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Fetch employees
  const { data: employees = [], isLoading, isError } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeService.getAllEmployees,
    retry: 1,
  });

  // Fetch stores for dropdown
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: storesService.getAll,
    retry: 1,
  });

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  const handleEditSuccess = () => {
    setEditingEmployee(null);
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <div className="flex-1">
            <SkeletonLoader className="h-8 w-32 mb-2 rounded" />
            <SkeletonLoader className="h-4 w-64 rounded" />
          </div>
          <SkeletonLoader className="h-10 w-full lg:w-40 rounded" />
        </div>

        {/* Employee Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-4 sm:p-6">
              {/* Avatar Skeleton */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <SkeletonLoader className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <SkeletonLoader className="h-4 w-24 mb-2 rounded" />
                    <SkeletonLoader className="h-3 w-32 rounded" />
                  </div>
                </div>
              </div>

              {/* Details Skeleton */}
              <div className="space-y-3">
                <SkeletonLoader className="h-3 w-full rounded" />
                <SkeletonLoader className="h-3 w-5/6 rounded" />
                <SkeletonLoader className="h-3 w-4/5 rounded" />
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex gap-2 mt-4">
                <SkeletonLoader className="flex-1 h-9 rounded" />
                <SkeletonLoader className="flex-1 h-9 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('team.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('team.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center justify-center gap-2 w-full lg:w-auto"
        >
          <UserPlus className="w-5 h-5" />
          {t('team.addEmployee')}
        </button>
      </div>

      {/* Employee List */}
      {isError ? (
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">{t('errors.connectionError')}</p>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('errors.retryConnection')}
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            {t('common.retry')}
          </button>
        </div>
      ) : employees.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('team.noEmployees')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('team.addFirst')}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {t('team.addEmployee')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={() => setEditingEmployee(employee)}
              canEdit={user?.role === UserRole.OWNER || user?.role === UserRole.MANAGER}
              canDelete={user?.role === UserRole.OWNER}
            />
          ))}
        </div>
      )}

      {/* Create Employee Modal */}
      {showCreateModal && (
        <CreateEmployeeModal
          stores={stores}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          userRole={user?.role || UserRole.CASHIER}
        />
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          stores={stores}
          onClose={() => setEditingEmployee(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

// Employee Card Component
interface EmployeeCardProps {
  employee: Employee;
  onEdit: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

function EmployeeCard({ employee, onEdit, canEdit, canDelete }: EmployeeCardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: employeeService.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`)) {
      deleteMutation.mutate(employee.id);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case UserRole.MANAGER:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case UserRole.CASHIER:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {employee.firstName} {employee.lastName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{employee.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
          {employee.role}
        </div>
        {employee.store && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Store className="w-4 h-4" />
            {employee.store.name}
          </div>
        )}
        {employee.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4" />
            {employee.phone}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${employee.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
          {employee.isActive ? t('common.active') : t('common.inactive')}
        </div>
      </div>

      <div className="flex gap-2">
        {canEdit && (
          <button
            onClick={onEdit}
            className="flex-1 btn btn-secondary flex items-center justify-center"
            title={t('common.edit')}
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex-1 btn bg-red-600 hover:bg-red-700 text-white flex items-center justify-center disabled:opacity-50"
            title={deleteMutation.isPending ? t('team.deleting') : t('common.delete')}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Create Employee Modal Component
interface CreateEmployeeModalProps {
  stores: any[];
  onClose: () => void;
  onSuccess: () => void;
  userRole: UserRole;
}

function CreateEmployeeModal({ stores, onClose, onSuccess, userRole }: CreateEmployeeModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CreateEmployeeData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.CASHIER,
    phone: '',
    storeId: stores[0]?.id || '',
  });
  const [validationError, setValidationError] = useState('');

  const createMutation = useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      setValidationError(error.response?.data?.error || 'Failed to create employee');
    },
  });

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Must contain uppercase letter';
    if (!/[a-z]/.test(password)) return 'Must contain lowercase letter';
    if (!/[0-9]/.test(password)) return 'Must contain number';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setValidationError(passwordError);
      return;
    }

    createMutation.mutate(formData);
  };

  const availableRoles = userRole === UserRole.OWNER
    ? [UserRole.MANAGER, UserRole.CASHIER]
    : [UserRole.CASHIER];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('team.addEmployee')}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('team.firstName')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input pl-10"
                  placeholder="John"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('team.lastName')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input pl-10"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input pl-10"
                placeholder="employee@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{t('team.passwordRequirements')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.phone')} ({t('common.optional')})
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input pl-10"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('team.employeeRole')}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="input"
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('team.employeeStore')}
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                required
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                className="input pl-10"
              >
                <option value="">Select a store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              {createMutation.isPending ? t('team.creating') : t('team.createEmployee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Employee Modal Component
interface EditEmployeeModalProps {
  employee: Employee;
  stores: any[];
  onClose: () => void;
  onSuccess: () => void;
}

function EditEmployeeModal({ employee, stores, onClose, onSuccess }: EditEmployeeModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    phone: employee.phone || '',
    storeId: employee.storeId || '',
    isActive: employee.isActive,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => employeeService.updateEmployee(employee.id, data),
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('team.editEmployee')}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('team.firstName')}
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('team.lastName')}
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.phone')}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.store')}
            </label>
            <select
              value={formData.storeId}
              onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
              className="input"
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.active')}</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              {updateMutation.isPending ? t('team.saving') : t('team.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
