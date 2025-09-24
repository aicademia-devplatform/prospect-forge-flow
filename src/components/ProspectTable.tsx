import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Plus, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data for demonstration
const mockProspects = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@techcorp.com',
    company: 'TechCorp Inc.',
    title: 'VP Sales',
    status: 'new',
    assignee: 'Sarah Johnson',
    phone: '+1 (555) 123-4567',
    source: 'LinkedIn',
    lastContact: '2024-01-15',
    value: 25000,
  },
  {
    id: 2,
    name: 'Emily Davis',
    email: 'emily.davis@innovate.com',
    company: 'Innovate Solutions',
    title: 'Marketing Director',
    status: 'contacted',
    assignee: 'Mike Chen',
    phone: '+1 (555) 234-5678',
    source: 'Website',
    lastContact: '2024-01-12',
    value: 45000,
  },
  {
    id: 3,
    name: 'Robert Wilson',
    email: 'r.wilson@growth.co',
    company: 'Growth Co.',
    title: 'CEO',
    status: 'qualified',
    assignee: 'Sarah Johnson',
    phone: '+1 (555) 345-6789',
    source: 'Referral',
    lastContact: '2024-01-10',
    value: 75000,
  },
  {
    id: 4,
    name: 'Lisa Anderson',
    email: 'lisa.a@digitalfirm.com',
    company: 'Digital Firm',
    title: 'CTO',
    status: 'closed',
    assignee: 'Alex Rodriguez',
    phone: '+1 (555) 456-7890',
    source: 'Cold Email',
    lastContact: '2024-01-08',
    value: 120000,
  },
  {
    id: 5,
    name: 'David Brown',
    email: 'david.brown@startupx.io',
    company: 'StartupX',
    title: 'Founder',
    status: 'new',
    assignee: 'Mike Chen',
    phone: '+1 (555) 567-8901',
    source: 'Event',
    lastContact: '2024-01-14',
    value: 15000,
  },
];

const columns = [
  { key: 'name', label: 'Name', visible: true },
  { key: 'email', label: 'Email', visible: true },
  { key: 'company', label: 'Company', visible: true },
  { key: 'title', label: 'Title', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'assignee', label: 'Assignee', visible: true },
  { key: 'phone', label: 'Phone', visible: false },
  { key: 'source', label: 'Source', visible: false },
  { key: 'lastContact', label: 'Last Contact', visible: true },
  { key: 'value', label: 'Deal Value', visible: true },
];

const statusColors = {
  new: 'status-new',
  contacted: 'status-contacted', 
  qualified: 'status-qualified',
  closed: 'status-closed',
};

export const ProspectTable = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible }), {} as Record<string, boolean>)
  );
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const assignees = [...new Set(mockProspects.map(p => p.assignee))];

  const filteredProspects = useMemo(() => {
    return mockProspects.filter(prospect => {
      const matchesSearch = 
        prospect.name.toLowerCase().includes(search.toLowerCase()) ||
        prospect.email.toLowerCase().includes(search.toLowerCase()) ||
        prospect.company.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || prospect.status === statusFilter;
      const matchesAssignee = assigneeFilter === 'all' || prospect.assignee === assigneeFilter;
      
      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [search, statusFilter, assigneeFilter]);

  const handleRowSelect = (id: number) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search prospects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {assignees.map(assignee => (
                <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {columns.map(column => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={visibleColumns[column.key]}
                  onCheckedChange={(checked) => 
                    setVisibleColumns(prev => ({ ...prev, [column.key]: checked }))
                  }
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Prospect
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(filteredProspects.map(p => p.id));
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                    checked={selectedRows.length === filteredProspects.length && filteredProspects.length > 0}
                  />
                </th>
                {columns.map(column => 
                  visibleColumns[column.key] && (
                    <th key={column.key} className="cursor-pointer hover:bg-muted/70">
                      <div className="flex items-center justify-between">
                        {column.label}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 ml-2"
                          onClick={() => 
                            setVisibleColumns(prev => ({ ...prev, [column.key]: false }))
                          }
                        >
                          <EyeOff className="h-3 w-3" />
                        </Button>
                      </div>
                    </th>
                  )
                )}
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProspects.map((prospect) => (
                <tr
                  key={prospect.id}
                  className={selectedRows.includes(prospect.id) ? 'selected' : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selectedRows.includes(prospect.id)}
                      onChange={() => handleRowSelect(prospect.id)}
                    />
                  </td>
                  {visibleColumns.name && (
                    <td className="font-medium">{prospect.name}</td>
                  )}
                  {visibleColumns.email && (
                    <td className="text-muted-foreground">{prospect.email}</td>
                  )}
                  {visibleColumns.company && <td>{prospect.company}</td>}
                  {visibleColumns.title && (
                    <td className="text-muted-foreground">{prospect.title}</td>
                  )}
                  {visibleColumns.status && (
                    <td>
                      <Badge className={`status-badge ${statusColors[prospect.status as keyof typeof statusColors]}`}>
                        {prospect.status.charAt(0).toUpperCase() + prospect.status.slice(1)}
                      </Badge>
                    </td>
                  )}
                  {visibleColumns.assignee && <td>{prospect.assignee}</td>}
                  {visibleColumns.phone && <td>{prospect.phone}</td>}
                  {visibleColumns.source && <td>{prospect.source}</td>}
                  {visibleColumns.lastContact && (
                    <td>{formatDate(prospect.lastContact)}</td>
                  )}
                  {visibleColumns.value && (
                    <td className="font-medium">{formatValue(prospect.value)}</td>
                  )}
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Assign</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredProspects.length} of {mockProspects.length} prospects
        </span>
        <span>
          {selectedRows.length > 0 && `${selectedRows.length} selected`}
        </span>
      </div>
    </div>
  );
};