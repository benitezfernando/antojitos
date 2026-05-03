import { ViewTransition } from 'react';
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <ViewTransition>
            {children}
          </ViewTransition>
        </main>
      </div>
    </ToastProvider>
  );
}
