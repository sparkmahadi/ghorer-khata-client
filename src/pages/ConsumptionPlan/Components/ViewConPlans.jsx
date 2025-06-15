import React, { useCallback, useEffect, useState } from "react";
import { toast } from 'react-toastify';
import { useAuth } from "../../../contexts/AuthContext";
import axios from "axios";
import { updateBudgetFromConsumption } from "../../../api/budgetService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ViewConPlans({ userId }) {
  const { userInfo } = useAuth(); // Assuming userInfo from AuthContext gives you current user's details

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterProductId, setFilterProductId] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  // States for budget selection modal
  const [showBudgetSelectionModal, setShowBudgetSelectionModal] = useState(false);
  const [availableBudgets, setAvailableBudgets] = useState([]);
  const [budgetSelectionLoading, setBudgetSelectionLoading] = useState(false);
  const [budgetSelectionError, setBudgetSelectionError] = useState('');
  const [selectedPlanForBudget, setSelectedPlanForBudget] = useState(null); // Stores the plan object to be added

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

      const fetchedPlans = data.map(plan => ({
        ...plan,
        // Convert date strings from backend to readable format for display
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

  const fetchBudgetsByUserId = async (userId) => {
    console.log('fetchBudgetByuserId');
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/user/${userId}`);
      console.log(response);
      toast.success(response.data.message);
      setLoading(false);
      return (response.data.budgets);
    } catch (error) {
      console.error('Error in fetchBudgetById:', error.response?.data?.message || error.message);
      setLoading(false);
      throw new Error(error.response?.data?.message || 'Failed to fetch budget');
    }
  };

  const fetchUserBudgets = useCallback(async () => {
    setBudgetSelectionLoading(true);
    setBudgetSelectionError('');
    try {
      // Use userInfo._id from AuthContext to fetch budgets for the current user
      const budgetsData = await fetchBudgetsByUserId(userInfo._id); // Call the new API function
      setAvailableBudgets(budgetsData);
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
      setBudgetSelectionError(`Error fetching budgets: ${err.response?.data?.message || err.message}`);
    } finally {
      setBudgetSelectionLoading(false);
    }
  }, [userInfo]); // Depend on userInfo to refetch if user changes

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Handle deletion of a consumption plan
  const handleDelete = async (id) => {
    setError('');
    setDeleteMessage('');
    if (!window.confirm("Are you sure you want to delete this plan?")) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/consumptions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Optionally include authorization header if your backend requires it
          // 'Authorization': `Bearer ${userInfo.token}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }

      setDeleteMessage("Plan deleted successfully!");
      toast.success("Plan deleted successfully!"); // Use toast for better UX
      fetchPlans(); // Refresh the list
    } catch (err) {
      console.error("Failed to delete plan:", err);
      setError(`Error: ${err.message || "Failed to delete plan."}`);
      toast.error(`Error deleting plan: ${err.message || "Please try again."}`);
    }
  };

  // Step 1: User clicks "Add To Budget" on a consumption plan
  const handleAddToBudget = async (planId) => {
    const planToAssociate = plans.find(p => p._id === planId);
    if (!planToAssociate) {
      toast.error("Consumption plan not found.");
      return;
    }
    setSelectedPlanForBudget(planToAssociate); // Store the entire plan object temporarily
    setShowBudgetSelectionModal(true); // Show the budget selection modal
    await fetchUserBudgets(); // Fetch budgets when modal opens
  };

  // Step 2: User selects a budget from the modal to link the plan to
  const handleSelectBudgetForPlan = async (budgetId) => {
    if (!selectedPlanForBudget) {
      toast.error("No consumption plan selected for budget update.");
      return;
    }

    setError('');
    setBudgetSelectionError('');

    try {
      // Prepare the data payload for the backend API,
      // ensuring dates are ISO strings as backend expects
      const updateData = {
        product_id: selectedPlanForBudget.product_id,
        item_name: selectedPlanForBudget.item_name,
        consumption_plan_details: {
          consumptionPlanId: selectedPlanForBudget._id, // Store original plan ID for reference in budget
          startDate: new Date(selectedPlanForBudget.startDate).toISOString(), // Convert to ISO string
          endDate: new Date(selectedPlanForBudget.endDate).toISOString(),     // Convert to ISO string
          daily_quantity: parseFloat(selectedPlanForBudget.daily_quantity),
          unit: selectedPlanForBudget.unit
        }
      };

      console.log(updateData);

      await updateBudgetFromConsumption(budgetId, updateData); // Call the new API to update the budget
      toast.success("Consumption plan successfully linked to budget!");
      setShowBudgetSelectionModal(false); // Close modal after success
      setSelectedPlanForBudget(null); // Clear selected plan from state
      // Optionally, refetch plans or budgets if their display needs to reflect the link
      // fetchPlans();
    } catch (err) {
      console.error("Failed to update budget with consumption plan:", err);
      setBudgetSelectionError(`Error linking plan to budget: ${err.response?.data?.message || err.message}`);
      toast.error(`Failed to link plan to budget: ${err.response?.data?.message || err.message}`);
    }
  };

  // --- Component JSX ---
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
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Product Name</th>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(plan._id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleAddToBudget(plan._id)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        Add To Budget
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Budget Selection Modal/Dialog */}
      {showBudgetSelectionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-xl font-bold text-gray-800">Select a Budget to Link Consumption Plan</h3>
              <button
                onClick={() => setShowBudgetSelectionModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-semibold"
              >
                &times; {/* Close button */}
              </button>
            </div>

            {budgetSelectionLoading && <p className="text-center text-gray-600">Loading budgets...</p>}
            {budgetSelectionError && <p className="text-red-600 mb-4">{budgetSelectionError}</p>}
            {!budgetSelectionLoading && availableBudgets.length === 0 && (
              <p className="text-center text-gray-600">No budgets found. Please create a budget first.</p>
            )}

            {!budgetSelectionLoading && availableBudgets.length > 0 && (
              <ul className="space-y-4">
                {availableBudgets.map(budget => (
                  <li key={budget._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-3 md:mb-0">
                      <h3 className="text-lg font-bold text-gray-800">{budget.budgetName} ({new Date(budget.period.startDate).toLocaleDateString()} - {new Date(budget.period.endDate).toLocaleDateString()})</h3>
                      <p className="text-gray-600 text-sm">Overall Budget: <span className="font-semibold text-green-700">${budget.overallBudgetAmount.toFixed(2)}</span></p>
                      <p className="text-gray-600 text-sm">Allocated: <span className="font-semibold text-blue-700">${budget.overallAllocatedAmount.toFixed(2)}</span> | Utilized: <span className="font-semibold text-red-700">${budget.overallUtilizedAmount.toFixed(2)}</span></p>
                      <p className="text-gray-600 text-sm">Remaining to Allocate: <span className="font-semibold text-indigo-700">${(budget.overallBudgetAmount - budget.overallAllocatedAmount).toFixed(2)}</span> | Remaining to Utilize: <span className="font-semibold text-orange-700">${(budget.overallAllocatedAmount - budget.overallUtilizedAmount).toFixed(2)}</span></p>
                    </div>
                    <div className="flex space-x-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleSelectBudgetForPlan(budget._id)}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-md text-sm transition duration-200 ease-in-out shadow-sm"
                      >
                        Select
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewConPlans;