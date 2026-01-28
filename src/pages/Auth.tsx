import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Stethoscope, Shield, Users, Building } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['clinician', 'pharmacy', 'chc']),
  facilityName: z.string().optional(),
});

type AppRole = 'admin' | 'clinician' | 'pharmacy' | 'chc';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AppRole>('clinician');
  const [facilityName, setFacilityName] = useState('');

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
      if (!validation.success) {
        toast({
          title: 'Validation Error',
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }

      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in.',
        });
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = signupSchema.safeParse({
        email: signupEmail,
        password: signupPassword,
        fullName,
        role,
        facilityName,
      });

      if (!validation.success) {
        toast({
          title: 'Validation Error',
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }

      const { error } = await signUp(signupEmail, signupPassword, fullName, role, facilityName);
      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Account Exists',
            description: 'An account with this email already exists. Please login instead.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Signup Failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Account Created!',
          description: 'Welcome to the IMNCI system.',
        });
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roleIcons = {
    clinician: <Stethoscope className="h-4 w-4" />,
    pharmacy: <Building className="h-4 w-4" />,
    chc: <Users className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-healthcare relative overflow-hidden">
        <div className="absolute inset-0 bg-healthcare-navy/20" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-primary-foreground">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center mb-8">
            <Shield className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">IMNCI System</h1>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Integrated Management of Neonatal and Childhood Illness
          </p>
          <p className="text-primary-foreground/80 max-w-md">
            A comprehensive database management platform for Peripheral Health Units in Sierra Leone. 
            Streamline patient care, manage referrals, and improve healthcare outcomes.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="bg-primary-foreground/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-1">For Clinicians</h3>
              <p className="text-sm text-primary-foreground/80">Manage patients & cases</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-1">For Pharmacies</h3>
              <p className="text-sm text-primary-foreground/80">Track medications</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-1">For CHCs</h3>
              <p className="text-sm text-primary-foreground/80">Handle referrals</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-semibold mb-1">Secure Access</h3>
              <p className="text-sm text-primary-foreground/80">Role-based permissions</p>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary-foreground/5 rounded-full" />
        <div className="absolute top-20 -right-10 w-40 h-40 bg-primary-foreground/5 rounded-full" />
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-xl gradient-healthcare mx-auto flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">IMNCI System</h1>
            <p className="text-muted-foreground">Sierra Leone PHU Platform</p>
          </div>

          <Card className="shadow-healthcare border-border">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Welcome</CardTitle>
              <CardDescription>Sign in to your account or create a new one</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password (min 6 characters)"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-role">Role</Label>
                      <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="clinician">
                            <span className="flex items-center gap-2">
                              <Stethoscope className="h-4 w-4" />
                              Clinician
                            </span>
                          </SelectItem>
                          <SelectItem value="pharmacy">
                            <span className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Pharmacy
                            </span>
                          </SelectItem>
                          <SelectItem value="chc">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Community Health Center
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-facility">Facility Name (Optional)</Label>
                      <Input
                        id="signup-facility"
                        type="text"
                        placeholder="Enter facility name"
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Ministry of Health - Sierra Leone
          </p>
        </div>
      </div>
    </div>
  );
}
