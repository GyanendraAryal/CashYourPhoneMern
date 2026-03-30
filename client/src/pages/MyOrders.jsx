import { useMyOrders } from "../hooks/useOrders";
import { Link } from "react-router-dom";
import { OrderListSkeleton } from "../components/skeletons/OrderSkeleton";

export default function MyOrders() {
  const { data, isLoading, error } = useMyOrders();
  
  const orders = Array.isArray(data) ? data : [];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">My Orders</h1>

      {isLoading ? (
        <OrderListSkeleton count={5} />
      ) : error ? (
        <div className="text-sm text-primary-blue-active">
          {error?.message || "Failed to load your orders."}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-text-muted">No orders yet.</div>
      ) : (
        orders.map((o) => {
          const firstItem = o.items?.[0];
          return (
            <div key={o._id || o.id} className="border p-4 mb-3 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow flex gap-4 items-center">
              {firstItem?.thumbnail && (
                <img 
                  src={firstItem.thumbnail} 
                  alt={firstItem.name} 
                  className="w-16 h-16 rounded-xl object-cover border border-border-muted"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-text-primary">
                  Order #{o.orderNumber || o._id || o.id}
                </div>
                <div className="text-sm text-text-muted mt-0.5">
                  Status: <span className={`capitalize font-bold ${o.status === 'completed' ? 'text-green-600' : 'text-primary-blue-active'}`}>{o.status || "unknown"}</span>
                </div>
                <div className="text-sm text-text-muted">
                  Total: <span className="font-bold text-text-primary">NPR {o.total?.toLocaleString() ?? "—"}</span>
                </div>
              </div>
              <div className="shrink-0">
                <Link
                  to={`/my-orders/${o._id || o.id}`}
                  className="inline-block border border-border-muted px-4 py-2 rounded-xl text-sm font-bold hover:bg-surface-white-subtle transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
