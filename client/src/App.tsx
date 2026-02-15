  import { Routes, Route } from "react-router-dom"; // Use Routes, not Route, for the wrapper
  import { MessageCircle } from "lucide-react";
  import Home from "./pages/Home";
  import TrackOrder from "./pages/TrackOrder";
  import ContactUs from "./pages/ContactUs";
  import Manager from "./pages/Manager";

  export default function App() {
    return (
      <div className="min-h-screen bg-black">
        <Routes> {/* This MUST be Routes with an 's' */}
          <Route path="/" element={<Home />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/manager" element={<Manager />} />
        </Routes>

        {/* WhatsApp Floating Button */}
        <a 
          href="https://wa.me/+2349160137310" 
          className="fixed bottom-6 right-6 bg-green-500 p-4 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
        >
          <MessageCircle size={24} className="text-white" />
        </a>
      </div>
    );
  }