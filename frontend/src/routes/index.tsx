import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MessageSquare, LayoutDashboard, QrCode, ArrowRight, Bot, Zap, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WASI — Your Restaurant's AI Receptionist" },
      { name: "description", content: "Meet WASI, the AI Receptionist that takes fast food orders over WhatsApp." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFF7F0] font-sans antialiased text-slate-800 selection:bg-orange-200 selection:text-orange-900 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20">W</div>
            <span className="font-black text-2xl tracking-tight text-slate-800">WASI</span>
          </div>
          <Link to="/admin" className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 hover:scale-105 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2">
            Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-20 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* LEFT COPY */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-bold text-sm">
            <Zap className="w-4 h-4 fill-orange-500" />
            The Future of Fast Food Ordering
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Meet WASI,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
              Your AI Receptionist.
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-600 font-medium leading-relaxed max-w-lg">
            Say goodbye to missed calls and confused orders. WASI takes customer orders natively on WhatsApp with human-like understanding and instant synchronization to your kitchen.
          </p>

          <div className="flex items-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <ShieldCheck className="w-5 h-5 text-green-500" /> 24/7 Availability
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Bot className="w-5 h-5 text-blue-500" /> Natural Language
            </div>
          </div>
        </motion.div>

        {/* RIGHT QR CODE & DEMO */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative"
        >
          {/* Decorative background blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-orange-200 to-amber-100 rounded-full blur-3xl opacity-50 -z-10 animate-pulse duration-[3000ms]"></div>
          
          <div className="bg-white rounded-[40px] p-8 shadow-[0_20px_60px_rgb(0,0,0,0.05)] border border-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] -z-10"></div>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 mx-auto flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-[#25D366]" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">Scan to Order (Demo)</h3>
              <p className="text-sm font-medium text-slate-500 mt-2">Open your phone camera and scan the code below to chat with WASI instantly on WhatsApp.</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center justify-center relative">
              {/* Pulse effect behind QR */}
              <div className="absolute inset-0 border-2 border-[#25D366] rounded-[32px] animate-[wasi-pulse_2s_infinite]"></div>
              
              <img 
                src="/qr-code.jpeg" 
                alt="WASI WhatsApp QR Code" 
                className="w-56 h-56 rounded-2xl shadow-sm border border-slate-200 object-cover z-10 bg-white" 
              />
            </div>
          </div>
        </motion.div>

      </main>

      {/* HOW IT WORKS */}
      <section className="bg-white py-24 border-t border-slate-100 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">How it works</h2>
            <p className="text-lg text-slate-500 font-medium">A seamless experience for both your customers and your kitchen staff.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 rounded-[32px] bg-[#FFF7F0] border border-orange-100"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-200 flex items-center justify-center mb-6">
                <QrCode className="w-6 h-6 text-orange-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">1. Customer Scans</h3>
              <p className="text-slate-600 font-medium">Customers scan the QR code to instantly open a WhatsApp chat with your restaurant.</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 rounded-[32px] bg-[#FFF7F0] border border-orange-100"
            >
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/20 flex items-center justify-center mb-6">
                <Bot className="w-6 h-6 text-[#25D366]" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">2. AI Takes Order</h3>
              <p className="text-slate-600 font-medium">WASI chats naturally, answers menu questions, and finalizes the food order seamlessly.</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 rounded-[32px] bg-[#FFF7F0] border border-orange-100"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                <LayoutDashboard className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">3. Instant Dashboard</h3>
              <p className="text-slate-600 font-medium">The order instantly pops up on the Receptionist Dashboard for human confirmation.</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* FOOTER */}
      <footer className="bg-slate-50 py-8 text-center text-slate-400 font-medium text-sm border-t border-slate-100">
        &copy; {new Date().getFullYear()} WASI AI. Built for the future of restaurants.
      </footer>
    </div>
  );
}
