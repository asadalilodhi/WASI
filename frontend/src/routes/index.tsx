import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Funnel,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Send,
  X,
  Check,
  Sparkles,
  ChevronRight,
  Clock,
  LayoutDashboard
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";

import { supabase } from '../lib/supabase';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WASI Receptionist Dashboard" },
      { name: "description", content: "Real-time AI-powered food ordering operations console for Pakistani fast food restaurants." },
      { property: "og:title", content: "WASI Receptionist Dashboard" },
      { property: "og:description", content: "Live order queue, customer details, and one-click confirmations for restaurant receptionists." },
    ],
  }),
  component: Dashboard,
});

type OrderStatus = "pending" | "confirmed" | "rejected";
type OrderType = "DELIVERY" | "TAKEAWAY";

interface OrderItem {
  qty: number;
  name: string;
  notes?: string;
  price: number;
  variant?: string;
}

interface Order {
  id: string;
  customer: string;
  phone: string;
  address?: string;
  type: OrderType;
  payment: string;
  items: OrderItem[];
  deliveryFee: number;
  arrivedMinutesAgo: number;
  status: OrderStatus;
}

const initialOrders: Order[] = [];

const rejectReasons = [
  { value: "stock", label: "🚫 Item out of stock" },
  { value: "address", label: "📍 Address undeliverable" },
  { value: "duplicate", label: "📋 Duplicate order" },
  { value: "noresp", label: "📵 No response from customer" },
  { value: "other", label: "✏️ Other" },
];

const quickReplyCategories = [
  {
    label: "📦 Order Issues",
    replies: [
      "Aap ka order mil gaya, thodi der mein confirm karta hoon.",
      "Sorry, ye item abhi available nahi hai. Koi alternate batayein?",
      "Aap ka order tayyar ho raha hai, 15 minute mein nikal jayega.",
    ],
  },
  {
    label: "📍 Address & Delivery",
    replies: [
      "Address confirm karein: house number aur block?",
      "Rider 10 minute mein pohanch jayega inshallah.",
      "Rider call kar raha hai, please pick karein.",
    ],
  },
  {
    label: "💳 Payment",
    replies: [
      "Payment cash on delivery hai, sahi hai?",
      "Card machine rider ke paas hai, available hai.",
      "Online payment link bhej raha hoon.",
    ],
  },
];

const quickPills = ["Out of stock item", "Wrong address?", "On its way!", "Confirm payment", "Rider dispatched"];

function orderTotal(o: Order) {
  return o.items.reduce((s, i) => s + i.price, 0) + o.deliveryFee;
}

const BACKEND_URL = "";

function Dashboard() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedId, setSelectedId] = useState<string>(initialOrders[0]?.id || "");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [activePill, setActivePill] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("stock");
  const [rejectOther, setRejectOther] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const [showRemove, setShowRemove] = useState(false);
  
  // AI Insights State
  const [showInsights, setShowInsights] = useState(false);
  const [insightsReport, setInsightsReport] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (!data) return;
        
        const parsedOrders: Order[] = data.map((o: any) => {
          let uiStatus: OrderStatus = "pending";
          if (o.status === "CONFIRMED") uiStatus = "confirmed";
          if (o.status === "REVISION_NEEDED") uiStatus = "rejected";
          
          return {
            id: o.id,
            customer: o.customer || "Unknown",
            phone: o.phone || o.id,
            address: o.address,
            type: o.type || "DELIVERY",
            payment: o.payment || "COD",
            items: o.items || [],
            deliveryFee: o.deliveryFee || 0,
            arrivedMinutesAgo: o.arrivedMinutesAgo || 0,
            status: uiStatus
          };
        });
        
        setOrders(parsedOrders);
        if (!selectedId && parsedOrders.length > 0) {
           setSelectedId(parsedOrders[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch orders from Supabase", e);
      }
    };
    
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const selected = useMemo(() => orders.find((o) => o.id === selectedId), [orders, selectedId]);

  const stats = useMemo(() => {
    const total = orders.length;
    const confirmed = orders.filter((o) => o.status === "confirmed").length;
    const rejected = orders.filter((o) => o.status === "rejected").length;
    return { total, confirmed, rejected };
  }, [orders]);

  async function handleConfirm() {
    if (!selected) return;
    try {
      await supabase.from('orders').update({ status: 'CONFIRMED' }).eq('id', selected.id);
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...o, status: "confirmed" } : o)));
      setShowRemove(false);
      setTimeout(() => setShowRemove(true), 3000);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleReject() {
    if (!selected) return;
    try {
      const reasonText = rejectReason === "other" ? rejectOther : rejectReasons.find(r => r.value === rejectReason)?.label;
      const finalFeedback = notes ? `${reasonText} - Notes: ${notes}` : reasonText;
      
      await supabase.from('orders').update({ status: 'REVISION_NEEDED', notes: finalFeedback }).eq('id', selected.id);
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...o, status: "rejected" } : o)));
      setRejectOpen(false);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSendNote(noteText: string) {
    if (!selected) return;
    try {
      await supabase.from('orders').update({ notes: noteText }).eq('id', selected.id);
      setNotes(""); // clear note text box
      setActivePill(null);
    } catch (e) {
      console.error(e);
    }
  }

  function pickPill(p: string) {
    setActivePill(p);
    setNotes((n) => (n ? n + "\n" : "") + p);
  }

  async function fetchInsights() {
    setShowInsights(true);
    setLoadingInsights(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/analytics`, { headers: { "ngrok-skip-browser-warning": "true" } });
      const data = await res.json();
      setInsightsReport(data.report || "Failed to generate report.");
    } catch (e) {
      setInsightsReport("An error occurred while fetching insights.");
    }
    setLoadingInsights(false);
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col font-sans antialiased text-slate-800 bg-[#FFF7F0]">
      {/* TOP NAV */}
      <header className="h-[72px] bg-white/80 backdrop-blur-md text-slate-800 flex items-center justify-between px-6 shrink-0 border-b border-orange-100 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#1da851] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-green-500/20">W</div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight leading-tight">WASI</span>
            <span className="text-orange-500 text-[11px] font-bold tracking-widest uppercase">Admin Dashboard</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 bg-orange-50/80 px-4 py-2 rounded-full border border-orange-100">
            <Clock className="h-4 w-4 text-orange-400" />
            <span className="font-bold text-sm text-slate-700">{now ? now.toLocaleTimeString("en-GB", {hour: '2-digit', minute:'2-digit'}) : ""}</span>
            <span className="w-1 h-1 rounded-full bg-orange-300 mx-1" />
            <span className="text-slate-500 text-sm font-medium">{now ? now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : ""}</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button 
            onClick={fetchInsights}
            className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white rounded-full text-sm font-bold shadow-md shadow-orange-500/20 transition-all hover:scale-105"
          >
            <Sparkles className="h-4 w-4 group-hover:animate-pulse" /> Insights
          </button>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]" />
            </span>
            <span className="text-slate-700 text-sm font-bold tracking-wide">Live</span>
          </div>
          <button className="relative p-2.5 rounded-full bg-white border border-slate-200 hover:bg-orange-50 hover:border-orange-200 transition-all" aria-label="Notifications">
            <Bell className="h-5 w-5 text-slate-600" />
            {orders.some(o => o.status === "pending") && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
            )}
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm font-bold border-2 border-white shadow-sm group-hover:scale-105 transition-transform">AR</div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight">Ahmad Raza</p>
              <p className="text-xs text-slate-500 font-medium">Receptionist</p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* LEFT SIDEBAR: ORDER QUEUE */}
        <aside className="w-[340px] flex flex-col h-full shrink-0">
          <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-slate-50 bg-white z-10 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-orange-400" />
                  <h2 className="text-sm font-black text-slate-800 tracking-wide uppercase">Order Queue</h2>
                </div>
                <span className="text-xs font-bold bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-100">
                  {orders.filter((o) => o.status === "pending").length} active
                </span>
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-50 rounded-2xl p-2.5 text-center border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total</p>
                  <p className="text-xl font-black text-slate-700 leading-tight mt-0.5">{stats.total}</p>
                </div>
                <div className="bg-green-50/50 rounded-2xl p-2.5 text-center border border-green-100/50">
                  <p className="text-[10px] text-green-500 font-black uppercase tracking-wider">Done</p>
                  <p className="text-xl font-black text-green-600 leading-tight mt-0.5">{stats.confirmed}</p>
                </div>
                <div className="bg-red-50/50 rounded-2xl p-2.5 text-center border border-red-100/50">
                  <p className="text-[10px] text-red-500 font-black uppercase tracking-wider">Rej</p>
                  <p className="text-xl font-black text-red-600 leading-tight mt-0.5">{stats.rejected}</p>
                </div>
              </div>

              <div className="relative">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search orders..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-slate-400 text-slate-700" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-[#FCFAFA]">
              {orders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-60">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                  </div>
                  <p className="font-black text-slate-500 text-lg">Queue is empty</p>
                  <p className="text-sm text-slate-400 mt-1 font-medium">New AI orders will drop in here.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {orders.map((o) => {
                    const isSelected = o.id === selectedId;
                    
                    let statusColor = "bg-amber-400";
                    if(o.status === "confirmed") statusColor = "bg-[#25D366]";
                    if(o.status === "rejected") statusColor = "bg-red-500";

                    let cardStyle = "bg-white border-slate-200 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5";
                    if (isSelected) cardStyle = "bg-orange-50/30 border-orange-300 shadow-[0_8px_30px_rgba(249,115,22,0.12)] ring-1 ring-orange-400/20";
                    
                    return (
                      <motion.button
                        layout
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        key={o.id}
                        onClick={() => { setSelectedId(o.id); setShowRemove(false); setNotes(""); setActivePill(null); }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${cardStyle}`}
                      >
                        {/* Left color bar indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusColor} opacity-80 group-hover:opacity-100 transition-opacity`} />
                        
                        <div className="flex items-start justify-between gap-2 pl-2">
                          <span className="font-black text-sm text-slate-700 truncate group-hover:text-orange-600 transition-colors">{o.customer}</span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${o.arrivedMinutesAgo > 5 ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-50 text-slate-500 border border-slate-100"}`}>
                            {o.arrivedMinutesAgo}m ago
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 pl-2">
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" />{o.items.reduce((s, i) => s + i.qty, 0)} items</span>
                          <span className="text-sm font-black text-slate-700">Rs. {orderTotal(o).toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 pl-2 flex-wrap">
                          <span className={`text-[9px] uppercase font-black px-2.5 py-1 rounded-md ${o.type === "DELIVERY" ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"}`}>
                            {o.type}
                          </span>
                          <span className="text-[9px] uppercase font-black px-2.5 py-1 rounded-md bg-slate-100 text-slate-500">
                            {o.payment}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN: ORDER DETAILS */}
        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center bg-white/40 rounded-[32px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-orange-100 to-amber-50 shadow-xl shadow-orange-500/10 flex items-center justify-center mb-6">
                  <Sparkles className="h-10 w-10 text-orange-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-700">Ready for Action</h3>
                <p className="text-slate-400 font-medium mt-2">Select an order from the queue to review and confirm.</p>
              </motion.div>
            ) : (
              <motion.div 
                key={selected.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full overflow-y-auto scrollbar-thin pr-2 pb-10"
              >
                <div className="max-w-4xl mx-auto space-y-4">
                  
                  {/* Header Card */}
                  <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-6 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 flex items-center justify-center shadow-inner">
                        <span className="text-xl font-black text-orange-500">#{selected.id.substring(0, 4)}</span>
                      </div>
                      <div>
                        <h1 className="font-black text-2xl text-slate-800 tracking-tight">Order Details</h1>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                          <Clock className="h-3.5 w-3.5 text-orange-400" /> Arrived {selected.arrivedMinutesAgo} min ago
                        </p>
                      </div>
                    </div>
                    <div className="relative z-10">
                      {selected.status === "pending" && <span className="text-sm font-black px-4 py-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/50 flex items-center gap-2 shadow-sm"><div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"/> PENDING REVIEW</span>}
                      {selected.status === "confirmed" && <span className="text-sm font-black px-4 py-2.5 rounded-xl bg-green-50 text-green-600 border border-green-200/50 flex items-center gap-2 shadow-sm"><Check className="h-4 w-4"/> CONFIRMED</span>}
                      {selected.status === "rejected" && <span className="text-sm font-black px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200/50 flex items-center gap-2 shadow-sm"><X className="h-4 w-4"/> REJECTED</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column: Customer & Delivery */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-6">
                        <p className="text-[10px] font-black text-orange-400 tracking-widest uppercase mb-4">Customer Info</p>
                        <div className="flex items-center gap-4 mb-5">
                          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xl shadow-inner">
                            {selected.customer.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-lg text-slate-800 leading-tight">{selected.customer}</p>
                            <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                              <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                              {selected.phone}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4 mt-6 pt-5 border-t border-slate-50">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Order Type</p>
                            <p className="font-bold text-slate-700 mt-1">{selected.type === "DELIVERY" ? "🚚 Delivery" : "🛍️ Takeaway"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Payment</p>
                            <p className="font-bold text-slate-700 mt-1 flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-[#25D366]" /> {selected.payment}
                            </p>
                          </div>
                          {selected.address && (
                            <div className="pt-2">
                              <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2">Address</p>
                              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                                <MapPin className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                                <p className="text-sm font-semibold text-slate-600 leading-snug">{selected.address}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Receptionist Notes */}
                      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-6">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] font-black text-orange-400 tracking-widest uppercase">Communication</p>
                        </div>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add notes for the AI to tell the customer..."
                          className="min-h-[80px] resize-none rounded-2xl border-slate-200 focus:ring-orange-400 bg-slate-50/50 text-sm font-medium placeholder:text-slate-400 shadow-inner"
                        />
                        <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-thin pb-2">
                          {quickPills.map((p) => (
                            <button
                              key={p}
                              onClick={() => pickPill(p)}
                              className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all ${activePill === p ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={() => { if(notes) handleSendNote(notes); }}
                          disabled={!notes}
                          className="w-full mt-3 py-3 rounded-2xl font-black text-sm bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-800/20"
                        >
                          <Send className="h-4 w-4" /> Send to AI
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Items & Summary */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white overflow-hidden flex flex-col h-full">
                        <div className="p-6 border-b border-slate-50 bg-white z-10 flex items-center justify-between">
                          <p className="text-[10px] font-black text-orange-400 tracking-widest uppercase">Order Items</p>
                          <button className="text-xs font-black text-orange-500 hover:text-orange-600 flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors">
                            <Plus className="h-3.5 w-3.5" /> Add Item
                          </button>
                        </div>
                        
                        <div className="flex-1 p-6 space-y-3 bg-[#FCFAFA]">
                          {selected.items.map((it, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:border-orange-200 transition-colors">
                              <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-600 font-black shadow-inner">
                                x{it.qty}
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className="font-black text-slate-700 text-base">{it.name} <span className="text-slate-400 font-bold">{it.variant ? `(${it.variant})` : ""}</span></p>
                                {it.notes && <p className="text-xs font-bold text-slate-500 mt-1.5 bg-slate-50 inline-block px-2.5 py-1 rounded-lg border border-slate-100">📝 {it.notes}</p>}
                              </div>
                              <p className="font-black text-lg text-slate-800 pt-0.5">Rs. {it.price.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>

                        <div className="bg-white p-6 border-t border-slate-50">
                          <div className="max-w-sm ml-auto space-y-2.5">
                            <div className="flex justify-between text-slate-500 font-bold text-sm">
                              <span>Subtotal</span>
                              <span className="text-slate-700">Rs. {selected.items.reduce((s, i) => s + i.price, 0).toLocaleString()}</span>
                            </div>
                            {selected.deliveryFee > 0 && (
                              <div className="flex justify-between text-slate-500 font-bold text-sm">
                                <span>Delivery Fee</span>
                                <span className="text-slate-700">Rs. {selected.deliveryFee}</span>
                              </div>
                            )}
                            <div className="h-px w-full bg-slate-100 my-3" />
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-black text-slate-400 tracking-widest uppercase">Total</span>
                              <span className="text-3xl font-black text-orange-500 drop-shadow-sm">Rs. {orderTotal(selected).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Action Bar */}
                  <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                    className="sticky bottom-6 mt-8 bg-white/90 backdrop-blur-xl p-4 rounded-[32px] shadow-[0_20px_40px_rgba(249,115,22,0.1)] border border-white flex items-center gap-4 max-w-2xl mx-auto"
                  >
                    {selected.status === "pending" ? (
                      <>
                        <button
                          onClick={() => setRejectOpen(true)}
                          className="flex-1 py-4 px-6 rounded-[20px] font-black text-red-500 bg-white hover:bg-red-50 border-2 border-red-100 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] shadow-sm"
                        >
                          <X className="h-5 w-5" /> Reject
                        </button>
                        <button
                          onClick={handleConfirm}
                          className="wasi-confirm flex-[2] py-4 px-6 rounded-[20px] font-black text-white bg-gradient-to-r from-[#25D366] to-[#1da851] transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(37,211,102,0.4)] hover:scale-[1.02]"
                        >
                          <Check className="h-5 w-5" /> Confirm Order
                        </button>
                      </>
                    ) : selected.status === "confirmed" ? (
                       <div className="flex-1 flex items-center gap-4 w-full">
                        <div className="flex-[2] py-4 px-6 rounded-[20px] font-black bg-green-50 text-green-600 border border-green-200/50 flex items-center justify-center gap-2 cursor-default">
                          <Check className="h-5 w-5" /> Confirmed & Sent to Kitchen
                        </div>
                        {showRemove && (
                          <button
                            onClick={() => { setOrders((p) => p.filter((o) => o.id !== selected.id)); setSelectedId(orders.find((o) => o.id !== selected.id)?.id ?? ""); }}
                            className="flex-1 py-4 rounded-[20px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 transition-colors text-sm border border-slate-200/50"
                          >
                            Clear Queue
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 py-4 px-6 rounded-[20px] font-black bg-red-50 text-red-600 border border-red-200/50 flex items-center justify-center gap-2 cursor-default w-full">
                        <X className="h-5 w-5" /> Rejected
                      </div>
                    )}
                  </motion.div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* DIALOGS AND SHEETS */}
      <Dialog open={showInsights} onOpenChange={setShowInsights}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-[32px] border-white shadow-[0_20px_60px_rgb(0,0,0,0.1)] p-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-orange-500 text-2xl font-black">
              <Sparkles className="h-7 w-7" /> AI Business Insights
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6 p-6 rounded-[24px] bg-orange-50/50 border border-orange-100">
            {loadingInsights ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <span className="relative flex h-8 w-8">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-8 w-8 bg-orange-500" />
                </span>
                <p className="text-orange-600/80 font-bold animate-pulse text-sm">AI is analyzing all orders...</p>
              </div>
            ) : (
              <div className="prose prose-sm prose-orange max-w-none prose-headings:mb-3 prose-p:mt-0 whitespace-pre-wrap font-medium text-slate-700">
                {insightsReport}
              </div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <button onClick={() => setShowInsights(false)} className="px-6 py-3 bg-slate-800 text-white rounded-[16px] font-bold text-sm hover:bg-slate-700 transition-colors">
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] border-white shadow-[0_20px_60px_rgb(0,0,0,0.1)] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800">Reject Order</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-medium text-slate-500">Select a reason. The AI will naturally notify the customer.</p>
          <RadioGroup value={rejectReason} onValueChange={setRejectReason} className="space-y-2 my-4">
            {rejectReasons.map((r) => (
              <Label key={r.value} htmlFor={r.value} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer has-[:checked]:bg-red-50 has-[:checked]:border-red-200 transition-all font-bold text-slate-700">
                <RadioGroupItem id={r.value} value={r.value} />
                <span className="text-sm">{r.label}</span>
              </Label>
            ))}
          </RadioGroup>
          {rejectReason === "other" && (
            <Input value={rejectOther} onChange={(e) => setRejectOther(e.target.value)} placeholder="Specify reason..." className="rounded-xl border-slate-200 focus:ring-red-400" />
          )}
          <DialogFooter className="mt-6">
            <button onClick={() => setRejectOpen(false)} className="px-5 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
            <button onClick={handleReject} className="px-6 py-3 rounded-xl font-black bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20">Confirm Rejection</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[400px] sm:max-w-[400px] p-0 flex flex-col rounded-l-[32px] border-l border-white shadow-[0_20px_60px_rgb(0,0,0,0.1)]">
          <SheetHeader className="p-8 border-b border-slate-100 bg-white">
            <SheetTitle className="text-2xl font-black text-slate-800">Quick Replies</SheetTitle>
            <div className="relative mt-4">
              <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search replies..." className="pl-11 py-5 rounded-2xl border-slate-200 bg-slate-50 font-medium text-sm focus:ring-orange-400" />
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6 bg-[#FCFAFA]">
            <Accordion type="multiple" defaultValue={["0"]} className="space-y-3">
              {quickReplyCategories.map((cat, i) => (
                <AccordionItem key={i} value={String(i)} className="border-none bg-white rounded-[24px] px-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                  <AccordionTrigger className="text-sm font-black text-slate-700 hover:no-underline">{cat.label}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-3 pt-1">
                      {cat.replies.map((r, j) => (
                        <div key={j} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 hover:bg-orange-50/50 border border-slate-100 transition-colors">
                          <p className="text-sm font-medium text-slate-600 flex-1 leading-snug">{r}</p>
                          <button 
                            onClick={() => {
                              handleSendNote(r);
                              setSheetOpen(false);
                            }}
                            className="shrink-0 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
