import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Prospects from "./pages/Prospects";
import Import from "./pages/Import";
import Reports from "./pages/Reports";
import DataSources from "./pages/DataSources";
import DataSourceTable from "./pages/DataSourceTable";
import ContactDetails from "./pages/ContactDetails";
import ProspectDetails from "./pages/ProspectDetails";
import AdminPanel from "./pages/AdminPanel";
import Settings from "./pages/Settings";
import MySalesLeads from "./pages/MySalesLeads";
import TeamStats from "./pages/TeamStats";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prospects" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Prospects />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prospects/assigned" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Prospects />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prospects/rappeler" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Prospects />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prospects/traites" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Prospects />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/import" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Import />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/datasources" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <DataSources />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/datasources/:tableName" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <DataSourceTable />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contact/:tableName/:contactId" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ContactDetails />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prospect/:encryptedEmail" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProspectDetails />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredPermission="access_admin_panel">
                  <Layout>
                    <AdminPanel />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-sales-leads" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <MySalesLeads />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/team-stats" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <TeamStats />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
