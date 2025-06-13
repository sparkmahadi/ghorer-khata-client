import React, { useCallback, useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ViewConPlans({ userId }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filterProductId, setFilterProductId] = useState('');
    const [deleteMessage, setDeleteMessage] = useState('');

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    setDeleteMessage('');
    if (!userId) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    try {
      let url = `${BASE_URL}/api/consumptions?userId=${userId}`;
      if (filterProductId) {
        url += `&product_id=${filterProductId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }

      // Convert date strings from backend to readable format
      const fetchedPlans = data.map(plan => ({
        ...plan,
        startDate: new Date(plan.startDate).toLocaleDateString(),
        endDate: new Date(plan.endDate).toLocaleDateString(),
        createdAt: new Date(plan.createdAt).toLocaleString()
      }));
      setPlans(fetchedPlans);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      setError(`Error: ${err.message || "Failed to fetch plans."}`);
    } finally {
      setLoading(false);
    }
  }, [userId, filterProductId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDelete = async (id) => {
    setError('');
    setDeleteMessage('');
    // Using window.confirm as per instructions for confirmation dialogs
    if (!window.confirm("Are you sure you want to delete this plan?")) {
        return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/consumptions/${id}`, {
        method: 'DELETE',
        // Include userId in headers or body if your backend requires it for deletion authorization
        // headers: { 'X-User-Id': userId }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }

      setDeleteMessage("Plan deleted successfully!");
      fetchPlans(); // Refresh the list
    } catch (err) {
      console.error("Failed to delete plan:", err);
      setError(`Error: ${err.message || "Failed to delete plan."}`);
    }
  };

    return (
        <div className="bg-purple-50 p-6 rounded-lg shadow-inner">
            <h2 className="text-2xl font-bold text-purple-700 mb-4 text-center">Your Consumption Plans</h2>
            <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
                <input
                    type="text"
                    placeholder="Filter by Product ID"
                    value={filterProductId}
                    onChange={(e) => setFilterProductId(e.target.value)}
                    className="flex-grow mt-1 block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
                <button
                    onClick={fetchPlans}
                    className="px-6 py-2 rounded-md font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Apply Filter / Refresh'}
                </button>
            </div>

            {error && <p className="text-red-600 mb-4">{error}</p>}
            {deleteMessage && <p className="text-green-600 mb-4">{deleteMessage}</p>}

            {loading && <p className="text-center text-gray-600">Loading plans...</p>}
            {!loading && plans.length === 0 && <p className="text-center text-gray-600">No consumption plans found.</p>}

            {!loading && plans.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg shadow-md">
                        <thead className="bg-purple-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider rounded-tl-lg">Product ID</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider rounded-tl-lg">Product Name</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Quantity/Day</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Unit</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Start Date</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">End Date</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Notes</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {plans?.map((plan) => (
                                <tr key={plan._id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{plan.product_id}</td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{plan.item_name}</td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{plan.daily_quantity}</td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{plan.unit}</td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{plan.startDate}</td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{plan.endDate}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900 break-words max-w-xs">{plan.notes}</td>
                                    <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(plan._id)}
                                            className="text-red-600 hover:text-red-900 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ViewConPlans;