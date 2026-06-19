import { i as __toESM } from "../_runtime.mjs";
import { a as Trigger2, i as Root2, n as Header, r as Item, t as Content2, v as require_jsx_runtime, y as require_react } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { a as Plus, c as MapPin, d as ChevronDown, f as Check, i as Search, l as Funnel, n as Sparkles, o as Pencil, p as Bell, r as Send, s as MessageCircle, t as X, u as Circle } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as RadioGroupIndicator, r as RadioGroupItem$1, t as RadioGroup$1 } from "../_libs/@radix-ui/react-radio-group+[...].mjs";
import { t as Root } from "../_libs/radix-ui__react-label.mjs";
import { t as Markdown } from "../_libs/react-markdown+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BG5DWYKM.js
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
var initialOrders = [
	{
		id: "WA-00847",
		customer: "Muhammad Bilal",
		phone: "+92 300 1234567",
		address: "House 12, Block 5, Gulshan-e-Iqbal, Karachi",
		type: "DELIVERY",
		payment: "COD",
		items: [
			{
				qty: 2,
				name: "Zinger Burger",
				notes: "extra spicy, no onions",
				price: 700
			},
			{
				qty: 1,
				name: "Large Fries",
				price: 220
			},
			{
				qty: 1,
				name: "Coke 500ml",
				price: 100
			}
		],
		deliveryFee: 100,
		arrivedMinutesAgo: 2,
		status: "pending"
	},
	{
		id: "WA-00846",
		customer: "Ayesha Khan",
		phone: "+92 333 9876543",
		address: "Flat 4B, Sea Breeze Plaza, Clifton, Karachi",
		type: "DELIVERY",
		payment: "COD",
		items: [{
			qty: 1,
			name: "Chicken Tikka Pizza (Large)",
			price: 1450
		}, {
			qty: 2,
			name: "Garlic Bread",
			price: 480
		}],
		deliveryFee: 150,
		arrivedMinutesAgo: 6,
		status: "pending"
	},
	{
		id: "WA-00845",
		customer: "Hassan Tariq",
		phone: "+92 321 5550199",
		type: "TAKEAWAY",
		payment: "CARD",
		items: [{
			qty: 1,
			name: "Beef Shawarma Platter",
			notes: "no garlic sauce",
			price: 650
		}],
		deliveryFee: 0,
		arrivedMinutesAgo: 1,
		status: "pending"
	},
	{
		id: "WA-00844",
		customer: "Fatima Noor",
		phone: "+92 345 1112233",
		address: "C-22, Phase 6, DHA, Karachi",
		type: "DELIVERY",
		payment: "COD",
		items: [{
			qty: 3,
			name: "Chicken Roll",
			price: 750
		}, {
			qty: 2,
			name: "Mint Margarita",
			price: 360
		}],
		deliveryFee: 120,
		arrivedMinutesAgo: 12,
		status: "confirmed"
	}
];
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
function urgencyBorder(mins, selected) {
	if (selected) return "border-l-4 border-slate-800";
	if (mins >= 5) return "border-l-4 border-red-500";
	if (mins >= 3) return "border-l-4 border-amber-500";
	return "border-l-4 border-[#25D366]";
}
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
	const [now, setNow] = (0, import_react.useState)(/* @__PURE__ */ new Date());
	const [showRemove, setShowRemove] = (0, import_react.useState)(false);
	const [showInsights, setShowInsights] = (0, import_react.useState)(false);
	const [insightsReport, setInsightsReport] = (0, import_react.useState)("");
	const [loadingInsights, setLoadingInsights] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t = setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
		return () => clearInterval(t);
	}, []);
	(0, import_react.useEffect)(() => {
		const fetchOrders = async () => {
			try {
				const data = await (await fetch(`${BACKEND_URL}/api/orders`, { headers: { "ngrok-skip-browser-warning": "true" } })).json();
				const parsedOrders = Object.keys(data).map((sessionId) => {
					const o = data[sessionId];
					let uiStatus = "pending";
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
				if (!selectedId && parsedOrders.length > 0) setSelectedId(parsedOrders[0].id);
			} catch (e) {
				console.error("Failed to fetch orders", e);
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
			await fetch(`${BACKEND_URL}/api/orders/${selected.id}/confirm`, {
				method: "POST",
				headers: { "ngrok-skip-browser-warning": "true" }
			});
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
			await fetch(`${BACKEND_URL}/api/orders/${selected.id}/feedback`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"ngrok-skip-browser-warning": "true"
				},
				body: JSON.stringify({ feedback: finalFeedback })
			});
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
			await fetch(`${BACKEND_URL}/api/orders/${selected.id}/note`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"ngrok-skip-browser-warning": "true"
				},
				body: JSON.stringify({ note: noteText })
			});
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
		className: "h-screen w-screen overflow-hidden flex flex-col font-sans antialiased text-slate-900",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes wasi-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.55), 0 6px 14px -4px rgba(37,211,102,0.45); background-color: #25D366; }
          50% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0); background-color: #1fbd5a; }
        }
        .wasi-confirm { animation: wasi-pulse 1.8s ease-in-out infinite; }
        .wasi-confirm:hover { animation: none; background-color: #1fa34a; box-shadow: 0 8px 20px -6px rgba(37,211,102,0.5); }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
      ` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "h-16 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0 border-b border-slate-800",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-7 w-7 rounded-md bg-[#25D366] grid place-items-center text-white font-black text-sm shadow-md",
							children: "W"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-lg tracking-tight",
									children: "WASI"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-5 w-px bg-slate-700" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-400 text-sm",
									children: "Receptionist Dashboard"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hidden md:flex items-center gap-6 text-slate-300 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono font-semibold text-white",
								children: now.toLocaleTimeString("en-GB")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-slate-400",
								children: now.toLocaleDateString("en-GB", {
									weekday: "long",
									day: "numeric",
									month: "long",
									year: "numeric"
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "px-2 py-1 rounded-md bg-slate-800",
									children: ["Today: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "text-white",
										children: stats.total
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "px-2 py-1 rounded-md bg-slate-800",
									children: ["Confirmed: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "text-green-400",
										children: stats.confirmed
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "px-2 py-1 rounded-md bg-slate-800",
									children: ["Rejected: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
										className: "text-red-400",
										children: stats.rejected
									})]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: fetchInsights,
								className: "flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-semibold transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), " AI Insights"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "relative flex h-2 w-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-[#25D366]" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[#25D366] text-sm font-semibold",
									children: "Live"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "relative p-2 rounded-md hover:bg-slate-800 transition-colors",
								"aria-label": "Notifications",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-5 w-5 text-slate-300" }), orders.some((o) => o.status === "pending") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 pl-3 border-l border-slate-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-8 w-8 rounded-full bg-[#25D366] grid place-items-center text-white text-xs font-bold",
									children: "AR"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm",
									children: "Ahmad Raza"
								})]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 flex overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "w-80 border-r border-slate-200 bg-white flex flex-col h-full shrink-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 border-b border-slate-200 sticky top-0 bg-white z-10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between mb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-xs font-semibold text-slate-500 tracking-widest",
									children: "ORDER QUEUE"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full",
									children: [orders.filter((o) => o.status === "pending").length, " active"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-xs text-slate-600",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "flex items-center gap-1.5 hover:text-slate-900 transition-colors",
									children: ["Sort by: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-slate-900",
										children: "Newest"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "p-1.5 rounded-md hover:bg-slate-100",
									"aria-label": "Filter",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "h-4 w-4" })
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 overflow-y-auto scrollbar-thin",
							children: orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full grid place-items-center text-center px-6",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
										className: "h-12 w-12 mx-auto text-slate-300",
										strokeWidth: 1.25
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 font-semibold text-slate-700",
										children: "No orders yet"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-slate-400",
										children: "New orders will appear here automatically."
									})
								] })
							}) : orders.map((o) => {
								const isSelected = o.id === selectedId;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										setSelectedId(o.id);
										setShowRemove(false);
										setNotes("");
										setActivePill(null);
									},
									className: `w-full text-left p-4 border-b border-slate-100 transition-colors ${urgencyBorder(o.arrivedMinutesAgo, isSelected)} ${isSelected ? "bg-slate-100" : "hover:bg-slate-50"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-sm text-slate-900 truncate",
												children: o.customer
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-slate-500 shrink-0",
												children: [o.arrivedMinutesAgo, "m ago"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mt-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-slate-500",
												children: [o.items.reduce((s, i) => s + i.qty, 0), " items"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-sm font-bold text-[#1fa34a]",
												children: ["Rs. ", orderTotal(o).toLocaleString()]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5 mt-2.5 flex-wrap",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `text-[10px] font-bold px-2 py-0.5 rounded-full ${o.type === "DELIVERY" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-orange-50 text-orange-700 border border-orange-200"}`,
													children: o.type
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200",
													children: o.payment
												}),
												o.status === "confirmed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200",
													children: "CONFIRMED"
												}),
												o.status === "rejected" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200",
													children: "REJECTED"
												})
											]
										})
									]
								}, o.id);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 border-t border-slate-200 bg-slate-50 text-center shrink-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-bold text-slate-500 mb-2",
									children: "SCAN TO ORDER (DEMO)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/qr-code.jpeg",
									alt: "WhatsApp QR Code",
									className: "w-40 h-40 mx-auto rounded-lg shadow-sm border border-slate-200 object-cover"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] text-slate-400 mt-2 leading-tight",
									children: "Scan this with your phone camera to chat with the AI Receptionist!"
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 bg-slate-50 overflow-y-auto",
					children: !selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full grid place-items-center px-6 text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-20 w-20 rounded-2xl bg-white border border-slate-200 grid place-items-center mx-auto shadow-sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
									className: "h-10 w-10 text-[#25D366]",
									strokeWidth: 1.5
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 text-lg text-slate-600 font-semibold",
								children: "No active order selected"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-slate-400",
								children: "Click any order from the queue to view details."
							})
						] })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-w-3xl mx-auto p-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-6 border-b border-slate-100 flex items-start justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
										className: "font-bold text-xl tracking-tight",
										children: [
											"#",
											selected.id.substring(0, 8),
											"..."
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-slate-500 mt-0.5",
										children: [
											"Arrived ",
											selected.arrivedMinutesAgo,
											" min ago"
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										selected.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200",
											children: "PENDING REVIEW"
										}),
										selected.status === "confirmed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-bold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200",
											children: "✓ CONFIRMED"
										}),
										selected.status === "rejected" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-bold px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200",
											children: "✕ REJECTED"
										})
									] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-slate-50 p-4 mx-6 mt-6 rounded-lg border border-slate-200/70",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] font-semibold text-slate-500 tracking-widest",
												children: "CUSTOMER"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-bold text-lg mt-1",
												children: selected.customer
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm text-slate-600 flex items-center gap-1.5 mt-0.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4 text-[#25D366]" }), selected.phone]
											})
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] font-semibold text-slate-500 tracking-widest",
												children: "ORDER TYPE"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-bold text-lg mt-1",
												children: selected.type === "DELIVERY" ? "🚚 Delivery" : "🛍️ Takeaway"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm text-slate-600 mt-0.5",
												children: ["Payment: ", selected.payment]
											})
										] })]
									}), selected.address && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 pt-4 border-t border-slate-200",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] font-semibold text-slate-500 tracking-widest",
											children: "DELIVERY ADDRESS"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between gap-3 mt-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm text-slate-700 flex items-start gap-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4 text-slate-500 shrink-0 mt-0.5" }), selected.address]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												className: "p-1.5 rounded-md hover:bg-slate-200 text-slate-500",
												"aria-label": "Edit address",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3.5 w-3.5" })
											})]
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-6 py-6",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-slate-500 font-semibold tracking-wider mb-3",
										children: "ORDER ITEMS"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [selected.items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-3 py-3 border-b border-dashed border-slate-200",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-md shrink-0",
												children: ["x", it.qty]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex-1 min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "font-semibold",
													children: [
														it.name,
														" ",
														it.variant ? `(${it.variant})` : ""
													]
												}), it.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "italic text-sm text-slate-500 mt-0.5",
													children: it.notes
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "font-bold",
												children: ["Rs. ", it.price.toLocaleString()]
											})
										]
									}, i)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										className: "w-full mt-3 py-2.5 text-sm font-semibold text-slate-500 border-2 border-dashed border-slate-300 rounded-md hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), " Add Item"]
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "px-6 py-4 bg-slate-50 border-y border-slate-200/70",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "ml-auto max-w-xs space-y-1.5 text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between text-slate-600",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Subtotal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Rs. ", selected.items.reduce((s, i) => s + i.price, 0).toLocaleString()] })]
											}),
											selected.deliveryFee > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between text-slate-600",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delivery Fee" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Rs. ", selected.deliveryFee] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t-2 border-slate-300 my-2" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between items-center",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-base font-bold",
													children: "TOTAL"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-2xl font-black text-[#25D366]",
													children: ["Rs. ", orderTotal(selected).toLocaleString()]
												})]
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-6 py-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mb-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-slate-500 font-semibold tracking-wider",
												children: "RECEPTIONIST NOTES"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												onClick: () => {
													if (notes) handleSendNote(notes);
												},
												disabled: !notes,
												className: "text-xs font-bold bg-[#25D366] text-white px-3 py-1.5 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-3 w-3" }), " Send Note to AI"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
											value: notes,
											onChange: (e) => setNotes(e.target.value),
											placeholder: "Add any notes before confirming...",
											className: "min-h-[80px] resize-none"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs font-semibold text-slate-500 tracking-wider",
													children: "QUICK REPLIES"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => setSheetOpen(true),
													className: "text-xs font-semibold text-[#25D366] hover:underline",
													children: "View All Quick Replies →"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex gap-2 overflow-x-auto scrollbar-thin pb-2",
												children: quickPills.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => pickPill(p),
													className: `shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${activePill === p ? "bg-[#25D366] text-white border-[#25D366]" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"}`,
													children: p
												}, p))
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-6 border-t border-slate-100 bg-white flex gap-4 sticky bottom-0",
									children: selected.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => setRejectOpen(true),
										className: "flex-1 py-3 px-5 rounded-md font-bold border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), " Reject Order"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: handleConfirm,
										className: "wasi-confirm flex-[2] py-3 px-5 rounded-md font-bold text-white transition-all flex items-center justify-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), " Confirm Order"]
									})] }) : selected.status === "confirmed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 flex flex-col gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											disabled: true,
											className: "w-full py-3 px-5 rounded-md font-bold bg-[#25D366] text-white flex items-center justify-center gap-2 cursor-default",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), " Order Confirmed — Sent to Kitchen"]
										}), showRemove && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												setOrders((p) => p.filter((o) => o.id !== selected.id));
												setSelectedId(orders.find((o) => o.id !== selected.id)?.id ?? "");
											},
											className: "text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors",
											children: "Remove from Queue →"
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										disabled: true,
										className: "flex-1 py-3 px-5 rounded-md font-bold bg-red-50 text-red-700 border border-red-200 flex items-center justify-center gap-2 cursor-default",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), " Order Rejected — AI Notified Customer"]
									})
								})
							]
						})
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: showInsights,
				onOpenChange: setShowInsights,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-2xl max-h-[85vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "flex items-center gap-2 text-indigo-700 text-xl",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-6 w-6" }), " AI Business Insights"]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 p-4 rounded-md bg-slate-50 border border-slate-200",
							children: loadingInsights ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-center justify-center py-10 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "relative flex h-5 w-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative inline-flex rounded-full h-5 w-5 bg-indigo-500" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-slate-500 animate-pulse text-sm",
									children: "AI is analyzing all orders..."
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "prose prose-sm prose-indigo max-w-none prose-headings:mb-2 prose-p:mt-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, { children: insightsReport })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowInsights(false),
							className: "px-4 py-2 bg-slate-900 text-white rounded-md font-semibold text-sm hover:bg-slate-800 transition-colors",
							children: "Close"
						}) })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: rejectOpen,
				onOpenChange: setRejectOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Reject Order" }) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-slate-600",
							children: "Select a reason. The customer will be notified automatically."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroup, {
							value: rejectReason,
							onValueChange: setRejectReason,
							className: "space-y-1 my-2",
							children: rejectReasons.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								htmlFor: r.value,
								className: "flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer has-[:checked]:bg-red-50 has-[:checked]:border-red-300",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupItem, {
									id: r.value,
									value: r.value
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-medium",
									children: r.label
								})]
							}, r.value))
						}),
						rejectReason === "other" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: rejectOther,
							onChange: (e) => setRejectOther(e.target.value),
							placeholder: "Specify reason..."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setRejectOpen(false),
							className: "px-4 py-2 rounded-md font-semibold text-slate-700 hover:bg-slate-100",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: handleReject,
							className: "px-4 py-2 rounded-md font-bold bg-red-600 hover:bg-red-700 text-white",
							children: "Confirm Rejection"
						})] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: sheetOpen,
				onOpenChange: setSheetOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					className: "w-[400px] sm:max-w-[400px] p-0 flex flex-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetHeader, {
						className: "p-6 border-b border-slate-200",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Quick Replies" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative mt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Search replies...",
								className: "pl-9"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 overflow-y-auto p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Accordion, {
							type: "multiple",
							defaultValue: ["0"],
							className: "space-y-2",
							children: quickReplyCategories.map((cat, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AccordionItem, {
								value: String(i),
								className: "border border-slate-200 rounded-lg px-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccordionTrigger, {
									className: "text-sm font-semibold",
									children: cat.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccordionContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-2 pb-2",
									children: cat.replies.map((r, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-2 p-3 rounded-md bg-slate-50 border border-slate-100",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-slate-700 flex-1",
											children: r
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => {
												handleSendNote(r);
												setSheetOpen(false);
											},
											className: "shrink-0 px-2.5 py-1.5 rounded-md bg-[#25D366] hover:bg-green-600 text-white text-xs font-bold flex items-center gap-1 transition-colors",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-3 w-3" }), " Send"]
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
