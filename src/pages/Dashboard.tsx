import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import SalesDashboard from '@/components/dashboard/SalesDashboard';

const Dashboard = () => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userRole === 'admin') {
    return <AdminDashboard />;
  }

  if (userRole === 'manager') {
    return <ManagerDashboard />;
  }

  return <SalesDashboard />;
};

export default Dashboard;
