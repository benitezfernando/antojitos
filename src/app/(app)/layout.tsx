import { ViewTransition } from 'react';
import Sidebar from "@/components/Sidebar";
import "../../app/globals.css";
import "../(app)/antojitos-patch.css";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <ViewTransition>
          {children}
        </ViewTransition>
      </main>
    </div>
  );
}
