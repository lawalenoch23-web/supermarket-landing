import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Manager from "./pages/Manager";
import TrackOrder from './pages/TrackOrder';
import Contact from './pages/ContactUs';
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/manager" component={Manager} />
      <Route component={NotFound} />
      <Route path="/track" element={<TrackOrder />} />
      <Route path="/contact" element={<ContactUs />} />
    </Switch>
  );
}
<a 
  href="https://wa.me/+2349160137310" 
  target="_blank" 
  rel="noreferrer"
  className="fixed bottom-6 right-6 bg-green-500 p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
>
  <MessageCircle size={24} className="text-white" />
</a>

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;