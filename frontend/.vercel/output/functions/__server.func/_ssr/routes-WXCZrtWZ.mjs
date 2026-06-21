import { o as __toESM } from "../_runtime.mjs";
import { a as Trigger2, i as Root2, n as Header, r as Item, t as Content2, v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { a as Plus, c as LayoutDashboard, d as ChevronDown, f as Check, i as Search, l as Clock, n as Sparkles, o as MessageCircle, p as Bell, r as Send, s as MapPin, t as X, u as Circle } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as RadioGroupIndicator, r as RadioGroupItem$1, t as RadioGroup$1 } from "../_libs/@radix-ui/react-radio-group+[...].mjs";
import { t as Root } from "../_libs/radix-ui__react-label.mjs";
import { n as AnimatePresence, t as motion } from "../_libs/framer-motion.mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-WXCZrtWZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
var Sheet = Dialog$1;
var SheetPortal = DialogPortal$1;
var SheetOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = DialogOverlay$1.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = import_react.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	}), children]
})] }));
SheetContent.displayName = DialogContent$1.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = DialogTitle$1.displayName;
var SheetDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = DialogDescription$1.displayName;
var RadioGroup = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroup$1, {
		className: cn("grid gap-2", className),
		...props,
		ref
	});
});
RadioGroup.displayName = RadioGroup$1.displayName;
var RadioGroupItem = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupItem$1, {
		ref,
		className: cn("aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupIndicator, {
			className: "flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-3.5 w-3.5 fill-primary" })
		})
	});
});
RadioGroupItem.displayName = RadioGroupItem$1.displayName;
var labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
var Label = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn(labelVariants(), className),
	...props
}));
Label.displayName = Root.displayName;
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
var Accordion = Root2;
var AccordionItem = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item, {
	ref,
	className: cn("border-b", className),
	...props
}));
AccordionItem.displayName = "AccordionItem";
var AccordionTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {
	className: "flex",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Trigger2, {
		ref,
		className: cn("flex flex-1 items-center justify-between py-4 text-sm font-medium cursor-pointer transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" })]
	})
}));
AccordionTrigger.displayName = Trigger2.displayName;
var AccordionContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	className: "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("pb-4 pt-0", className),
		children
	})
}));
AccordionContent.displayName = Content2.displayName;
var supabase = createClient("https://jeettuybmkqsxoyjwvxo.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZXR0dXlibWtxc3hveWp3dnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDY4MTIsImV4cCI6MjA5NzM4MjgxMn0.tUK8f2y54hC4tJoQnGWXrNpRH_4ZpMvAe7D0tPrX0sM", { auth: { persistSession: typeof window !== "undefined" } });
var initialOrders = [];
var rejectReasons = [
	{
		value: "stock",
		label: "🚫 Item out of stock"
	},
	{
		value: "address",
		label: "📍 Address undeliverable"
	},
	{
		value: "duplicate",
		label: "📋 Duplicate order"
	},
	{
		value: "noresp",
		label: "📵 No response from customer"
	},
	{
		value: "other",
		label: "✏️ Other"
	}
];
var quickReplyCategories = [
	{
		label: "📦 Order Issues",
		replies: [
			"Aap ka order mil gaya, thodi der mein confirm karta hoon.",
			"Sorry, ye item abhi available nahi hai. Koi alternate batayein?",
			"Aap ka order tayyar ho raha hai, 15 minute mein nikal jayega."
		]
	},
	{
		label: "📍 Address & Delivery",
		replies: [
			"Address confirm karein: house number aur block?",
			"Rider 10 minute mein pohanch jayega inshallah.",
			"Rider call kar raha hai, please pick karein."
		]
	},
	{
		label: "💳 Payment",
		replies: [
			"Payment cash on delivery hai, sahi hai?",
			"Card machine rider ke paas hai, available hai.",
			"Online payment link bhej raha hoon."
		]
	}
];
var quickPills = [
	"Out of stock item",
	"Wrong address?",
	"On its way!",
	"Confirm payment",
	"Rider dispatched"
];
function orderTotal(o) {
	return o.items.reduce((s, i) => s + i.price, 0) + o.deliveryFee;
}
var BACKEND_URL = "";
function Dashboard() {
	const [orders, setOrders] = (0, import_react.useState)(initialOrders);
	const [selectedId, setSelectedId] = (0, import_react.useState)(initialOrders[0]?.id || "");
	const [rejectOpen, setRejectOpen] = (0, import_react.useState)(false);
	const [sheetOpen, setSheetOpen] = (0, import_react.useState)(false);
	const [notes, setNotes] = (0, import_react.useState)("");
	const [activePill, setActivePill] = (0, import_react.useState)(null);
	const [rejectReason, setRejectReason] = (0, import_react.useState)("stock");
	const [rejectOther, setRejectOther] = (0, import_react.useState)("");
	const [now, setNow] = (0, import_react.useState)(null);
	const [showRemove, setShowRemove] = (0, import_react.useState)(false);
	const [showInsights, setShowInsights] = (0, import_react.useState)(false);
	const [insightsReport, setInsightsReport] = (0, import_react.useState)("");
	const [loadingInsights, setLoadingInsights] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setNow(/* @__PURE__ */ new Date());
		const t = setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
		return () => clearInterval(t);
	}, []);
	(0, import_react.useEffect)(() => {
		const fetchOrders = async () => {
			try {
				const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
				if (error) throw error;
				if (!data) return;
				const parsedOrders = data.map((o) => {
					let uiStatus = "pending";
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
				if (!selectedId && parsedOrders.length > 0) setSelectedId(parsedOrders[0].id);
			} catch (e) {
				console.error("Failed to fetch orders from Supabase", e);
			}
		};
		fetchOrders();
		const interval = setInterval(fetchOrders, 3e3);
		return () => clearInterval(interval);
	}, [selectedId]);
	const selected = (0, import_react.useMemo)(() => orders.find((o) => o.id === selectedId), [orders, selectedId]);
	const stats = (0, import_react.useMemo)(() => {
		return {
			total: orders.length,
			confirmed: orders.filter((o) => o.status === "confirmed").length,
			rejected: orders.filter((o) => o.status === "rejected").length
		};
	}, [orders]);
	async function handleConfirm() {
		if (!selected) return;
		try {
			await supabase.from("orders").update({ status: "CONFIRMED" }).eq("id", selected.id);
			setOrders((prev) => prev.map((o) => o.id === selected.id ? {
				...o,
				status: "confirmed"
			} : o));
			setShowRemove(false);
			setTimeout(() => setShowRemove(true), 3e3);
		} catch (e) {
			console.error(e);
		}
	}
	async function handleReject() {
		if (!selected) return;
		try {
			const reasonText = rejectReason === "other" ? rejectOther : rejectReasons.find((r) => r.value === rejectReason)?.label;
			const finalFeedback = notes ? `${reasonText} - Notes: ${notes}` : reasonText;
			await supabase.from("orders").update({
				status: "REVISION_NEEDED",
				notes: finalFeedback
			}).eq("id", selected.id);
			setOrders((prev) => prev.map((o) => o.id === selected.id ? {
				...o,
				status: "rejected"
			} : o));
			setRejectOpen(false);
		} catch (e) {
			console.error(e);
		}
	}
	async function handleSendNote(noteText) {
		if (!selected) return;
		try {
			await supabase.from("orders").update({ notes: noteText }).eq("id", selected.id);
			setNotes("");
			setActivePill(null);
		} catch (e) {
			console.error(e);
		}
	}
	function pickPill(p) {
		setActivePill(p);
		setNotes((n) => (n ? n + "\n" : "") + p);
	}
	async function fetchInsights() {
		setShowInsights(true);
		setLoadingInsights(true);
		try {
			setInsightsReport((await (await fetch(`${BACKEND_URL}/api/analytics`, { headers: { "ngrok-skip-browser-warning": "true" } })).json()).report || "Failed to generate report.");
		} catch (e) {
			setInsightsReport("An error occurred while fetching insights.");
		}
		setLoadingInsights(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "h-screen w-screen overflow-hidden flex flex-col font-sans antialiased text-slate-800 bg-[#FFF7F0]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "h-[72px] bg-white/80 backdrop-blur-md text-slate-800 flex items-center justify-between px-6 shrink-0 border-b border-orange-100 sticky top-0 z-50",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-10 w-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#1da851] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-green-500/20",
							children: "W"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-extrabold text-lg tracking-tight leading-tight",
								children: "WASI"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-orange-500 text-[11px] font-bold tracking-widest uppercase",
								children: "Admin Dashboard"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden md:flex items-center gap-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 bg-orange-50/80 px-4 py-2 rounded-full border border-orange-100",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4 w-4 text-orange-400" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-sm text-slate-700",
									children: now ? now.toLocaleTimeString("en-GB", {
										hour: "2-digit",
										minute: "2-digit"
									}) : ""
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1 h-1 rounded-full bg-orange-300 mx-1" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-500 text-sm font-medium",
									children: now ? now.toLocaleDateString("en-GB", {
										weekday: "short",
										day: "numeric",
										month: "short"
									}) : ""
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: fetchInsights,
								className: "group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white rounded-full text-sm font-bold shadow-md shadow-orange-500/20 transition-all hover:scale-105",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 group-hover:animate-pulse" }), " Insights"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "relative flex h-2.5 w-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-700 text-sm font-bold tracking-wide",
									children: "Live"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "relative p-2.5 rounded-full bg-white border border-slate-200 hover:bg-orange-50 hover:border-orange-200 transition-all",
								"aria-label": "Notifications",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-5 w-5 text-slate-600" }), orders.some((o) => o.status === "pending") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-px bg-slate-200" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 cursor-pointer group",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm font-bold border-2 border-white shadow-sm group-hover:scale-105 transition-transform",
									children: "AR"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "hidden sm:block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-bold leading-tight",
										children: "Ahmad Raza"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-slate-500 font-medium",
										children: "Receptionist"
									})]
								})]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 flex overflow-hidden p-4 gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: "w-[340px] flex flex-col h-full shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex flex-col h-full overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-5 border-b border-slate-50 bg-white z-10 shrink-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutDashboard, { className: "h-5 w-5 text-orange-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-sm font-black text-slate-800 tracking-wide uppercase",
											children: "Order Queue"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs font-bold bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-100",
										children: [orders.filter((o) => o.status === "pending").length, " active"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-3 gap-2 mb-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-slate-50 rounded-2xl p-2.5 text-center border border-slate-100",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-slate-400 font-black uppercase tracking-wider",
												children: "Total"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xl font-black text-slate-700 leading-tight mt-0.5",
												children: stats.total
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-green-50/50 rounded-2xl p-2.5 text-center border border-green-100/50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-green-500 font-black uppercase tracking-wider",
												children: "Done"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xl font-black text-green-600 leading-tight mt-0.5",
												children: stats.confirmed
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-red-50/50 rounded-2xl p-2.5 text-center border border-red-100/50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-red-500 font-black uppercase tracking-wider",
												children: "Rej"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xl font-black text-red-600 leading-tight mt-0.5",
												children: stats.rejected
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										placeholder: "Search orders...",
										className: "w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-slate-400 text-slate-700"
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-[#FCFAFA]",
							children: orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "h-full flex flex-col items-center justify-center text-center px-6 opacity-60",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
											className: "h-8 w-8 text-slate-300",
											strokeWidth: 1.5
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-black text-slate-500 text-lg",
										children: "Queue is empty"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-slate-400 mt-1 font-medium",
										children: "New AI orders will drop in here."
									})
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: orders.map((o) => {
								const isSelected = o.id === selectedId;
								let statusColor = "bg-amber-400";
								if (o.status === "confirmed") statusColor = "bg-[#25D366]";
								if (o.status === "rejected") statusColor = "bg-red-500";
								let cardStyle = "bg-white border-slate-200 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5";
								if (isSelected) cardStyle = "bg-orange-50/30 border-orange-300 shadow-[0_8px_30px_rgba(249,115,22,0.12)] ring-1 ring-orange-400/20";
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.button, {
									layout: true,
									initial: {
										opacity: 0,
										y: 15,
										scale: .95
									},
									animate: {
										opacity: 1,
										y: 0,
										scale: 1
									},
									exit: {
										opacity: 0,
										scale: .9,
										transition: { duration: .2 }
									},
									onClick: () => {
										setSelectedId(o.id);
										setShowRemove(false);
										setNotes("");
										setActivePill(null);
									},
									className: `w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${cardStyle}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `absolute left-0 top-0 bottom-0 w-1.5 ${statusColor} opacity-80 group-hover:opacity-100 transition-opacity` }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between gap-2 pl-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-black text-sm text-slate-700 truncate group-hover:text-orange-600 transition-colors",
												children: o.customer
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: `text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${o.arrivedMinutesAgo > 5 ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-50 text-slate-500 border border-slate-100"}`,
												children: [o.arrivedMinutesAgo, "m ago"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mt-2 pl-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs font-bold text-slate-400 flex items-center gap-1.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-slate-300" }),
													o.items.reduce((s, i) => s + i.qty, 0),
													" items"
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-sm font-black text-slate-700",
												children: ["Rs. ", orderTotal(o).toLocaleString()]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 mt-3 pl-2 flex-wrap",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `text-[9px] uppercase font-black px-2.5 py-1 rounded-md ${o.type === "DELIVERY" ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"}`,
												children: o.type
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[9px] uppercase font-black px-2.5 py-1 rounded-md bg-slate-100 text-slate-500",
												children: o.payment
											})]
										})
									]
								}, o.id);
							}) })
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 relative overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
						mode: "wait",
						children: !selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
							initial: {
								opacity: 0,
								scale: .98
							},
							animate: {
								opacity: 1,
								scale: 1
							},
							exit: { opacity: 0 },
							className: "h-full flex flex-col items-center justify-center bg-white/40 rounded-[32px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-24 h-24 rounded-full bg-gradient-to-tr from-orange-100 to-amber-50 shadow-xl shadow-orange-500/10 flex items-center justify-center mb-6",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-10 w-10 text-orange-400" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-2xl font-black text-slate-700",
									children: "Ready for Action"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-slate-400 font-medium mt-2",
									children: "Select an order from the queue to review and confirm."
								})
							]
						}, "empty") : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
							initial: {
								opacity: 0,
								y: 20
							},
							animate: {
								opacity: 1,
								y: 0
							},
							exit: {
								opacity: 0,
								y: -20
							},
							transition: {
								duration: .3,
								ease: "easeOut"
							},
							className: "h-full overflow-y-auto scrollbar-thin pr-2 pb-10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "max-w-4xl mx-auto space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-6 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-4 relative z-10",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 flex items-center justify-center shadow-inner",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-xl font-black text-orange-500",
														children: ["#", selected.id.substring(0, 4)]
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
													className: "font-black text-2xl text-slate-800 tracking-tight",
													children: "Order Details"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3.5 w-3.5 text-orange-400" }),
														" Arrived ",
														selected.arrivedMinutesAgo,
														" min ago"
													]
												})] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative z-10",
												children: [
													selected.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-sm font-black px-4 py-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/50 flex items-center gap-2 shadow-sm",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-2 rounded-full bg-amber-500 animate-pulse" }), " PENDING REVIEW"]
													}),
													selected.status === "confirmed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-sm font-black px-4 py-2.5 rounded-xl bg-green-50 text-green-600 border border-green-200/50 flex items-center gap-2 shadow-sm",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), " CONFIRMED"]
													}),
													selected.status === "rejected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-sm font-black px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200/50 flex items-center gap-2 shadow-sm",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), " REJECTED"]
													})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 lg:grid-cols-3 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "lg:col-span-1 space-y-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-6",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10px] font-black text-orange-400 tracking-widest uppercase mb-4",
														children: "Customer Info"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-4 mb-5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xl shadow-inner",
															children: selected.customer.charAt(0).toUpperCase()
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "font-black text-lg text-slate-800 leading-tight",
															children: selected.customer
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-3.5 w-3.5 text-[#25D366]" }), selected.phone]
														})] })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-4 mt-6 pt-5 border-t border-slate-50",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-[10px] font-black text-slate-400 tracking-widest uppercase",
																children: "Order Type"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "font-bold text-slate-700 mt-1",
																children: selected.type === "DELIVERY" ? "🚚 Delivery" : "🛍️ Takeaway"
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-[10px] font-black text-slate-400 tracking-widest uppercase",
																children: "Payment"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "font-bold text-slate-700 mt-1 flex items-center gap-2",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-[#25D366]" }),
																	" ",
																	selected.payment
																]
															})] }),
															selected.address && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "pt-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																	className: "text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2",
																	children: "Address"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100/50",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4 text-orange-400 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																		className: "text-sm font-semibold text-slate-600 leading-snug",
																		children: selected.address
																	})]
																})]
															})
														]
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-6",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "flex items-center justify-between mb-4",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[10px] font-black text-orange-400 tracking-widest uppercase",
															children: "Communication"
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
														value: notes,
														onChange: (e) => setNotes(e.target.value),
														placeholder: "Add notes for the AI to tell the customer...",
														className: "min-h-[80px] resize-none rounded-2xl border-slate-200 focus:ring-orange-400 bg-slate-50/50 text-sm font-medium placeholder:text-slate-400 shadow-inner"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "mt-4 flex gap-2 overflow-x-auto scrollbar-thin pb-2",
														children: quickPills.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															onClick: () => pickPill(p),
															className: `shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all ${activePill === p ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`,
															children: p
														}, p))
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														onClick: () => {
															if (notes) handleSendNote(notes);
														},
														disabled: !notes,
														className: "w-full mt-3 py-3 rounded-2xl font-black text-sm bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-800/20",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" }), " Send to AI"]
													})
												]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "lg:col-span-2 space-y-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white overflow-hidden flex flex-col h-full",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "p-6 border-b border-slate-50 bg-white z-10 flex items-center justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[10px] font-black text-orange-400 tracking-widest uppercase",
															children: "Order Items"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
															className: "text-xs font-black text-orange-500 hover:text-orange-600 flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-3.5 w-3.5" }), " Add Item"]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "flex-1 p-6 space-y-3 bg-[#FCFAFA]",
														children: selected.items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:border-orange-200 transition-colors",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 text-orange-600 font-black shadow-inner",
																	children: ["x", it.qty]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex-1 min-w-0 pt-0.5",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																		className: "font-black text-slate-700 text-base",
																		children: [
																			it.name,
																			" ",
																			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																				className: "text-slate-400 font-bold",
																				children: it.variant ? `(${it.variant})` : ""
																			})
																		]
																	}), it.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																		className: "text-xs font-bold text-slate-500 mt-1.5 bg-slate-50 inline-block px-2.5 py-1 rounded-lg border border-slate-100",
																		children: ["📝 ", it.notes]
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																	className: "font-black text-lg text-slate-800 pt-0.5",
																	children: ["Rs. ", it.price.toLocaleString()]
																})
															]
														}, i))
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "bg-white p-6 border-t border-slate-50",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "max-w-sm ml-auto space-y-2.5",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex justify-between text-slate-500 font-bold text-sm",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Subtotal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "text-slate-700",
																		children: ["Rs. ", selected.items.reduce((s, i) => s + i.price, 0).toLocaleString()]
																	})]
																}),
																selected.deliveryFee > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex justify-between text-slate-500 font-bold text-sm",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delivery Fee" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "text-slate-700",
																		children: ["Rs. ", selected.deliveryFee]
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px w-full bg-slate-100 my-3" }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex justify-between items-center",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "text-sm font-black text-slate-400 tracking-widest uppercase",
																		children: "Total"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "text-3xl font-black text-orange-500 drop-shadow-sm",
																		children: ["Rs. ", orderTotal(selected).toLocaleString()]
																	})]
																})
															]
														})
													})
												]
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
										initial: {
											y: 50,
											opacity: 0
										},
										animate: {
											y: 0,
											opacity: 1
										},
										transition: {
											delay: .1,
											type: "spring",
											stiffness: 300,
											damping: 25
										},
										className: "sticky bottom-6 mt-8 bg-white/90 backdrop-blur-xl p-4 rounded-[32px] shadow-[0_20px_40px_rgba(249,115,22,0.1)] border border-white flex items-center gap-4 max-w-2xl mx-auto",
										children: selected.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => setRejectOpen(true),
											className: "flex-1 py-4 px-6 rounded-[20px] font-black text-red-500 bg-white hover:bg-red-50 border-2 border-red-100 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" }), " Reject"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: handleConfirm,
											className: "wasi-confirm flex-[2] py-4 px-6 rounded-[20px] font-black text-white bg-gradient-to-r from-[#25D366] to-[#1da851] transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(37,211,102,0.4)] hover:scale-[1.02]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-5 w-5" }), " Confirm Order"]
										})] }) : selected.status === "confirmed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 flex items-center gap-4 w-full",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex-[2] py-4 px-6 rounded-[20px] font-black bg-green-50 text-green-600 border border-green-200/50 flex items-center justify-center gap-2 cursor-default",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-5 w-5" }), " Confirmed & Sent to Kitchen"]
											}), showRemove && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => {
													setOrders((p) => p.filter((o) => o.id !== selected.id));
													setSelectedId(orders.find((o) => o.id !== selected.id)?.id ?? "");
												},
												className: "flex-1 py-4 rounded-[20px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 transition-colors text-sm border border-slate-200/50",
												children: "Clear Queue"
											})]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 py-4 px-6 rounded-[20px] font-black bg-red-50 text-red-600 border border-red-200/50 flex items-center justify-center gap-2 cursor-default w-full",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" }), " Rejected"]
										})
									})
								]
							})
						}, selected.id)
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: showInsights,
				onOpenChange: setShowInsights,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-[32px] border-white shadow-[0_20px_60px_rgb(0,0,0,0.1)] p-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "flex items-center gap-3 text-orange-500 text-2xl font-black",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-7 w-7" }), " AI Business Insights"]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-6 p-6 rounded-[24px] bg-orange-50/50 border border-orange-100",
							children: loadingInsights ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-center justify-center py-12 gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "relative flex h-8 w-8",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex rounded-full h-8 w-8 bg-orange-500" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-orange-600/80 font-bold animate-pulse text-sm",
									children: "AI is analyzing all orders..."
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "prose prose-sm prose-orange max-w-none prose-headings:mb-3 prose-p:mt-0 whitespace-pre-wrap font-medium text-slate-700",
								children: insightsReport
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, {
							className: "mt-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowInsights(false),
								className: "px-6 py-3 bg-slate-800 text-white rounded-[16px] font-bold text-sm hover:bg-slate-700 transition-colors",
								children: "Close"
							})
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: rejectOpen,
				onOpenChange: setRejectOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md rounded-[32px] border-white shadow-[0_20px_60px_rgb(0,0,0,0.1)] p-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
							className: "text-2xl font-black text-slate-800",
							children: "Reject Order"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium text-slate-500",
							children: "Select a reason. The AI will naturally notify the customer."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroup, {
							value: rejectReason,
							onValueChange: setRejectReason,
							className: "space-y-2 my-4",
							children: rejectReasons.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								htmlFor: r.value,
								className: "flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer has-[:checked]:bg-red-50 has-[:checked]:border-red-200 transition-all font-bold text-slate-700",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupItem, {
									id: r.value,
									value: r.value
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm",
									children: r.label
								})]
							}, r.value))
						}),
						rejectReason === "other" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: rejectOther,
							onChange: (e) => setRejectOther(e.target.value),
							placeholder: "Specify reason...",
							className: "rounded-xl border-slate-200 focus:ring-red-400"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
							className: "mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setRejectOpen(false),
								className: "px-5 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleReject,
								className: "px-6 py-3 rounded-xl font-black bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20",
								children: "Confirm Rejection"
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: sheetOpen,
				onOpenChange: setSheetOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					className: "w-[400px] sm:max-w-[400px] p-0 flex flex-col rounded-l-[32px] border-l border-white shadow-[0_20px_60px_rgb(0,0,0,0.1)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, {
						className: "p-8 border-b border-slate-100 bg-white",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
							className: "text-2xl font-black text-slate-800",
							children: "Quick Replies"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative mt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Search replies...",
								className: "pl-11 py-5 rounded-2xl border-slate-200 bg-slate-50 font-medium text-sm focus:ring-orange-400"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 overflow-y-auto p-6 bg-[#FCFAFA]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Accordion, {
							type: "multiple",
							defaultValue: ["0"],
							className: "space-y-3",
							children: quickReplyCategories.map((cat, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AccordionItem, {
								value: String(i),
								className: "border-none bg-white rounded-[24px] px-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccordionTrigger, {
									className: "text-sm font-black text-slate-700 hover:no-underline",
									children: cat.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccordionContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-3 pb-3 pt-1",
									children: cat.replies.map((r, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-3 p-4 rounded-xl bg-slate-50 hover:bg-orange-50/50 border border-slate-100 transition-colors",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium text-slate-600 flex-1 leading-snug",
											children: r
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												handleSendNote(r);
												setSheetOpen(false);
											},
											className: "shrink-0 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-3.5 w-3.5" })
										})]
									}, j))
								}) })]
							}, i))
						})
					})]
				})
			})
		]
	});
}
//#endregion
export { Dashboard as component };
