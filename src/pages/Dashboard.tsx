import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Send, 
  TrendingUp, 
  AlertCircle, 
  Clock,
  Plus,
  ArrowRight,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { profile, role } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [patientsRes, casesRes, referralsRes, pendingReferralsRes] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('cases').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('referrals').select('id', { count: 'exact', head: true }),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      return {
        totalPatients: patientsRes.count || 0,
        activeCases: casesRes.count || 0,
        totalReferrals: referralsRes.count || 0,
        pendingReferrals: pendingReferralsRes.count || 0,
      };
    },
  });

  const { data: recentCases } = useQuery({
    queryKey: ['recent-cases'],
    queryFn: async () => {
      const { data } = await supabase
        .from('cases')
        .select(`
          *,
          patients (first_name, last_name, registration_number)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: pendingReferrals } = useQuery({
    queryKey: ['pending-referrals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('referrals')
        .select(`
          *,
          cases (
            case_number,
            patients (first_name, last_name)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/patients',
    },
    {
      title: 'Active Cases',
      value: stats?.activeCases || 0,
      icon: FileText,
      color: 'text-success',
      bgColor: 'bg-success/10',
      link: '/cases',
    },
    {
      title: 'Total Referrals',
      value: stats?.totalReferrals || 0,
      icon: Send,
      color: 'text-info',
      bgColor: 'bg-info/10',
      link: '/referrals',
    },
    {
      title: 'Pending Referrals',
      value: stats?.pendingReferrals || 0,
      icon: AlertCircle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      link: '/referrals',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      active: { variant: 'default', className: 'bg-success text-success-foreground' },
      referred: { variant: 'secondary', className: 'bg-warning text-warning-foreground' },
      resolved: { variant: 'outline', className: 'border-success text-success' },
      discharged: { variant: 'outline', className: 'border-muted-foreground text-muted-foreground' },
      pending: { variant: 'secondary', className: 'bg-warning text-warning-foreground' },
    };
    const config = variants[status] || variants.active;
    return <Badge className={config.className}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your IMNCI dashboard
          </p>
        </div>
        {(role === 'clinician' || role === 'admin') && (
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/patients/new">
                <Plus className="h-4 w-4 mr-2" />
                New Patient
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Cases</CardTitle>
              <CardDescription>Latest patient cases</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/cases">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentCases && recentCases.length > 0 ? (
              <div className="space-y-4">
                {recentCases.map((caseItem: any) => (
                  <div
                    key={caseItem.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {caseItem.patients?.first_name} {caseItem.patients?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {caseItem.case_number} • {caseItem.chief_complaint?.substring(0, 30)}...
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(caseItem.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No cases yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Referrals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pending Referrals</CardTitle>
              <CardDescription>Referrals awaiting action</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/referrals">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingReferrals && pendingReferrals.length > 0 ? (
              <div className="space-y-4">
                {pendingReferrals.map((referral: any) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-warning/10">
                        <Clock className="h-4 w-4 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {referral.cases?.patients?.first_name} {referral.cases?.patients?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {referral.from_facility} → {referral.to_facility}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-warning/20 text-warning border-warning/30">
                      {referral.urgency}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending referrals</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks for your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(role === 'clinician' || role === 'admin') && (
              <>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <Link to="/patients/new">
                    <Users className="h-5 w-5" />
                    <span>Register Patient</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <Link to="/cases/new">
                    <FileText className="h-5 w-5" />
                    <span>New Case</span>
                  </Link>
                </Button>
              </>
            )}
            {(role === 'clinician' || role === 'admin' || role === 'chc') && (
              <>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <Link to="/referrals">
                    <Send className="h-5 w-5" />
                    <span>View Referrals</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                  <Link to="/patients">
                    <TrendingUp className="h-5 w-5" />
                    <span>Patient Records</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
