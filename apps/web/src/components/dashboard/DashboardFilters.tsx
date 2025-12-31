'use client';

/**
 * Dashboard Global Filters Component
 * 
 * Provides global filtering capabilities for all widgets in the dashboard.
 * Filters are applied across all widgets simultaneously.
 * 
 * Features:
 * - Date range picker
 * - Company/Client filter
 * - Employee filter
 * - Project filter
 * - Quick presets (Today, This Week, This Month, This Quarter, This Year)
 * 
 * @component
 */

import { useState, useEffect } from 'react';
import { Calendar, Building2, User, FolderKanban, X, Filter } from 'lucide-react';
import { useDashboardStore } from '@/lib/dashboard/store';
import { apiClient } from '@/lib/api/client';

interface Company {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
}

export function DashboardFilters() {
  const { globalFilters, setGlobalFilters, clearGlobalFilters } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load filter options
  useEffect(() => {
    if (isOpen && companies.length === 0) {
      loadFilterOptions();
    }
  }, [isOpen]);

  const loadFilterOptions = async () => {
    setIsLoading(true);
    try {
      // Load companies
      const companiesRes = await apiClient.get('/api/v1/commercial/companies');
      const companiesData = companiesRes.data as { items?: Company[] } | Company[] | undefined;
      setCompanies((Array.isArray(companiesData) ? companiesData : companiesData?.items || []).slice(0, 50) as Company[]);

      // Load employees
      try {
        const employeesRes = await apiClient.get('/api/v1/management/employees');
        const employeesData = employeesRes.data as { items?: Employee[] } | Employee[] | undefined;
        setEmployees((Array.isArray(employeesData) ? employeesData : employeesData?.items || []).slice(0, 50) as Employee[]);
      } catch (e) {
        console.warn('Employees endpoint not available');
      }

      // Load projects
      try {
        const projectsRes = await apiClient.get('/api/v1/projects');
        const projectsData = projectsRes.data as { items?: Project[] } | Project[] | undefined;
        setProjects((Array.isArray(projectsData) ? projectsData : projectsData?.items || []).slice(0, 50) as Project[]);
      } catch (e) {
        console.warn('Projects endpoint not available');
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatePreset = (preset: string) => {
    const now = new Date();
    let start_date: string;
    const end_date = now.toISOString().split('T')[0] || '';

    switch (preset) {
      case 'today':
        start_date = end_date;
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        start_date = weekAgo.toISOString().split('T')[0] || '';
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        start_date = monthAgo.toISOString().split('T')[0] || '';
        break;
      case 'quarter':
        const quarterAgo = new Date(now);
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        start_date = quarterAgo.toISOString().split('T')[0] || '';
        break;
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        start_date = yearAgo.toISOString().split('T')[0] || '';
        break;
      default:
        return;
    }

    setGlobalFilters({ ...globalFilters, start_date, end_date });
  };

  const hasActiveFilters = 
    globalFilters.start_date ||
    globalFilters.end_date ||
    globalFilters.company_id ||
    globalFilters.employee_id ||
    globalFilters.project_id;

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          hasActiveFilters
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-white text-blue-600 rounded-full">
            {[
              globalFilters.start_date,
              globalFilters.company_id,
              globalFilters.employee_id,
              globalFilters.project_id,
            ].filter(Boolean).length}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Global Filters
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Date Range */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="date"
                    value={globalFilters.start_date || ''}
                    onChange={(e) => setGlobalFilters({ ...globalFilters, start_date: e.target.value || undefined })}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="date"
                    value={globalFilters.end_date || ''}
                    onChange={(e) => setGlobalFilters({ ...globalFilters, end_date: e.target.value || undefined })}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {['today', 'week', 'month', 'quarter', 'year'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handleDatePreset(preset)}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      {preset === 'today' ? 'Today' : `This ${preset.charAt(0).toUpperCase() + preset.slice(1)}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building2 className="w-4 h-4" />
                  Company
                </label>
                <select
                  value={globalFilters.company_id || ''}
                  onChange={(e) => setGlobalFilters({ ...globalFilters, company_id: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="">All Companies</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Filter */}
              {employees.length > 0 && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4" />
                    Employee
                  </label>
                  <select
                    value={globalFilters.employee_id || ''}
                    onChange={(e) => setGlobalFilters({ ...globalFilters, employee_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isLoading}
                  >
                    <option value="">All Employees</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Project Filter */}
              {projects.length > 0 && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FolderKanban className="w-4 h-4" />
                    Project
                  </label>
                  <select
                    value={globalFilters.project_id || ''}
                    onChange={(e) => setGlobalFilters({ ...globalFilters, project_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isLoading}
                  >
                    <option value="">All Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  clearGlobalFilters();
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                disabled={!hasActiveFilters}
              >
                Clear All
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
