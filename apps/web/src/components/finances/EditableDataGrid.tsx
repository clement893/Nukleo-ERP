'use client';

import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { Plus } from 'lucide-react';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Button, useToast } from '@/components/ui';

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
  const [anchorCell, setAnchorCell] = useState<CellPosition | null>(null); // For Shift+Click selection
  const [cellValues, setCellValues] = useState<Map<string, any>>(new Map());
  const [cellErrors, setCellErrors] = useState<Map<string, string>>(new Map());
  const inputRefs = useRef<Map<string, HTMLInputElement | HTMLSelectElement>>(new Map());
  const tableRef = useRef<HTMLDivElement>(null);

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

  const handleCellEdit = (rowIndex: number, colIndex: number, e?: React.MouseEvent | React.KeyboardEvent) => {
    const column = columns[colIndex];
    if (!column || !column.editable) return;
    
    // Handle Shift+Click for range selection
    if (e && e.shiftKey && anchorCell) {
      const minRow = Math.min(anchorCell.rowIndex, rowIndex);
      const maxRow = Math.max(anchorCell.rowIndex, rowIndex);
      const minCol = Math.min(anchorCell.colIndex, colIndex);
      const maxCol = Math.max(anchorCell.colIndex, colIndex);
      
      const newSelection = new Set<string>();
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newSelection.add(getCellKey(r, c));
        }
      }
      setSelectedCells(newSelection);
      setEditingCell({ rowIndex, colIndex });
      return;
    }
    
    // Handle Ctrl/Cmd+Click for multi-select
    if (e && (e.ctrlKey || e.metaKey)) {
      const cellKey = getCellKey(rowIndex, colIndex);
      const newSelection = new Set(selectedCells);
      if (newSelection.has(cellKey)) {
        newSelection.delete(cellKey);
      } else {
        newSelection.add(cellKey);
      }
      setSelectedCells(newSelection);
      setAnchorCell({ rowIndex, colIndex });
      return;
    }
    
    // Normal click - single cell selection and edit
    setEditingCell({ rowIndex, colIndex });
    setSelectedCells(new Set([getCellKey(rowIndex, colIndex)]));
    setAnchorCell({ rowIndex, colIndex });
  };
  
  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    // Double-click to edit (Excel-like behavior)
    handleCellEdit(rowIndex, colIndex);
    setTimeout(() => {
      const key = getCellKey(rowIndex, colIndex);
      inputRefs.current.get(key)?.focus();
      // Select all text in input for easy editing
      const input = inputRefs.current.get(key) as HTMLInputElement;
      if (input && input.setSelectionRange) {
        input.setSelectionRange(0, input.value.length);
      }
    }, 0);
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
    // F2 to edit cell (Excel-like)
    if (e.key === 'F2') {
      e.preventDefault();
      handleCellEdit(rowIndex, colIndex);
      setTimeout(() => {
        const key = getCellKey(rowIndex, colIndex);
        inputRefs.current.get(key)?.focus();
        const input = inputRefs.current.get(key) as HTMLInputElement;
        if (input && input.setSelectionRange) {
          input.setSelectionRange(0, input.value.length);
        }
      }, 0);
      return;
    }
    
    // Ctrl+D to duplicate cell down (Excel-like)
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      if (rowIndex < data.length - 1) {
        const value = getCellValue(rowIndex, colIndex);
        handleCellChange(rowIndex + 1, colIndex, value);
        handleCellEdit(rowIndex + 1, colIndex);
        setTimeout(() => {
          const key = getCellKey(rowIndex + 1, colIndex);
          inputRefs.current.get(key)?.focus();
        }, 0);
      }
      return;
    }
    
    // Ctrl+R to duplicate cell right (Excel-like)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      if (colIndex < columns.length - 1) {
        const column = columns[colIndex + 1];
        if (column && column.editable) {
          const value = getCellValue(rowIndex, colIndex);
          handleCellChange(rowIndex, colIndex + 1, value);
          handleCellEdit(rowIndex, colIndex + 1);
          setTimeout(() => {
            const key = getCellKey(rowIndex, colIndex + 1);
            inputRefs.current.get(key)?.focus();
          }, 0);
        }
      }
      return;
    }
    
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
      // Save current edit first
      if (editingCell) {
        const input = inputRefs.current.get(getCellKey(editingCell.rowIndex, editingCell.colIndex));
        if (input && 'blur' in input) {
          input.blur();
        }
      }
      // Move to next row
      const nextRow = e.shiftKey ? rowIndex - 1 : rowIndex + 1;
      if (nextRow >= 0 && nextRow < data.length) {
        handleCellEdit(nextRow, colIndex);
        setTimeout(() => {
          const key = getCellKey(nextRow, colIndex);
          inputRefs.current.get(key)?.focus();
          const input = inputRefs.current.get(key) as HTMLInputElement;
          if (input && input.setSelectionRange) {
            input.setSelectionRange(0, input.value.length);
          }
        }, 0);
      } else if (!e.shiftKey && nextRow >= data.length && onRowAdd) {
        // Add new row when Enter at the last row
        onRowAdd();
        // Wait a bit for the new row to be added, then focus first cell
        setTimeout(() => {
          if (data.length > 0) {
            handleCellEdit(data.length, 0);
            setTimeout(() => {
              const key = getCellKey(data.length, 0);
              inputRefs.current.get(key)?.focus();
            }, 50);
          }
        }, 100);
      }
    } else if (e.key === 'Escape') {
      // Cancel editing and revert changes
      setEditingCell(null);
      // Revert cell value to original
      if (editingCell) {
        const row = data[editingCell.rowIndex];
        if (row) {
          const col = columns[editingCell.colIndex];
          if (col) {
            const originalValue = row[col.key as keyof T];
            setCellValue(editingCell.rowIndex, editingCell.colIndex, originalValue);
          }
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (e.shiftKey && anchorCell) {
        // Extend selection with Shift+Arrow
        const newRow = Math.max(0, rowIndex - 1);
        const minRow = Math.min(anchorCell.rowIndex, newRow);
        const maxRow = Math.max(anchorCell.rowIndex, rowIndex);
        const minCol = Math.min(anchorCell.colIndex, colIndex);
        const maxCol = Math.max(anchorCell.colIndex, colIndex);
        
        const newSelection = new Set<string>();
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            newSelection.add(getCellKey(r, c));
          }
        }
        setSelectedCells(newSelection);
      } else if (rowIndex > 0) {
        handleCellEdit(rowIndex - 1, colIndex);
        setTimeout(() => {
          const key = getCellKey(rowIndex - 1, colIndex);
          inputRefs.current.get(key)?.focus();
        }, 0);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (e.shiftKey && anchorCell) {
        // Extend selection with Shift+Arrow
        const newRow = Math.min(data.length - 1, rowIndex + 1);
        const minRow = Math.min(anchorCell.rowIndex, rowIndex);
        const maxRow = Math.max(anchorCell.rowIndex, newRow);
        const minCol = Math.min(anchorCell.colIndex, colIndex);
        const maxCol = Math.max(anchorCell.colIndex, colIndex);
        
        const newSelection = new Set<string>();
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            newSelection.add(getCellKey(r, c));
          }
        }
        setSelectedCells(newSelection);
        if (newRow === data.length - 1 && onRowAdd) {
          // Add row when extending selection to the end
          onRowAdd();
        }
      } else if (rowIndex < data.length - 1) {
        handleCellEdit(rowIndex + 1, colIndex);
        setTimeout(() => {
          const key = getCellKey(rowIndex + 1, colIndex);
          inputRefs.current.get(key)?.focus();
        }, 0);
      } else if (!e.shiftKey && onRowAdd) {
        // Add new row when ArrowDown at last row
        onRowAdd();
        setTimeout(() => {
          if (data.length > 0) {
            handleCellEdit(data.length, colIndex);
            setTimeout(() => {
              const key = getCellKey(data.length, colIndex);
              inputRefs.current.get(key)?.focus();
            }, 50);
          }
        }, 100);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (e.shiftKey && anchorCell) {
        // Extend selection with Shift+Arrow
        const newCol = Math.max(0, colIndex - 1);
        const minRow = Math.min(anchorCell.rowIndex, rowIndex);
        const maxRow = Math.max(anchorCell.rowIndex, rowIndex);
        const minCol = Math.min(anchorCell.colIndex, newCol);
        const maxCol = Math.max(anchorCell.colIndex, colIndex);
        
        const newSelection = new Set<string>();
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            newSelection.add(getCellKey(r, c));
          }
        }
        setSelectedCells(newSelection);
      } else if (colIndex > 0) {
        handleCellEdit(rowIndex, colIndex - 1);
        setTimeout(() => {
          const key = getCellKey(rowIndex, colIndex - 1);
          inputRefs.current.get(key)?.focus();
        }, 0);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (e.shiftKey && anchorCell) {
        // Extend selection with Shift+Arrow
        const newCol = Math.min(columns.length - 1, colIndex + 1);
        const minRow = Math.min(anchorCell.rowIndex, rowIndex);
        const maxRow = Math.max(anchorCell.rowIndex, rowIndex);
        const minCol = Math.min(anchorCell.colIndex, colIndex);
        const maxCol = Math.max(anchorCell.colIndex, newCol);
        
        const newSelection = new Set<string>();
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            newSelection.add(getCellKey(r, c));
          }
        }
        setSelectedCells(newSelection);
      } else if (colIndex < columns.length - 1) {
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
        'relative px-3 py-2 border border-gray-200 dark:border-gray-700 cursor-cell',
        'transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30',
        isEditing && 'border-primary-500 border-2 ring-2 ring-primary-500/20',
        isSelected && !isEditing && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
        error && 'border-red-500 bg-red-50/50 dark:bg-red-900/20',
        column.align === 'right' && 'text-right',
        column.align === 'center' && 'text-center',
      ),
      onClick: (e) => handleCellEdit(rowIndex, colIndex, e),
      onDoubleClick: () => handleCellDoubleClick(rowIndex, colIndex),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, rowIndex, colIndex),
      tabIndex: column.editable ? 0 : -1,
      role: 'gridcell',
      'aria-selected': isSelected || isEditing || false,
    } as React.HTMLAttributes<HTMLTableCellElement>;
    
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
                if (el) {
                  inputRefs.current.set(inputKey, el as HTMLInputElement);
                  // Focus and select all on mount
                  setTimeout(() => {
                    el.focus();
                    if (el.setSelectionRange && el.value) {
                      el.setSelectionRange(0, el.value.length);
                    }
                  }, 0);
                }
              }}
              type={inputType}
              value={column.type === 'date' ? formattedValue : (column.type === 'number' || column.type === 'currency' ? (typeof value === 'number' ? value : '') : String(value || ''))}
              onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
              onBlur={handleCellBlur}
              onKeyDown={(e) => {
                // Don't bubble up keyboard events when editing
                e.stopPropagation();
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  // Move to next row
                  const nextRow = rowIndex + 1;
                  if (nextRow < data.length) {
                    handleCellChange(rowIndex, colIndex, e.currentTarget.value);
                    setTimeout(() => {
                      handleCellEdit(nextRow, colIndex);
                      const key = getCellKey(nextRow, colIndex);
                      inputRefs.current.get(key)?.focus();
                      const input = inputRefs.current.get(key) as HTMLInputElement;
                      if (input && input.setSelectionRange) {
                        input.setSelectionRange(0, input.value.length);
                      }
                    }, 0);
                  } else if (onRowAdd) {
                    // Add new row
                    handleCellChange(rowIndex, colIndex, e.currentTarget.value);
                    onRowAdd();
                    setTimeout(() => {
                      if (data.length > 0) {
                        handleCellEdit(data.length, colIndex);
                        setTimeout(() => {
                          const key = getCellKey(data.length, colIndex);
                          inputRefs.current.get(key)?.focus();
                        }, 50);
                      }
                    }, 100);
                  }
                }
              }}
              className="w-full border-0 focus:ring-0 p-0 m-0 bg-transparent"
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

  // Global keyboard handler for the table
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input/textarea outside the table
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        // Only handle if it's one of our table inputs
        const isTableInput = Array.from(inputRefs.current.values()).includes(
          e.target as HTMLInputElement | HTMLSelectElement
        );
        if (!isTableInput) return;
      }

      // F2 to edit selected cell
      if (e.key === 'F2' && selectedCells.size === 1 && !editingCell) {
        e.preventDefault();
        const cellKey = Array.from(selectedCells)[0];
        const parts = cellKey.split('-');
        const rowIdx = parts[0] ? Number(parts[0]) : undefined;
        const colIdx = parts[1] ? Number(parts[1]) : undefined;
        if (rowIdx !== undefined && colIdx !== undefined && !isNaN(rowIdx) && !isNaN(colIdx)) {
          handleCellEdit(rowIdx, colIdx);
          setTimeout(() => {
            const key = getCellKey(rowIdx, colIdx);
            inputRefs.current.get(key)?.focus();
            const input = inputRefs.current.get(key) as HTMLInputElement;
            if (input && input.setSelectionRange) {
              input.setSelectionRange(0, input.value.length);
            }
          }, 0);
        }
      }
    };

    if (tableRef.current) {
      tableRef.current.addEventListener('keydown', handleGlobalKeyDown);
      return () => {
        if (tableRef.current) {
          tableRef.current.removeEventListener('keydown', handleGlobalKeyDown);
        }
      };
    }
  }, [selectedCells, editingCell]);

  return (
    <div 
      ref={tableRef}
      className={clsx('overflow-auto', className)}
      onKeyDown={(e) => {
        // Handle Escape globally to cancel editing
        if (e.key === 'Escape' && editingCell) {
          setEditingCell(null);
        }
      }}
    >
      <Table className="border-collapse w-full">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableHeader
                key={column.key}
                style={column.width ? { width: column.width, minWidth: column.width } : undefined}
                className={clsx(
                  'sticky top-0 bg-gray-50 dark:bg-gray-800 z-10 font-semibold',
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
                <div className="flex flex-col items-center gap-3">
                  <p>Aucune donnée</p>
                  {onRowAdd && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRowAdd}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une ligne
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            <>
              {data.map((row, rowIndex) => (
                <TableRow 
                  key={rowKey(row)} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 group"
                >
                  {columns.map((_column, colIndex) => renderCell(rowIndex, colIndex))}
                </TableRow>
              ))}
              {/* Add row button at the end */}
              {onRowAdd && (
                <TableRow className="border-t-2 border-dashed border-gray-300 dark:border-gray-600">
                  <TableCell 
                    colSpan={columns.length} 
                    className="px-3 py-2"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onRowAdd}
                      className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une ligne
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
