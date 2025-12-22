/**
 * UI Components Library
 * Complete ERP component library exports
 */

// Core Components
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Textarea } from './Textarea';
export { default as Select } from './Select';
export type { SelectOption } from './Select';
export { default as Checkbox } from './Checkbox';
export { default as Radio } from './Radio';
export { default as Switch } from './Switch';
export { default as DatePicker } from './DatePicker';
export { default as FileUpload } from './FileUpload';
export { default as Badge } from './Badge';
export { default as Dropdown } from './Dropdown';
export type { DropdownItem } from './Dropdown';

// Layout Components
export { default as Card } from './Card';
export { default as Container } from './Container';
export { default as Tabs, TabList, Tab, TabPanels, TabPanel } from './Tabs';
export type { TabListProps, TabProps, TabPanelsProps, TabPanelProps } from './Tabs';
export type { Tab as TabType } from './Tabs';
export { default as Accordion } from './Accordion';
export type { AccordionItem } from './Accordion';
export { default as Sidebar } from './Sidebar';

// Data Components
export { default as DataTable } from './DataTable';
export { default as DataTableEnhanced } from './DataTableEnhanced';
export type { Column, DataTableProps } from './DataTable';
export type { BulkAction, ExportOption, DataTableEnhancedProps } from './DataTableEnhanced';
export { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './Table';
export { default as Pagination } from './Pagination';
export { default as EmptyState } from './EmptyState';
export { default as StatsCard } from './StatsCard';

// Overlay Components
export { default as Modal, ConfirmModal } from './Modal';
export type { ModalProps } from './Modal';
export { default as Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

// Form Components
export { default as Form, FormField } from './Form';
export type { FormProps, FormFieldProps } from './Form';
import type { FormField as FormFieldTypeImport } from './Form';
export type { FormFieldTypeImport as FormFieldType };

// Feedback Components
export { default as Alert } from './Alert';
export type { AlertProps, AlertVariant } from './Alert';
export { default as ToastContainer } from './ToastContainer';
export { useToast } from './ToastContainer';
export { default as Toast } from './Toast';
export type { ToastProps } from './Toast';
export type { ToastData } from './ToastContainer';
export { default as Loading } from './Loading';
export { default as Skeleton } from './Skeleton';
export { default as Progress } from './Progress';
export { default as Spinner } from './Spinner';

// Chart Components
export { default as Chart } from './Chart';
export type { ChartProps, ChartDataPoint } from './Chart';

// Avatar Components (if exists)
export { default as Avatar, AvatarImage, AvatarFallback } from './Avatar';

// Theme Components
export { default as ThemeToggle, ThemeToggleWithIcon } from './ThemeToggle';

// Utility Components
export { default as ClientOnly } from './ClientOnly';
export { default as SearchBar } from './SearchBar';

// New Components
export { default as Drawer } from './Drawer';
export type { DrawerProps } from './Drawer';
export { default as Autocomplete } from './Autocomplete';
export type { AutocompleteProps, AutocompleteOption } from './Autocomplete';
export { default as Stepper } from './Stepper';
export type { StepperProps, Step } from './Stepper';
export { default as Popover } from './Popover';
export type { PopoverProps } from './Popover';
export { default as TreeView } from './TreeView';
export type { TreeViewProps, TreeNode } from './TreeView';

// Advanced Components
export { default as KanbanBoard } from './KanbanBoard';
export type { KanbanBoardProps, KanbanCard, KanbanColumn } from './KanbanBoard';
export { default as FormBuilder } from './FormBuilder';
export type { FormBuilderProps, FormField, FieldType } from './FormBuilder';
export { default as Calendar } from './Calendar';
export type { CalendarProps, CalendarEvent } from './Calendar';
export { default as CRUDModal } from './CRUDModal';
export type { CRUDModalProps } from './CRUDModal';
export { default as ExportButton } from './ExportButton';
export type { ExportButtonProps } from './ExportButton';
export { default as FileUploadWithPreview } from './FileUploadWithPreview';
export type { FileUploadWithPreviewProps } from './FileUploadWithPreview';

// Command Palette
export { default as CommandPalette, useCommandPalette } from './CommandPalette';
export type { CommandPaletteProps, Command } from './CommandPalette.types';

// MultiSelect
export { default as MultiSelect } from './MultiSelect';
export type { MultiSelectProps, MultiSelectOption } from './MultiSelect';

// Rich Text Editor
export { default as RichTextEditor } from './RichTextEditor';
export type { RichTextEditorProps } from './RichTextEditor';