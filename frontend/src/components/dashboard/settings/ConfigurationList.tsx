'use client';

import * as React from 'react';
import { SystemSetting } from '@/server-actions/settings/types';
import { deleteSystemSetting } from '@/server-actions/settings/actions';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

interface ConfigurationListProps {
  settings: SystemSetting[];
  onEdit: (setting: SystemSetting) => void;
  onDelete: (setting: SystemSetting) => void;
}

export function ConfigurationList({ settings, onEdit, onDelete }: ConfigurationListProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleEdit = (setting: SystemSetting) => {
    onEdit(setting);
  };

  const handleDelete = async (setting: SystemSetting) => {
    if (!setting.id) return;
    setDeletingId(setting.id);
    onDelete(setting);
    setDeletingId(null);
  };

  return (
    <div className='border rounded-lg'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {settings.map((setting) => (
            <TableRow key={setting.id}>
              <TableCell className='font-medium'>{setting.key}</TableCell>
              <TableCell>{setting.value}</TableCell>
              <TableCell>{setting.type}</TableCell>
              <TableCell>{setting.description}</TableCell>
              <TableCell className='text-right'>
                <Button
                  variant='outline'
                  size='icon'
                  className='mr-2'
                  onClick={() => handleEdit(setting)}
                >
                  <Pencil className='h-4 w-4' />
                  <span className='sr-only'>Edit</span>
                </Button>
                <Button
                  variant='destructive'
                  size='icon'
                  onClick={() => handleDelete(setting)}
                  disabled={deletingId === setting.id}
                >
                  {deletingId === setting.id ? (
                    <div className='h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin' />
                  ) : (
                    <Trash2 className='h-4 w-4' />
                  )}
                  <span className='sr-only'>Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
