import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Send, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type ReferralStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export default function Referrals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReferralStatus>('all');
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: 'accept' | 'complete' | 'cancel' | null }>({
    open: false,
    action: null,
  });

  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('referrals')
        .select(`
          *,
          cases (
            case_number,
            chief_complaint,
            patients (first_name, last_name, registration_number)
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (searchTerm) {
        return data?.filter(
          (r) =>
            r.referral_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.cases?.patients?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.cases?.patients?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return data;
    },
  });

  const updateReferralStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === 'accepted' || status === 'in_progress') {
        updateData.accepted_by = user?.id;
      }

      const { error } = await supabase
        .from('referrals')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-referrals'] });
      toast({
        title: 'Referral Updated',
        description: 'The referral status has been updated.',
      });
      setActionDialog({ open: false, action: null });
      setSelectedReferral(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode }> = {
      pending: { className: 'bg-warning/20 text-warning border-warning/30', icon: <Clock className="h-3 w-3" /> },
      accepted: { className: 'bg-info/20 text-info border-info/30', icon: <CheckCircle className="h-3 w-3" /> },
      in_progress: { className: 'bg-primary/20 text-primary border-primary/30', icon: <Send className="h-3 w-3" /> },
      completed: { className: 'bg-success/20 text-success border-success/30', icon: <CheckCircle className="h-3 w-3" /> },
      cancelled: { className: 'bg-destructive/20 text-destructive border-destructive/30', icon: <XCircle className="h-3 w-3" /> },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants: Record<string, string> = {
      routine: 'bg-muted text-muted-foreground',
      urgent: 'bg-warning/20 text-warning',
      emergency: 'bg-destructive/20 text-destructive',
    };
    return <Badge className={variants[urgency] || variants.routine}>{urgency}</Badge>;
  };

  const statusCounts = {
    all: referrals?.length || 0,
    pending: referrals?.filter((r) => r.status === 'pending').length || 0,
    accepted: referrals?.filter((r) => r.status === 'accepted').length || 0,
    in_progress: referrals?.filter((r) => r.status === 'in_progress').length || 0,
    completed: referrals?.filter((r) => r.status === 'completed').length || 0,
  };

  const handleAction = (referral: any, action: 'accept' | 'complete' | 'cancel') => {
    setSelectedReferral(referral);
    setActionDialog({ open: true, action });
  };

  const confirmAction = () => {
    if (!selectedReferral || !actionDialog.action) return;

    const statusMap = {
      accept: 'accepted',
      complete: 'completed',
      cancel: 'cancelled',
    };

    updateReferralStatus.mutate({
      id: selectedReferral.id,
      status: statusMap[actionDialog.action],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Referrals</h1>
          <p className="text-muted-foreground">Manage patient referrals between facilities</p>
        </div>
        {(role === 'clinician' || role === 'admin') && (
          <Button asChild>
            <Link to="/referrals/new">
              <Plus className="h-4 w-4 mr-2" />
              New Referral
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by referral number or patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Records</CardTitle>
          <CardDescription>All referrals in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | ReferralStatus)}>
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({statusCounts.accepted})</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress ({statusCounts.in_progress})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse-subtle text-muted-foreground">Loading...</div>
                </div>
              ) : referrals && referrals.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referral No.</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell className="font-mono text-sm">
                            {referral.referral_number}
                          </TableCell>
                          <TableCell className="font-medium">
                            {referral.cases?.patients?.first_name} {referral.cases?.patients?.last_name}
                          </TableCell>
                          <TableCell>{referral.from_facility}</TableCell>
                          <TableCell>{referral.to_facility}</TableCell>
                          <TableCell>{getUrgencyBadge(referral.urgency)}</TableCell>
                          <TableCell>{getStatusBadge(referral.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(referral.created_at), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/referrals/${referral.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              {referral.status === 'pending' && (role === 'chc' || role === 'admin') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-success hover:text-success"
                                  onClick={() => handleAction(referral, 'accept')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {(referral.status === 'accepted' || referral.status === 'in_progress') &&
                                (role === 'chc' || role === 'admin') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary"
                                    onClick={() => handleAction(referral, 'complete')}
                                  >
                                    <CheckCircle className="h-4 w-4" />
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
                  <Send className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No referrals found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No referrals have been created yet'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ open, action: null })}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'accept' && 'Accept Referral'}
              {actionDialog.action === 'complete' && 'Complete Referral'}
              {actionDialog.action === 'cancel' && 'Cancel Referral'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'accept' &&
                'Are you sure you want to accept this referral? The patient will be transferred to your facility.'}
              {actionDialog.action === 'complete' &&
                'Mark this referral as completed? This indicates the patient has been successfully treated.'}
              {actionDialog.action === 'cancel' && 'Are you sure you want to cancel this referral?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, action: null })}>
              Cancel
            </Button>
            <Button onClick={confirmAction} disabled={updateReferralStatus.isPending}>
              {updateReferralStatus.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
