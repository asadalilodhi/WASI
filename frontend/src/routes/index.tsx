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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReactMarkdown from 'react-markdown';

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

const initialOrders: Order[] = [
  {
    id: "WA-00847",
    customer: "Muhammad Bilal",
    phone: "+92 300 1234567",
    address: "House 12, Block 5, Gulshan-e-Iqbal, Karachi",
    type: "DELIVERY",
    payment: "COD",
    items: [
      { qty: 2, name: "Zinger Burger", notes: "extra spicy, no onions", price: 700 },
      { qty: 1, name: "Large Fries", price: 220 },
      { qty: 1, name: "Coke 500ml", price: 100 },
    ],
    deliveryFee: 100,
    arrivedMinutesAgo: 2,
    status: "pending",
  },
  {
    id: "WA-00846",
    customer: "Ayesha Khan",
    phone: "+92 333 9876543",
    address: "Flat 4B, Sea Breeze Plaza, Clifton, Karachi",
    type: "DELIVERY",
    payment: "COD",
    items: [
      { qty: 1, name: "Chicken Tikka Pizza (Large)", price: 1450 },
      { qty: 2, name: "Garlic Bread", price: 480 },
    ],
    deliveryFee: 150,
    arrivedMinutesAgo: 6,
    status: "pending",
  },
  {
    id: "WA-00845",
    customer: "Hassan Tariq",
    phone: "+92 321 5550199",
    type: "TAKEAWAY",
    payment: "CARD",
    items: [{ qty: 1, name: "Beef Shawarma Platter", notes: "no garlic sauce", price: 650 }],
    deliveryFee: 0,
    arrivedMinutesAgo: 1,
    status: "pending",
  },
  {
    id: "WA-00844",
    customer: "Fatima Noor",
    phone: "+92 345 1112233",
    address: "C-22, Phase 6, DHA, Karachi",
    type: "DELIVERY",
    payment: "COD",
    items: [
      { qty: 3, name: "Chicken Roll", price: 750 },
      { qty: 2, name: "Mint Margarita", price: 360 },
    ],
    deliveryFee: 120,
    arrivedMinutesAgo: 12,
    status: "confirmed",
  },
];

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

function urgencyBorder(mins: number, selected: boolean) {
  if (selected) return "border-l-4 border-slate-800";
  if (mins >= 5) return "border-l-4 border-red-500";
  if (mins >= 3) return "border-l-4 border-amber-500";
  return "border-l-4 border-[#25D366]";
}

function orderTotal(o: Order) {
  return o.items.reduce((s, i) => s + i.price, 0) + o.deliveryFee;
}

const BACKEND_URL = "https://irregular-jailbreak-contort.ngrok-free.dev";

function Dashboard() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedId, setSelectedId] = useState<string>(initialOrders[0]?.id || "");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [activePill, setActivePill] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("stock");
  const [rejectOther, setRejectOther] = useState("");
  const [now, setNow] = useState(new Date());
  const [showRemove, setShowRemove] = useState(false);
  
  // AI Insights State
  const [showInsights, setShowInsights] = useState(false);
  const [insightsReport, setInsightsReport] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/orders`, { headers: { "ngrok-skip-browser-warning": "true" } });
        const data = await res.json();
        
        const parsedOrders: Order[] = Object.keys(data).map(sessionId => {
          const o = data[sessionId];
          let uiStatus: OrderStatus = "pending";
          if (o.status === "CONFIRMED") uiStatus = "confirmed";
          if (o.status === "REVISION_NEEDED") uiStatus = "rejected";
          
          return {
            id: sessionId,
            customer: o.customerName || "Unknown",
            phone: o.phoneNumber || sessionId,
            address: o.deliveryAddress,
            type: o.orderType || "DELIVERY",
            payment: o.paymentMethod || "COD",
            items: o.items || [],
            deliveryFee: o.orderType === "DELIVERY" ? 100 : 0,
            arrivedMinutesAgo: 0,
            status: uiStatus
          };
        });
        
        setOrders(parsedOrders);
        if (!selectedId && parsedOrders.length > 0) {
           setSelectedId(parsedOrders[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch orders", e);
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
      await fetch(`${BACKEND_URL}/api/orders/${selected.id}/confirm`, { method: "POST", headers: { "ngrok-skip-browser-warning": "true" } });
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
      
      await fetch(`${BACKEND_URL}/api/orders/${selected.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ feedback: finalFeedback })
      });
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...o, status: "rejected" } : o)));
      setRejectOpen(false);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSendNote(noteText: string) {
    if (!selected) return;
    try {
      await fetch(`${BACKEND_URL}/api/orders/${selected.id}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({ note: noteText })
      });
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
    <div className="h-screen w-screen overflow-hidden flex flex-col font-sans antialiased text-slate-900">
      {/* Pulse animation for confirm button */}
      <style>{`
        @keyframes wasi-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.55), 0 6px 14px -4px rgba(37,211,102,0.45); background-color: #25D366; }
          50% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0); background-color: #1fbd5a; }
        }
        .wasi-confirm { animation: wasi-pulse 1.8s ease-in-out infinite; }
        .wasi-confirm:hover { animation: none; background-color: #1fa34a; box-shadow: 0 8px 20px -6px rgba(37,211,102,0.5); }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
      `}</style>

      {/* TOP NAV */}
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-[#25D366] grid place-items-center text-white font-black text-sm shadow-md">W</div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg tracking-tight">WASI</span>
            <span className="h-5 w-px bg-slate-700" />
            <span className="text-slate-400 text-sm">Receptionist Dashboard</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-slate-300 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-mono font-semibold text-white">{now.toLocaleTimeString("en-GB")}</span>
            <span className="text-slate-400">{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2 py-1 rounded-md bg-slate-800">Today: <b className="text-white">{stats.total}</b></span>
            <span className="px-2 py-1 rounded-md bg-slate-800">Confirmed: <b className="text-green-400">{stats.confirmed}</b></span>
            <span className="px-2 py-1 rounded-md bg-slate-800">Rejected: <b className="text-red-400">{stats.rejected}</b></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={fetchInsights}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-semibold transition-colors"
          >
            <Sparkles className="h-4 w-4" /> AI Insights
          </button>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]" />
            </span>
            <span className="text-[#25D366] text-sm font-semibold">Live</span>
          </div>
          <button className="relative p-2 rounded-md hover:bg-slate-800 transition-colors" aria-label="Notifications">
            <Bell className="h-5 w-5 text-slate-300" />
            {orders.some(o => o.status === "pending") && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="h-8 w-8 rounded-full bg-[#25D366] grid place-items-center text-white text-xs font-bold">AR</div>
            <span className="text-sm">Ahmad Raza</span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-80 border-r border-slate-200 bg-white flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 tracking-widest">ORDER QUEUE</h2>
              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                {orders.filter((o) => o.status === "pending").length} active
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <button className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                Sort by: <span className="font-semibold text-slate-900">Newest</span>
              </button>
              <button className="p-1.5 rounded-md hover:bg-slate-100" aria-label="Filter">
                <Funnel className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {orders.length === 0 ? (
              <div className="h-full grid place-items-center text-center px-6">
                <div>
                  <MessageCircle className="h-12 w-12 mx-auto text-slate-300" strokeWidth={1.25} />
                  <p className="mt-3 font-semibold text-slate-700">No orders yet</p>
                  <p className="text-sm text-slate-400">New orders will appear here automatically.</p>
                </div>
              </div>
            ) : (
              orders.map((o) => {
                const isSelected = o.id === selectedId;
                return (
                  <button
                    key={o.id}
                    onClick={() => { setSelectedId(o.id); setShowRemove(false); setNotes(""); setActivePill(null); }}
                    className={`w-full text-left p-4 border-b border-slate-100 transition-colors ${urgencyBorder(o.arrivedMinutesAgo, isSelected)} ${isSelected ? "bg-slate-100" : "hover:bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">{o.customer}</span>
                      <span className="text-xs text-slate-500 shrink-0">{o.arrivedMinutesAgo}m ago</span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-slate-500">{o.items.reduce((s, i) => s + i.qty, 0)} items</span>
                      <span className="text-sm font-bold text-[#1fa34a]">Rs. {orderTotal(o).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.type === "DELIVERY" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-orange-50 text-orange-700 border border-orange-200"}`}>{o.type}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">{o.payment}</span>
                      {o.status === "confirmed" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">CONFIRMED</span>}
                      {o.status === "rejected" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">REJECTED</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* QR CODE FOR JUDGES */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-center shrink-0">
            <p className="text-xs font-bold text-slate-500 mb-2">SCAN TO ORDER (DEMO)</p>
            <img src="/qr-code.jpeg" alt="WhatsApp QR Code" className="w-40 h-40 mx-auto rounded-lg shadow-sm border border-slate-200 object-cover" />
            <p className="text-[10px] text-slate-400 mt-2 leading-tight">Scan this with your phone camera to chat with the AI Receptionist!</p>
          </div>
        </aside>

        {/* DETAILS */}
        <main className="flex-1 bg-slate-50 overflow-y-auto">
          {!selected ? (
            <div className="h-full grid place-items-center px-6 text-center">
              <div>
                <div className="h-20 w-20 rounded-2xl bg-white border border-slate-200 grid place-items-center mx-auto shadow-sm">
                  <MessageCircle className="h-10 w-10 text-[#25D366]" strokeWidth={1.5} />
                </div>
                <p className="mt-5 text-lg text-slate-600 font-semibold">No active order selected</p>
                <p className="text-slate-400">Click any order from the queue to view details.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* HEADER */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-bold text-xl tracking-tight">#{selected.id.substring(0, 8)}...</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Arrived {selected.arrivedMinutesAgo} min ago</p>
                  </div>
                  <div>
                    {selected.status === "pending" && <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">PENDING REVIEW</span>}
                    {selected.status === "confirmed" && <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">✓ CONFIRMED</span>}
                    {selected.status === "rejected" && <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200">✕ REJECTED</span>}
                  </div>
                </div>

                {/* CUSTOMER & DELIVERY */}
                <div className="bg-slate-50 p-4 mx-6 mt-6 rounded-lg border border-slate-200/70">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 tracking-widest">CUSTOMER</p>
                      <p className="font-bold text-lg mt-1">{selected.customer}</p>
                      <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <MessageCircle className="h-4 w-4 text-[#25D366]" />
                        {selected.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 tracking-widest">ORDER TYPE</p>
                      <p className="font-bold text-lg mt-1">{selected.type === "DELIVERY" ? "🚚 Delivery" : "🛍️ Takeaway"}</p>
                      <p className="text-sm text-slate-600 mt-0.5">Payment: {selected.payment}</p>
                    </div>
                  </div>
                  {selected.address && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-[11px] font-semibold text-slate-500 tracking-widest">DELIVERY ADDRESS</p>
                      <div className="flex items-start justify-between gap-3 mt-1">
                        <p className="text-sm text-slate-700 flex items-start gap-1.5">
                          <MapPin className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                          {selected.address}
                        </p>
                        <button className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500" aria-label="Edit address">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ITEMS */}
                <div className="px-6 py-6">
                  <p className="text-sm text-slate-500 font-semibold tracking-wider mb-3">ORDER ITEMS</p>
                  <div>
                    {selected.items.map((it, i) => (
                      <div key={i} className="flex items-start gap-3 py-3 border-b border-dashed border-slate-200">
                        <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-md shrink-0">x{it.qty}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{it.name} {it.variant ? `(${it.variant})` : ""}</p>
                          {it.notes && <p className="italic text-sm text-slate-500 mt-0.5">{it.notes}</p>}
                        </div>
                        <p className="font-bold">Rs. {it.price.toLocaleString()}</p>
                      </div>
                    ))}
                    <button className="w-full mt-3 py-2.5 text-sm font-semibold text-slate-500 border-2 border-dashed border-slate-300 rounded-md hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5">
                      <Plus className="h-4 w-4" /> Add Item
                    </button>
                  </div>
                </div>

                {/* SUMMARY */}
                <div className="px-6 py-4 bg-slate-50 border-y border-slate-200/70">
                  <div className="ml-auto max-w-xs space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>Rs. {selected.items.reduce((s, i) => s + i.price, 0).toLocaleString()}</span>
                    </div>
                    {selected.deliveryFee > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Delivery Fee</span>
                        <span>Rs. {selected.deliveryFee}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-slate-300 my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold">TOTAL</span>
                      <span className="text-2xl font-black text-[#25D366]">Rs. {orderTotal(selected).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* NOTES */}
                <div className="px-6 py-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-500 font-semibold tracking-wider">RECEPTIONIST NOTES</p>
                    <button 
                      onClick={() => { if(notes) handleSendNote(notes); }}
                      disabled={!notes}
                      className="text-xs font-bold bg-[#25D366] text-white px-3 py-1.5 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      <Send className="h-3 w-3" /> Send Note to AI
                    </button>
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes before confirming..."
                    className="min-h-[80px] resize-none"
                  />
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-500 tracking-wider">QUICK REPLIES</p>
                      <button onClick={() => setSheetOpen(true)} className="text-xs font-semibold text-[#25D366] hover:underline">
                        View All Quick Replies →
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
                      {quickPills.map((p) => (
                        <button
                          key={p}
                          onClick={() => pickPill(p)}
                          className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${activePill === p ? "bg-[#25D366] text-white border-[#25D366]" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t border-slate-100 bg-white flex gap-4 sticky bottom-0">
                  {selected.status === "pending" ? (
                    <>
                      <button
                        onClick={() => setRejectOpen(true)}
                        className="flex-1 py-3 px-5 rounded-md font-bold border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="h-4 w-4" /> Reject Order
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="wasi-confirm flex-[2] py-3 px-5 rounded-md font-bold text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" /> Confirm Order
                      </button>
                    </>
                  ) : selected.status === "confirmed" ? (
                    <div className="flex-1 flex flex-col gap-3">
                      <button disabled className="w-full py-3 px-5 rounded-md font-bold bg-[#25D366] text-white flex items-center justify-center gap-2 cursor-default">
                        <Check className="h-4 w-4" /> Order Confirmed — Sent to Kitchen
                      </button>
                      {showRemove && (
                        <button
                          onClick={() => { setOrders((p) => p.filter((o) => o.id !== selected.id)); setSelectedId(orders.find((o) => o.id !== selected.id)?.id ?? ""); }}
                          className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          Remove from Queue →
                        </button>
                      )}
                    </div>
                  ) : (
                    <button disabled className="flex-1 py-3 px-5 rounded-md font-bold bg-red-50 text-red-700 border border-red-200 flex items-center justify-center gap-2 cursor-default">
                      <X className="h-4 w-4" /> Order Rejected — AI Notified Customer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* AI INSIGHTS DIALOG */}
      <Dialog open={showInsights} onOpenChange={setShowInsights}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-700 text-xl">
              <Sparkles className="h-6 w-6" /> AI Business Insights
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-4 rounded-md bg-slate-50 border border-slate-200">
            {loadingInsights ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-indigo-500" />
                </span>
                <p className="text-slate-500 animate-pulse text-sm">AI is analyzing all orders...</p>
              </div>
            ) : (
              <div className="prose prose-sm prose-indigo max-w-none prose-headings:mb-2 prose-p:mt-0">
                <ReactMarkdown>{insightsReport}</ReactMarkdown>
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setShowInsights(false)} className="px-4 py-2 bg-slate-900 text-white rounded-md font-semibold text-sm hover:bg-slate-800 transition-colors">
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Select a reason. The customer will be notified automatically.</p>
          <RadioGroup value={rejectReason} onValueChange={setRejectReason} className="space-y-1 my-2">
            {rejectReasons.map((r) => (
              <Label key={r.value} htmlFor={r.value} className="flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer has-[:checked]:bg-red-50 has-[:checked]:border-red-300">
                <RadioGroupItem id={r.value} value={r.value} />
                <span className="text-sm font-medium">{r.label}</span>
              </Label>
            ))}
          </RadioGroup>
          {rejectReason === "other" && (
            <Input value={rejectOther} onChange={(e) => setRejectOther(e.target.value)} placeholder="Specify reason..." />
          )}
          <DialogFooter>
            <button onClick={() => setRejectOpen(false)} className="px-4 py-2 rounded-md font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>
            <button onClick={handleReject} className="px-4 py-2 rounded-md font-bold bg-red-600 hover:bg-red-700 text-white">Confirm Rejection</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUICK REPLIES SHEET */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[400px] sm:max-w-[400px] p-0 flex flex-col">
          <SheetHeader className="p-6 border-b border-slate-200">
            <SheetTitle>Quick Replies</SheetTitle>
            <div className="relative mt-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search replies..." className="pl-9" />
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <Accordion type="multiple" defaultValue={["0"]} className="space-y-2">
              {quickReplyCategories.map((cat, i) => (
                <AccordionItem key={i} value={String(i)} className="border border-slate-200 rounded-lg px-3">
                  <AccordionTrigger className="text-sm font-semibold">{cat.label}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pb-2">
                      {cat.replies.map((r, j) => (
                        <div key={j} className="flex items-start gap-2 p-3 rounded-md bg-slate-50 border border-slate-100">
                          <p className="text-sm text-slate-700 flex-1">{r}</p>
                          <button 
                            onClick={() => {
                              handleSendNote(r);
                              setSheetOpen(false);
                            }}
                            className="shrink-0 px-2.5 py-1.5 rounded-md bg-[#25D366] hover:bg-green-600 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <Send className="h-3 w-3" /> Send
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
