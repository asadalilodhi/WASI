from typing import TypedDict, List, Dict, Optional, Any, Annotated
import operator

class State(TypedDict):
    """
    Represents the state of a single customer's order session in LangGraph.
    This replaces the in-memory Javascript `order` object.
    """
    session_id: str
    phone_number: str
    
    # Cart details
    cart_items: List[Dict[str, Any]]
    in_progress_items: List[Dict[str, Any]] # Items that are missing details (size/flavor)
    
    # Missing fields explicit tracking
    order_type: Optional[str]        # 'Delivery' or 'Takeaway'
    delivery_address: Optional[str]  # e.g., '123 Main St'
    payment_method: Optional[str]    # 'Cash' or 'Card'
    customer_name: Optional[str]     # e.g., 'John Doe'
    delivery_number: Optional[str]   # e.g., 'Alternate number for delivery'
    
    # Customer Profile Tracking
    is_returning_user: bool          # True if they have ordered before
    last_order: Optional[Dict[str, Any]] # Their previous order from Supabase
    is_ordering_complete: bool       # True if the user has confirmed they are done adding items to the cart
    
    # Extra state variables
    order_status: str                # e.g., 'ORDERING', 'REVIEWING', 'SUBMITTED', 'REVISION_NEEDED'
    receptionist_notes: List[str]    # Any feedback from the receptionist
    pending_clarifications: List[str] # Questions the menu agent needs answered before adding to cart
    
    # Conversation tracking
    messages: Annotated[List[Dict[str, str]], operator.add]   # History of the conversation
    language: str                    # Detected language (e.g., 'ROMAN-URDU', 'ENGLISH')
