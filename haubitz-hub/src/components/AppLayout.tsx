import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

export const AppLayout = () => {
  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 lg:ml-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
