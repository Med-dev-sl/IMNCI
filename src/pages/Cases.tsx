import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, FileText, Eye, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

type CaseStatus = 'active' | 'referred' | 'resolved' | 'discharged';

export default function Cases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CaseStatus>('all');

  const { data: cases, isLoading } = useQuery({
    queryKey: ['cases', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('cases')
        .select(`
          *,
          patients (first_name, last_name, registration_number)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (searchTerm) {
        return data?.filter(
          (c) =>
            c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.patients?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.patients?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-success/20 text-success border-success/30',
      referred: 'bg-warning/20 text-warning border-warning/30',
      resolved: 'bg-primary/20 text-primary border-primary/30',
      discharged: 'bg-muted text-muted-foreground border-muted',
    };
    return (
      <Badge variant="outline" className={variants[status] || variants.active}>
        {status}
      </Badge>
    );
  };

  const statusCounts = {
    all: cases?.length || 0,
    active: cases?.filter((c) => c.status === 'active').length || 0,
    referred: cases?.filter((c) => c.status === 'referred').length || 0,
    resolved: cases?.filter((c) => c.status === 'resolved').length || 0,
    discharged: cases?.filter((c) => c.status === 'discharged').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cases</h1>
          <p className="text-muted-foreground">Manage IMNCI patient cases</p>
        </div>
        <Button asChild>
          <Link to="/cases/new">
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by case number or patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases with Status Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Case Records</CardTitle>
          <CardDescription>All IMNCI cases in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | CaseStatus)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="active">Active ({statusCounts.active})</TabsTrigger>
              <TabsTrigger value="referred">Referred ({statusCounts.referred})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({statusCounts.resolved})</TabsTrigger>
              <TabsTrigger value="discharged">Discharged ({statusCounts.discharged})</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse-subtle text-muted-foreground">Loading...</div>
                </div>
              ) : cases && cases.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case No.</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Chief Complaint</TableHead>
                        <TableHead>Classification</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((caseItem) => (
                        <TableRow key={caseItem.id}>
                          <TableCell className="font-mono text-sm">
                            {caseItem.case_number}
                          </TableCell>
                          <TableCell className="font-medium">
                            {caseItem.patients?.first_name} {caseItem.patients?.last_name}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {caseItem.chief_complaint}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{caseItem.classification || 'Pending'}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(caseItem.created_at), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/cases/${caseItem.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              {caseItem.status === 'active' && (
                                <Button variant="ghost" size="sm" asChild>
                                  <Link to={`/referrals/new?caseId=${caseItem.id}`}>
                                    <Send className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No cases found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Start by creating a new case'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button asChild>
                      <Link to="/cases/new">
                        <Plus className="h-4 w-4 mr-2" />
                        New Case
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
