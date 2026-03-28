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
        orders.map((o) => (
          <div key={o._id || o.id} className="border p-4 mb-2 rounded bg-white shadow-sm">
            <div className="font-medium text-text-primary">
              Order #{o.orderNumber || o._id || o.id}
            </div>
            <div className="text-sm text-text-muted mt-1">
              Status: <span className="capitalize font-semibold text-text-primary">{o.status || "unknown"}</span>
            </div>
            <div className="text-sm text-text-muted">
              Total: <span className="font-semibold text-text-primary">NPR {o.total?.toLocaleString() ?? "—"}</span>
            </div>
            <div className="mt-3">
              <Link
                to={`/my-orders/${o._id || o.id}`}
                className="inline-block border border-border-muted px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-white-subtle transition-colors"
              >
                View details
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
