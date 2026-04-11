'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export interface MaterialRow {
  materialName: string;
  materialCode: string;
}

interface MaterialRowsFieldsProps {
  rows: MaterialRow[];
  onChange: (rows: MaterialRow[]) => void;
  disabled?: boolean;
}

/**
 * Raw materials editor: each row is stored on the batch as
 * `{ materialName: string, materialCode: string }` in `materialsUsed` (no extra fields).
 */
export function MaterialRowsFields({ rows, onChange, disabled }: MaterialRowsFieldsProps) {
  const updateRow = (index: number, patch: Partial<MaterialRow>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...rows, { materialName: '', materialCode: '' }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Raw materials (materialsUsed)</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={disabled}>
          <Plus className="h-4 w-4 mr-1" />
          Add more
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Each row is saved in the database as one object with <code className="text-xs">materialName</code> and{' '}
        <code className="text-xs">materialCode</code>. Leave all rows empty to resolve codes from production dates
        when available.
      </p>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-end sm:gap-2"
          >
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">materialName</Label>
              <Input
                value={row.materialName}
                onChange={(e) => updateRow(index, { materialName: e.target.value })}
                placeholder="e.g. Natural Rubber"
                disabled={disabled}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">materialCode</Label>
              <Input
                value={row.materialCode}
                onChange={(e) => updateRow(index, { materialCode: e.target.value })}
                placeholder="e.g. NK/AS/25-26/1946"
                disabled={disabled}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeRow(index)}
              disabled={disabled || rows.length <= 1}
              aria-label="Remove row"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
