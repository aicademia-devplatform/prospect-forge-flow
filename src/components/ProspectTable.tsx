import React, { useState, useMemo, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AssignedProspect {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  status: string;
  assignee: string;
  phone?: string;
  source: string;
  lastContact?: string;
  value?: number;
  sourceTable: string;
  customTableName?: string;
}

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
  active: 'status-new',
  'Not Contacted': 'status-new',
  'Replied': 'status-contacted',
  'Bounced': 'status-qualified',
  'Engaged': 'status-qualified'
};

export const ProspectTable = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible }), {} as Record<string, boolean>)
  );
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [prospects, setProspects] = useState<AssignedProspect[]>([]);
  const [loading, setLoading] = useState(true);

  const assignees = [...new Set(prospects.map(p => p.assignee))];
  const sources = [...new Set(prospects.map(p => p.source))];

  // Fetch assigned prospects
  useEffect(() => {
    const fetchAssignedProspects = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Get all assignments for the current user
        const { data: assignments, error: assignError } = await supabase
          .from('sales_assignments')
          .select('*')
          .eq('sales_user_id', user.id)
          .eq('status', 'active');

        if (assignError) throw assignError;

        const assignedProspects: AssignedProspect[] = [];

        for (const assignment of assignments || []) {
          let prospectData: any = null;
          
          if (assignment.source_table === 'apollo_contacts') {
            const { data } = await supabase
              .from('apollo_contacts')
              .select('*')
              .eq('id', assignment.source_id)
              .single();
            prospectData = data;
          } else if (assignment.source_table === 'crm_contacts') {
            const { data } = await supabase
              .from('crm_contacts')
              .select('*')
              .eq('id', parseInt(assignment.source_id))
              .single();
            prospectData = data;
          }

          if (prospectData) {
            assignedProspects.push({
              id: assignment.id,
              name: prospectData.first_name && prospectData.last_name 
                ? `${prospectData.first_name} ${prospectData.last_name}`
                : prospectData.firstname && prospectData.name
                ? `${prospectData.firstname} ${prospectData.name}`
                : prospectData.name || prospectData.email,
              email: prospectData.email,
              company: prospectData.company || 'N/A',
              title: prospectData.title || prospectData.linkedin_function || 'N/A',
              status: prospectData.apollo_status || prospectData.zoho_status || 'new',
              assignee: 'You',
              phone: prospectData.mobile_phone || prospectData.work_direct_phone || prospectData.mobile || prospectData.tel || 'N/A',
              source: assignment.source_table === 'apollo_contacts' ? 'Apollo' : 'CRM',
              lastContact: prospectData.last_contacted || prospectData.created_at,
              sourceTable: assignment.source_table,
              customTableName: assignment.custom_table_name
            });
          }
        }

        setProspects(assignedProspects);
      } catch (error) {
        console.error('Error fetching assigned prospects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedProspects();
  }, [user]);

  const filteredProspects = useMemo(() => {
    return prospects.filter(prospect => {
      const matchesSearch = 
        prospect.name.toLowerCase().includes(search.toLowerCase()) ||
        prospect.email.toLowerCase().includes(search.toLowerCase()) ||
        prospect.company.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || prospect.status === statusFilter;
      const matchesAssignee = assigneeFilter === 'all' || prospect.assignee === assigneeFilter;
      const matchesSource = sourceFilter === 'all' || prospect.source === sourceFilter;
      
      return matchesSearch && matchesStatus && matchesAssignee && matchesSource;
    });
  }, [prospects, search, statusFilter, assigneeFilter, sourceFilter]);

  const handleRowSelect = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const formatValue = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="p-4">Loading your assigned prospects...</div>;
  }

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

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map(source => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
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
          Showing {filteredProspects.length} of {prospects.length} assigned prospects
          {sources.length > 1 && ` from ${sources.length} different sources`}
        </span>
        <span>
          {selectedRows.length > 0 && `${selectedRows.length} selected`}
        </span>
      </div>
    </div>
  );
};