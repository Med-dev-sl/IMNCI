import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientForm from "./pages/PatientForm";
import Cases from "./pages/Cases";
import CaseForm from "./pages/CaseForm";
import Referrals from "./pages/Referrals";
import ReferralForm from "./pages/ReferralForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            <Route
              path="/patients"
              element={
                <AppLayout>
                  <Patients />
                </AppLayout>
              }
            />
            <Route
              path="/patients/new"
              element={
                <AppLayout>
                  <PatientForm />
                </AppLayout>
              }
            />
            <Route
              path="/cases"
              element={
                <AppLayout>
                  <Cases />
                </AppLayout>
              }
            />
            <Route
              path="/cases/new"
              element={
                <AppLayout>
                  <CaseForm />
                </AppLayout>
              }
            />
            <Route
              path="/referrals"
              element={
                <AppLayout>
                  <Referrals />
                </AppLayout>
              }
            />
            <Route
              path="/referrals/new"
              element={
                <AppLayout>
                  <ReferralForm />
                </AppLayout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
