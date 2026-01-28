import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Send, Search, AlertTriangle } from 'lucide-react';
import { z } from 'zod';

const referralSchema = z.object({
  caseId: z.string().min(1, 'Please select a case'),
  toFacility: z.string().min(2, 'Destination facility is required'),
  reason: z.string().min(10, 'Reason for referral is required'),
  urgency: z.enum(['routine', 'urgent', 'emergency']),
  notes: z.string().optional(),
});

export default function ReferralForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [caseSearch, setCaseSearch] = useState('');

  const [formData, setFormData] = useState({
    caseId: searchParams.get('caseId') || '',
    toFacility: '',
    reason: '',
    urgency: 'routine' as 'routine' | 'urgent' | 'emergency',
    notes: '',
  });

  const { data: cases } = useQuery({
    queryKey: ['cases-for-referral', caseSearch],
    queryFn: async () => {
      let query = supabase
        .from('cases')
        .select(`
          id,
          case_number,
          chief_complaint,
          status,
          patients (first_name, last_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      const { data } = await query;
      
      if (caseSearch && data) {
        return data.filter(
          (c) =>
            c.case_number?.toLowerCase().includes(caseSearch.toLowerCase()) ||
            c.patients?.first_name?.toLowerCase().includes(caseSearch.toLowerCase()) ||
            c.patients?.last_name?.toLowerCase().includes(caseSearch.toLowerCase())
        );
      }

      return data || [];
    },
  });

  const generateReferralNumber = () => {
    const prefix = 'REF';
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${date}-${random}`;
  };

  const createReferral = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Create referral
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .insert({
          referral_number: generateReferralNumber(),
          case_id: data.caseId,
          from_facility: profile?.facility_name || 'Unknown PHU',
          to_facility: data.toFacility,
          referred_by: user?.id,
          reason: data.reason,
          urgency: data.urgency,
          notes: data.notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (referralError) throw referralError;

      // Update case status to referred
      const { error: caseError } = await supabase
        .from('cases')
        .update({ status: 'referred' })
        .eq('id', data.caseId);

      if (caseError) throw caseError;

      return referral;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast({
        title: 'Referral Created',
        description: 'The referral has been successfully created.',
      });
      navigate('/referrals');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = referralSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    createReferral.mutate(formData);
  };

  const facilities = [
    'Bo Government Hospital',
    'Connaught Hospital, Freetown',
    'Princess Christian Maternity Hospital',
    'Ola During Children\'s Hospital',
    'Kenema Government Hospital',
    'Makeni Government Hospital',
    'Port Loko Government Hospital',
    'Moyamba Government Hospital',
    'Pujehun Government Hospital',
    'Kailahun Government Hospital',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Referral</h1>
          <p className="text-muted-foreground">Refer a patient to another facility</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Case Selection */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Select Case
              </CardTitle>
              <CardDescription>Choose an active case to refer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search active cases..."
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={formData.caseId}
                  onValueChange={(value) => setFormData({ ...formData, caseId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a case" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {cases?.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.patients?.first_name} {caseItem.patients?.last_name} - {caseItem.case_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Referral Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Referral Details
              </CardTitle>
              <CardDescription>Destination and reason</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fromFacility">From Facility</Label>
                <Input
                  id="fromFacility"
                  value={profile?.facility_name || 'Current PHU'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toFacility">Destination Facility *</Label>
                <Select
                  value={formData.toFacility}
                  onValueChange={(value) => setFormData({ ...formData, toFacility: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {facilities.map((facility) => (
                      <SelectItem key={facility} value={facility}>
                        {facility}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Referral *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explain why this patient needs to be referred..."
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Urgency & Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Urgency Level
              </CardTitle>
              <CardDescription>Priority of the referral</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency *</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value: 'routine' | 'urgent' | 'emergency') =>
                    setFormData({ ...formData, urgency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="routine">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                        Routine
                      </span>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-warning" />
                        Urgent
                      </span>
                    </SelectItem>
                    <SelectItem value="emergency">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-destructive" />
                        Emergency
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information for the receiving facility..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createReferral.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createReferral.isPending ? 'Creating...' : 'Create Referral'}
          </Button>
        </div>
      </form>
    </div>
  );
}
