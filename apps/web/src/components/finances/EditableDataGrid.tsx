'use client';

import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui';

export interface EditableColumn<T> {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'currency';
  editable: boolean;
  required?: boolean;
  validate?: (value: any, row: T) => string | null;
  options?: Array<{ value: string; label: string }>;
  format?: (value: any) => string;
  parse?: (value: string) => any;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface CellUpdate {
  rowId: string | number;
  columnKey: string;
  value: any;
}

export interface EditableDataGridProps<T> {
  data: T[];
  columns: EditableColumn<T>[];
  onCellChange: (rowId: string | number, columnKey: string, value: any) => void;
  onRowAdd?: () => void;
  onBulkUpdate?: (updates: CellUpdate[]) => void;
  rowKey: (row: T) => string | number;
  loading?: boolean;
  className?: string;
}

interface CellPosition {
  rowIndex: number;
  colIndex: number;
}

export default function EditableDataGrid<T extends { [key: string]: any }>({
  data,
  columns,
  onCellChange,
  onRowAdd,
  onBulkUpdate,
  rowKey,
  loading = false,
  className,
}: EditableDataGridProps<T>) {
  const { showToast } = useToast();
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [cellValues, setCellValues] = useState<Map<string, any>>(new Map());
  const [cellErrors, setCellErrors] = useState<Map<string, string>>(new Map());
  const inputRefs = useRef<Map<string, HTMLInputElement | HTMLSelectElement>>(new Map());

  // Initialize cell values from data
  useEffect(() => {
    const newValues = new Map<string, any>();
    data.forEach((row, rowIndex) => {
      columns.forEach((col) => {
        const key = `${rowIndex}-${columns.indexOf(col)}`;
        const rawValue = row[col.key as keyof T];
        newValues.set(key, rawValue);
      });
    });
    setCellValues(newValues);
  }, [data, columns]);

  const getCellKey = (rowIndex: number, colIndex: number): string => {
    return `${rowIndex}-${colIndex}`;
  };

  const getCellValue = (rowIndex: number, colIndex: number): any => {
    const key = getCellKey(rowIndex, colIndex);
    if (cellValues.has(key)) {
      return cellValues.get(key);
    }
    const row = data[rowIndex];
    if (!row) return null;
    const col = columns[colIndex];
    if (!col) return null;
    return row[col.key as keyof T];
  };

  const setCellValue = (rowIndex: number, colIndex: number, value: any) => {
    const key = getCellKey(rowIndex, colIndex);
    setCellValues(prev => new Map(prev).set(key, value));
  };

  const getFormattedValue = (value: any, column: EditableColumn<T>): string => {
    if (value === null || value === undefined) return '';
    if (column.format) return column.format(value);
    
    switch (column.type) {
      case 'currency':
        return typeof value === 'number' 
          ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(value)
          : String(value);
      case 'date':
        if (value instanceof Date) {
          const dateStr = value.toISOString().split('T')[0];
          return dateStr ?? '';
        }
        if (typeof value === 'string') {
          if (value.includes('T')) {
            const dateStr = value.split('T')[0];
            return dateStr ?? value;
          }
          return value;
        }
        return '';
      case 'number':
        return typeof value === 'number' ? value.toString() : String(value || '');
      default:
        return String(value || '');
    }
  };

  const parseValue = (value: string, column: EditableColumn<T>): any => {
    if (column.parse) return column.parse(value);
    
    switch (column.type) {
      case 'number':
      case 'currency':
        const num = parseFloat(value.replace(/[^\d.-]/g, ''));
        return isNaN(num) ? 0 : num;
      case 'date':
        return value;
      default:
        return value;
    }
  };

  const validateCell = (value: any, column: EditableColumn<T>, row: T): string | null => {
    if (column.required && (value === null || value === undefined || value === '')) {
      return `${column.label} est requis`;
    }
    if (column.validate) {
      return column.validate(value, row);
    }
    return null;
  };

  const handleCellEdit = (rowIndex: number, colIndex: number) => {
    const column = columns[colIndex];
    if (!column || !column.editable) return;
    setEditingCell({ rowIndex, colIndex });
    setSelectedCells(new Set([getCellKey(rowIndex, colIndex)]));
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: any) => {
    const column = columns[colIndex];
    if (!column) return;
    
    const parsedValue = typeof value === 'string' ? parseValue(value, column) : value;
    const row = data[rowIndex];
    if (!row) return;
    
    // Validate
    const error = validateCell(parsedValue, column, row);
    const key = getCellKey(rowIndex, colIndex);
    if (error) {
      setCellErrors(prev => new Map(prev).set(key, error));
    } else {
      setCellErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(key);
        return newErrors;
      });
    }
    
    // Update local value
    setCellValue(rowIndex, colIndex, parsedValue);
    
    // Trigger onChange
    const rowId = rowKey(row);
    onCellChange(rowId, column.key, parsedValue);
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextCol = e.shiftKey ? colIndex - 1 : colIndex + 1;
      if (nextCol >= 0 && nextCol < columns.length) {
        handleCellEdit(rowIndex, nextCol);
        setTimeout(() => {
          const key = getCellKey(rowIndex, nextCol);
          inputRefs.current.get(key)?.focus();
        }, 0);
      } else if (!e.shiftKey && nextCol >= columns.length && onRowAdd) {
        // Move to next row
        if (rowIndex < data.length - 1) {
          handleCellEdit(rowIndex + 1, 0);
          setTimeout(() => {
            const key = getCellKey(rowIndex + 1, 0);
            inputRefs.current.get(key)?.focus();
          }, 0);
        } else {
          // Add new row if at end
          onRowAdd();
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const nextRow = e.shiftKey ? rowIndex - 1 : rowIndex + 1;
      if (nextRow >= 0 && nextRow < data.length) {
        handleCellEdit(nextRow, colIndex);
        setTimeout(() => {
          const key = getCellKey(nextRow, colIndex);
          inputRefs.current.get(key)?.focus();
        }, 0);
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    } else if (e.key === 'ArrowUp' && !e.shiftKey) {
      e.preventDefault();
      if (rowIndex > 0) {
        handleCellEdit(rowIndex - 1, colIndex);
        setTimeout(() => {
          const key = getCellKey(rowIndex - 1, colIndex);
          inputRefs.current.get(key)?.focus();
        }, 0);
      }
    } else if (e.key === 'ArrowDown' && !e.shiftKey) {
      e.preventDefault();
      if (rowIndex < data.length - 1) {
        handleCellEdit(rowIndex + 1, colIndex);
        setTimeout(() => {
          const key = getCellKey(rowIndex + 1, colIndex);
          inputRefs.current.get(key)?.focus();
        }, 0);
      }
    } else if (e.key === 'ArrowLeft' && !e.shiftKey) {
      e.preventDefault();
      if (colIndex > 0) {
        handleCellEdit(rowIndex, colIndex - 1);
        setTimeout(() => {
          const key = getCellKey(rowIndex, colIndex - 1);
          inputRefs.current.get(key)?.focus();
        }, 0);
      }
    } else if (e.key === 'ArrowRight' && !e.shiftKey) {
      e.preventDefault();
      if (colIndex < columns.length - 1) {
        handleCellEdit(rowIndex, colIndex + 1);
        setTimeout(() => {
          const key = getCellKey(rowIndex, colIndex + 1);
          inputRefs.current.get(key)?.focus();
        }, 0);
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      // Copy selected cells
      handleCopy(e);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      // Paste
      handlePaste(e, rowIndex, colIndex);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedCells.size > 1) {
        // Delete multiple selected cells
        e.preventDefault();
        selectedCells.forEach(cellKey => {
          const parts = cellKey.split('-');
          const rIdxStr = parts[0];
          const cIdxStr = parts[1];
          if (rIdxStr !== undefined && cIdxStr !== undefined) {
            const rIdx = Number(rIdxStr);
            const cIdx = Number(cIdxStr);
            if (!isNaN(rIdx) && !isNaN(cIdx)) {
              const col = columns[cIdx];
              if (col && col.editable) {
                handleCellChange(rIdx, cIdx, col.type === 'number' || col.type === 'currency' ? 0 : '');
              }
            }
          }
        });
      }
    }
  };

  const handleCopy = async (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (selectedCells.size === 0 && editingCell) {
      // Copy single cell if editing
      const value = getCellValue(editingCell.rowIndex, editingCell.colIndex);
      const col = columns[editingCell.colIndex];
      const formatted = col ? getFormattedValue(value, col) : String(value || '');
      try {
        await navigator.clipboard.writeText(formatted);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      return;
    }
    
    if (selectedCells.size === 0) return;
    
    const cells = Array.from(selectedCells)
      .map(key => {
        const parts = key.split('-');
        const rowIdx = parts[0] ? Number(parts[0]) : undefined;
        const colIdx = parts[1] ? Number(parts[1]) : undefined;
        if (rowIdx !== undefined && colIdx !== undefined) {
          return [rowIdx, colIdx] as [number, number];
        }
        return null;
      })
      .filter((c): c is [number, number] => c !== null)
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    
    if (cells.length === 0) return;
    
    const minRow = Math.min(...cells.map(c => c[0]));
    const maxRow = Math.max(...cells.map(c => c[0]));
    const minCol = Math.min(...cells.map(c => c[1]));
    const maxCol = Math.max(...cells.map(c => c[1]));
    
    const rows: string[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const rowValues: string[] = [];
      for (let c = minCol; c <= maxCol; c++) {
        const key = getCellKey(r, c);
        if (selectedCells.has(key) || (minRow === maxRow && minCol === maxCol)) {
          const value = getCellValue(r, c);
          const col = columns[c];
          const formatted = col ? getFormattedValue(value, col) : String(value || '');
          rowValues.push(formatted);
        } else {
          rowValues.push('');
        }
      }
      rows.push(rowValues.join('\t'));
    }
    
    const text = rows.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePaste = async (e: React.KeyboardEvent, startRowIndex: number, startColIndex: number) => {
    e.preventDefault();
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) return;
      
      const updates: CellUpdate[] = [];
      
      lines.forEach((line, lineIndex) => {
        const values = line.split('\t');
        const rowIndex = startRowIndex + lineIndex;
        if (rowIndex >= data.length) {
          // Add new row if needed
          if (onRowAdd) {
            onRowAdd();
          }
          return;
        }
        
        values.forEach((value, colIndex) => {
          const actualColIndex = startColIndex + colIndex;
          if (actualColIndex >= columns.length || actualColIndex < 0) return;
          
          const column = columns[actualColIndex];
          if (!column || !column.editable) return;
          
          const row = data[rowIndex];
          if (!row) return;
          
          const parsedValue = parseValue(value.trim(), column);
          const rowId = rowKey(row);
          
          updates.push({
            rowId,
            columnKey: column.key,
            value: parsedValue,
          });
          
          handleCellChange(rowIndex, actualColIndex, parsedValue);
        });
      });
      
      if (onBulkUpdate && updates.length > 0) {
        onBulkUpdate(updates);
      }
    } catch (err) {
      console.error('Failed to paste:', err);
      showToast({
        message: 'Erreur lors du collage',
        type: 'error',
      });
    }
  };

  const renderCell = (rowIndex: number, colIndex: number) => {
    const column = columns[colIndex];
    if (!column) return null;
    
    const row = data[rowIndex];
    if (!row) return null;
    
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex;
    const cellKey = getCellKey(rowIndex, colIndex);
    const value = getCellValue(rowIndex, colIndex);
    const error = cellErrors.get(cellKey);
    const isSelected = selectedCells.has(cellKey);
    
    const formattedValue = getFormattedValue(value, column);
    
    const cellProps = {
      key: cellKey,
      className: clsx(
        'relative px-3 py-2 border border-gray-200 dark:border-gray-700',
        isEditing && 'border-primary-500 border-2',
        isSelected && !isEditing && 'bg-blue-50 dark:bg-blue-900/20',
        error && 'border-red-500',
        column.align === 'right' && 'text-right',
        column.align === 'center' && 'text-center',
      ),
      onClick: () => handleCellEdit(rowIndex, colIndex),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, rowIndex, colIndex),
      tabIndex: 0,
    };
    
    if (isEditing) {
      const inputKey = cellKey;
      if (column.type === 'select' && column.options) {
        return (
          <TableCell {...cellProps}>
            <Select
              ref={(el) => {
                if (el) inputRefs.current.set(inputKey, el as HTMLSelectElement);
              }}
              value={String(value || '')}
              onChange={(e) => {
                handleCellChange(rowIndex, colIndex, e.target.value);
                setEditingCell(null);
              }}
              onBlur={handleCellBlur}
              options={column.options}
              className="w-full"
              autoFocus
            />
            {error && (
              <div className="absolute -bottom-5 left-0 text-xs text-red-500 z-10">
                {error}
              </div>
            )}
          </TableCell>
        );
      } else {
        const inputType = column.type === 'date' ? 'date' : column.type === 'number' || column.type === 'currency' ? 'number' : 'text';
        return (
          <TableCell {...cellProps}>
            <Input
              ref={(el) => {
                if (el) inputRefs.current.set(inputKey, el as HTMLInputElement);
              }}
              type={inputType}
              value={column.type === 'date' ? formattedValue : (column.type === 'number' || column.type === 'currency' ? (typeof value === 'number' ? value : '') : String(value || ''))}
              onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
              onBlur={handleCellBlur}
              className="w-full"
              autoFocus
              error={error || undefined}
            />
          </TableCell>
        );
      }
    }
    
    return (
      <TableCell {...cellProps}>
        <div className="min-h-[20px]">
          {formattedValue || <span className="text-gray-400 italic">—</span>}
        </div>
        {error && (
          <div className="absolute -bottom-5 left-0 text-xs text-red-500 z-10 bg-white dark:bg-gray-800 px-1">
            {error}
          </div>
        )}
      </TableCell>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={clsx('overflow-auto', className)}>
      <Table className="border-collapse">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableHeader
                key={column.key}
                style={column.width ? { width: column.width, minWidth: column.width } : undefined}
                className={clsx(
                  'sticky top-0 bg-gray-50 dark:bg-gray-800 z-10',
                  column.align === 'right' && 'text-right',
                  column.align === 'center' && 'text-center',
                )}
              >
                {column.label}
                {column.required && <span className="text-red-500 ml-1">*</span>}
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                Aucune donnée
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow key={rowKey(row)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {columns.map((_column, colIndex) => renderCell(rowIndex, colIndex))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
