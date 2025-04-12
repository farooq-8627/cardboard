import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Mobile from "@/pages/mobile";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useEffect } from "react";

function Router() {
  const [location] = useLocation();
  
  // Don't render header/footer on mobile page
  const isMobilePage = location === "/mobile";
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isMobilePage && <Header />}
      
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/mobile" component={Mobile} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      {!isMobilePage && <Footer />}
    </div>
  );
}

function App() {
  // Prevent zoom on mobile devices to ensure consistent UI
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    return () => {
      if (meta) {
        meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
