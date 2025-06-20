import React, { useCallback, useEffect, useState } from "react";
import { toast } from 'react-toastify';
import { useAuth } from "../../../contexts/AuthContext";
import axios from "axios";
// Assuming updateBudgetFromConsumption is correctly imported from your api/budgetService
import { updateBudgetFromConsumption } from "../../../api/budgetService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ViewConPlans({ userId }) {
    const { userInfo } = useAuth();

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deleteMessage, setDeleteMessage] = useState('');

    // Filter states
    const [filterProductId, setFilterProductId] = useState('');
    const [filterItemName, setFilterItemName] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [isFilterApplied, setIsFilterApplied] = useState(false);

    // State for consumption summary
    const [consumptionSummary, setConsumptionSummary] = useState([]);

    // States for budget selection modal
    const [showBudgetSelectionModal, setShowBudgetSelectionModal] = useState(false);
    const [availableBudgets, setAvailableBudgets] = useState([]);
    const [budgetSelectionLoading, setBudgetSelectionLoading] = useState(false);
    const [budgetSelectionError, setBudgetSelectionError] = useState('');
    const [selectedPlanForBudget, setSelectedPlanForBudget] = useState(null);

    // Debounce for filter inputs to prevent too many API calls
    const [debouncedFilterProductId, setDebouncedFilterProductId] = useState(filterProductId);
    const [debouncedFilterItemName, setDebouncedFilterItemName] = useState(filterItemName);

    // State for editing consumption plan
    const [editingPlan, setEditingPlan] = useState(null); // Holds the plan being edited

    // --- NEW STATE FOR CONFIRMATION ---
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [confirmationDetails, setConfirmationDetails] = useState({
        budgetId: null,
        planId: null,
        budgetName: '',
        itemName: '',
        action: '' // 'add' or 'update'
    });


    // Effect for debouncing product ID and item name filters
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilterProductId(filterProductId);
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [filterProductId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilterItemName(filterItemName);
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [filterItemName]);

    // Update fetchPlans dependency on debounced values
    useEffect(() => {
        fetchPlans();
    }, [debouncedFilterProductId, debouncedFilterItemName, filterStartDate, filterEndDate, userId]);


    const formatDateForInput = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const calculateTotalQuantityForPlan = useCallback((plan) => {
        if (!plan || typeof plan.daily_quantity !== 'number' || !plan.startDate || !plan.endDate) {
            return { consumedTillToday: 0, remainingToConsume: 0 };
        }

        const { startDate, endDate, daily_quantity } = plan;

        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setUTCHours(0, 0, 0, 0);

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        let consumedTillToday = 0;
        let remainingToConsume = 0;

        const totalPlanDurationMs = end.getTime() - start.getTime();
        const totalPlanDays = Math.floor(totalPlanDurationMs / (1000 * 60 * 60 * 24)) + 1;

        if (today < start) {
            consumedTillToday = 0;
            remainingToConsume = totalPlanDays * daily_quantity;
        } else if (today >= end) {
            consumedTillToday = totalPlanDays * daily_quantity;
            remainingToConsume = 0;
        } else {
            const elapsedMs = today.getTime() - start.getTime();
            const daysPassedInclusive = Math.floor(elapsedMs / (1000 * 60 * 60 * 24)) + 1;
            consumedTillToday = daysPassedInclusive * daily_quantity;

            remainingToConsume = Math.max(0, (totalPlanDays * daily_quantity) - consumedTillToday);
        }

        return { consumedTillToday, remainingToConsume };
    }, []);

    const calculateConsumptionSummary = useCallback((currentPlans) => {
        const summary = new Map();

        currentPlans.forEach(plan => {
            const { consumedTillToday, remainingToConsume } = calculateTotalQuantityForPlan(plan);
            const key = plan.item_name;

            if (summary.has(key)) {
                const existing = summary.get(key);
                summary.set(key, {
                    ...existing,
                    totalConsumedQuantity: existing.totalConsumedQuantity + consumedTillToday,
                    totalRemainingQuantity: existing.totalRemainingQuantity + remainingToConsume,
                    unit: plan.unit
                });
            } else {
                summary.set(key, {
                    item_name: plan.item_name,
                    totalConsumedQuantity: consumedTillToday,
                    totalRemainingQuantity: remainingToConsume,
                    unit: plan.unit
                });
            }
        });
        setConsumptionSummary(Array.from(summary.values()));
    }, [calculateTotalQuantityForPlan]);

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        setError('');
        setDeleteMessage('');
        if (!userId) {
            setError("User not authenticated.");
            setLoading(false);
            return;
        }

        const isAnyFilterActive = debouncedFilterProductId || debouncedFilterItemName || filterStartDate || filterEndDate;
        setIsFilterApplied(isAnyFilterActive);

        try {
            let url = new URL(`${BASE_URL}/api/consumptions`);
            url.searchParams.append('userId', userId);

            if (debouncedFilterProductId) {
                url.searchParams.append('product_id', debouncedFilterProductId);
            }
            if (debouncedFilterItemName) {
                url.searchParams.append('item_name', debouncedFilterItemName);
            }
            if (filterStartDate) {
                url.searchParams.append('startDate', filterStartDate);
            }
            if (filterEndDate) {
                url.searchParams.append('endDate', filterEndDate);
            }

            const response = await fetch(url.toString());
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }

            const fetchedPlans = data.map(plan => ({
                ...plan,
                formattedStartDate: new Date(plan.startDate).toLocaleDateString(),
                formattedEndDate: new Date(plan.endDate).toLocaleDateString(),
                originalStartDate: plan.startDate,
                originalEndDate: plan.endDate,
                createdAt: new Date(plan.createdAt).toLocaleString()
            }));
            setPlans(fetchedPlans);
            calculateConsumptionSummary(data);
        } catch (err) {
            console.error("Failed to fetch plans:", err);
            setError(`Error: ${err.message || "Failed to fetch plans."}`);
        } finally {
            setLoading(false);
        }
    }, [userId, debouncedFilterProductId, debouncedFilterItemName, filterStartDate, filterEndDate, calculateConsumptionSummary]);

    const handleThisMonth = () => {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        setFilterStartDate(formatDateForInput(firstDayOfMonth));
        setFilterEndDate(formatDateForInput(lastDayOfMonth));
    };

    const handleClearFilters = () => {
        setFilterProductId('');
        setFilterItemName('');
        setFilterStartDate('');
        setFilterEndDate('');
    };

    const fetchBudgetsByUserId = async (userId) => {
        setBudgetSelectionLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/api/budgets/user/${userId}`);
            // toast.success("Budgets fetched successfully!"); // Keep this toast only for successful linking, not just fetching budgets.
            return response.data.budgets;
        } catch (error) {
            console.error('Error in fetchBudgetsByUserId:', error.response?.data?.message || error.message);
            throw new Error(error.response?.data?.message || 'Failed to fetch budgets');
        } finally {
            setBudgetSelectionLoading(false);
        }
    };

    const fetchUserBudgets = useCallback(async () => {
        setBudgetSelectionError('');
        try {
            const budgetsData = await fetchBudgetsByUserId(userInfo._id);
            setAvailableBudgets(budgetsData);
        } catch (err) {
            setBudgetSelectionError(`Error fetching budgets: ${err.message}`);
        }
    }, [userInfo]);

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
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }

            setDeleteMessage("Plan deleted successfully!");
            toast.success("Plan deleted successfully!");
            fetchPlans();
        } catch (err) {
            console.error("Failed to delete plan:", err);
            setError(`Error: ${err.message || "Failed to delete plan."}`);
            toast.error(`Error deleting plan: ${err.message || "Please try again."}`);
        }
    };

    // --- MODIFIED handleAddToBudget ---
    const handleAddToBudget = async (planId) => {
        const planToAssociate = plans.find(p => p._id === planId);
        if (!planToAssociate) {
            toast.error("Consumption plan not found.");
            return;
        }
        setSelectedPlanForBudget(planToAssociate);
        // Show budget selection modal first
        setShowBudgetSelectionModal(true);
        await fetchUserBudgets();
    };

    // --- NEW function to proceed with actual API call after confirmation ---
    const confirmAndExecuteBudgetLink = async (budgetId, planId, action) => {
        setShowConfirmationModal(false); // Close confirmation modal
        const planToAssociate = plans.find(p => p._id === planId);
        if (!planToAssociate) {
            toast.error("Consumption plan not found for linking.");
            return;
        }

        setError('');
        setBudgetSelectionError('');

        try {
            const updateData = {
                product_id: planToAssociate.product_id,
                item_name: planToAssociate.item_name,
                consumption_plan_details: {
                    consumptionPlanId: planToAssociate._id,
                    startDate: planToAssociate.originalStartDate,
                    endDate: planToAssociate.originalEndDate,
                    daily_quantity: parseFloat(planToAssociate.daily_quantity),
                    unit: planToAssociate.unit
                }
            };

            const response = await updateBudgetFromConsumption(budgetId, updateData); // This function should make the API call
            // Check the 'operation' field from the backend response
            const backendOperation = response.operation;
            const message = backendOperation === 'added'
                ? `Successfully added "${planToAssociate.item_name}" to budget "${response.budgetName}"!`
                : `Successfully updated "${planToAssociate.item_name}" in budget "${response.budgetName}"!`;

            toast.success(message);
            setShowBudgetSelectionModal(false); // Close budget selection modal
            setSelectedPlanForBudget(null); // Clear selected plan
            // You might want to re-fetch budgets or update local budget state here if needed
            // For now, just close modals and show toast.
        } catch (err) {
            console.error("Failed to link consumption plan to budget:", err);
            setBudgetSelectionError(`Error linking plan to budget: ${err.response?.data?.message || err.message}`);
            toast.error(`Failed to link plan to budget: ${err.response?.data?.message || err.message}`);
        }
    };


    // --- MODIFIED handleSelectBudgetForPlan ---
    const handleSelectBudgetForPlan = async (budgetId) => {
        if (!selectedPlanForBudget) {
            toast.error("No consumption plan selected for budget update.");
            return;
        }

        const budgetChosen = availableBudgets.find(b => b._id === budgetId);
        if (!budgetChosen) {
            toast.error("Selected budget not found.");
            return;
        }

        // Check if the item already exists in the selected budget
        const itemExistsInBudget = budgetChosen.budgetItems.some(
            item => item.product_id === selectedPlanForBudget.product_id
        );

        const actionType = itemExistsInBudget ? 'update' : 'add';

        // Set confirmation details and show modal
        setConfirmationDetails({
            budgetId: budgetId,
            planId: selectedPlanForBudget._id,
            budgetName: budgetChosen.budgetName,
            itemName: selectedPlanForBudget.item_name,
            action: actionType
        });
        setShowConfirmationModal(true); // Show confirmation modal
    };


    const handleEdit = (plan) => {
        setEditingPlan({
            ...plan,
            startDate: formatDateForInput(plan.originalStartDate),
            endDate: formatDateForInput(plan.originalEndDate)
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditingPlan(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdatePlan = async (e) => {
        e.preventDefault();
        setError('');
        if (!editingPlan) return;

        try {
            const response = await fetch(`${BASE_URL}/api/consumptions/${editingPlan._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: editingPlan.product_id,
                    item_name: editingPlan.item_name,
                    daily_quantity: parseFloat(editingPlan.daily_quantity),
                    unit: editingPlan.unit,
                    startDate: editingPlan.startDate,
                    endDate: editingPlan.endDate,
                    notes: editingPlan.notes
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }

            toast.success("Consumption plan updated successfully!");
            setEditingPlan(null); // Close the modal
            fetchPlans(); // Refresh the list of plans
        } catch (err) {
            console.error("Failed to update plan:", err);
            setError(`Error updating plan: ${err.message || "Please try again."}`);
            toast.error(`Error updating plan: ${err.message || "Please try again."}`);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8 lg:p-10">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-8">
                    Your Consumption Plans
                </h1>

                {/* Filters Section */}
                {/* ... (existing filter section code) ... */}
                <div className="bg-purple-50 p-6 rounded-lg shadow-inner mb-8">
                    <h2 className="text-xl font-bold text-purple-700 mb-4">Find & Filter Plans</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label htmlFor="filterProductId" className="block text-sm font-medium text-gray-700">Product ID:</label>
                            <input
                                type="text"
                                id="filterProductId"
                                placeholder="e.g., item001"
                                value={filterProductId}
                                onChange={(e) => setFilterProductId(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="filterItemName" className="block text-sm font-medium text-gray-700">Item Name:</label>
                            <input
                                type="text"
                                id="filterItemName"
                                placeholder="e.g., Chaul"
                                value={filterItemName}
                                onChange={(e) => setFilterItemName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700">Start Date:</label>
                            <input
                                type="date"
                                id="filterStartDate"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700">End Date:</label>
                            <input
                                type="date"
                                id="filterEndDate"
                                value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                            />
                        </div>
                        <div className="flex flex-col justify-end">
                            <button
                                onClick={handleThisMonth}
                                className="w-full py-2.5 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 text-sm transition-colors font-medium"
                            >
                                <span className="mr-2">📅</span> This Month
                            </button>
                        </div>
                        <div className="flex flex-col justify-end">
                            <button
                                onClick={fetchPlans}
                                className="w-full py-2.5 px-6 rounded-md font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? 'Searching...' : 'Search Plans'}
                            </button>
                        </div>
                    </div>
                    {(filterProductId || filterItemName || filterStartDate || filterEndDate) && (
                        <button
                            onClick={handleClearFilters}
                            className="mt-4 px-6 py-2.5 rounded-md font-semibold text-purple-700 border border-purple-300 bg-white hover:bg-purple-50 transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Consumption Summary */}
                {/* ... (existing consumption summary code) ... */}
                <div className="bg-indigo-50 p-6 rounded-lg shadow-inner mb-8">
                    <h2 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                        <span className="mr-2">📊</span> Consumption Summary
                    </h2>
                    {loading && consumptionSummary.length === 0 && <p className="text-gray-600">Calculating summary...</p>}
                    {!loading && consumptionSummary.length === 0 ? (
                        <p className="text-gray-600">No consumption data to summarize for the current filters.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {consumptionSummary.map((summaryItem, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-indigo-200">
                                    <h3 className="font-semibold text-gray-800 text-lg">{summaryItem.item_name}</h3>
                                    <p className="text-gray-700">
                                        Consumed (Approx.): <span className="font-bold text-indigo-600">
                                            {summaryItem.totalConsumedQuantity.toFixed(2)} {summaryItem.unit}
                                        </span>
                                    </p>
                                    <p className="text-gray-700">
                                        Remaining: <span className="font-bold text-teal-600">
                                            {summaryItem.totalRemainingQuantity.toFixed(2)} {summaryItem.unit}
                                        </span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>


                {error && <p className="text-red-600 mb-4 p-3 bg-red-100 rounded-md border border-red-200">{error}</p>}
                {deleteMessage && <p className="text-green-600 mb-4 p-3 bg-green-100 rounded-md border border-green-200">{deleteMessage}</p>}

                {/* Conditional Display of Plans Table */}
                {/* ... (existing table and loading state code) ... */}
                {loading && (
                    <div className="flex items-center justify-center h-48 bg-white rounded-xl shadow-lg">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
                        <p className="ml-4 text-gray-600 text-lg">Loading consumption plans...</p>
                    </div>
                )}

                {(!loading && plans.length > 0) && (isFilterApplied || plans.length <= 20) ? (
                    <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                        <table className="min-w-full bg-white divide-y divide-gray-200">
                            <thead className="bg-purple-100">
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider rounded-tl-lg">Product ID</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product Name</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity/Day</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Start Date</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">End Date</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Consumed (Approx.)</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Remaining to Consume</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Notes</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {plans?.map((plan) => {
                                    const { consumedTillToday, remainingToConsume } = calculateTotalQuantityForPlan(plan);
                                    return (
                                        <tr key={plan._id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{plan.product_id}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{plan.item_name}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{plan.daily_quantity}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{plan.unit}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{plan.formattedStartDate}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900">{plan.formattedEndDate}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {consumedTillToday.toFixed(2)} {plan.unit}
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900 font-medium text-teal-700">
                                                {remainingToConsume.toFixed(2)} {plan.unit}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-900 break-words max-w-xs">{plan.notes || 'N/A'}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(plan)}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors font-medium py-1.5 px-3 rounded-md border border-blue-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(plan._id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors font-medium py-1.5 px-3 rounded-md border border-red-300"
                                                    >
                                                        Delete
                                                    </button>
                                                    <button
                                                        onClick={() => handleAddToBudget(plan._id)}
                                                        className="text-purple-600 hover:text-purple-900 transition-colors font-medium py-1.5 px-3 rounded-md border border-purple-300"
                                                    >
                                                        Add To Budget
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    (!loading && plans.length === 0 && !isFilterApplied) ? (
                        <p className="text-center text-gray-600 p-6 bg-gray-50 rounded-lg border border-gray-200">
                            Use the filters above to find specific consumption plans.
                        </p>
                    ) : !loading && plans.length > 20 && !isFilterApplied ? (
                        <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-600 text-lg mb-4">
                                Over {plans.length} consumption plans found. For better performance, please use the filters to narrow down the results.
                            </p>
                            <button
                                onClick={() => { /* Implement a way to show all plans, perhaps by temporarily overriding the conditional */ }}
                                className="px-6 py-2.5 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                Show All {plans.length} Plans (might be slow)
                            </button>
                        </div>
                    ) : null
                )}


                {/* Budget Selection Modal/Dialog */}
                {showBudgetSelectionModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="text-xl font-bold text-gray-800">Select a Budget to Link Consumption Plan</h3>
                                <button
                                    onClick={() => setShowBudgetSelectionModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl font-semibold p-2 rounded-full hover:bg-gray-100"
                                >
                                    &times;
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
                                                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 px-4 rounded-md text-sm transition duration-200 ease-in-out shadow-sm"
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

                {/* --- Edit Consumption Plan Modal --- */}
                {editingPlan && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="text-2xl font-bold text-gray-800">Edit Consumption Plan</h3>
                                <button
                                    onClick={() => setEditingPlan(null)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl font-semibold p-2 rounded-full hover:bg-gray-100"
                                >
                                    &times;
                                </button>
                            </div>

                            {error && <p className="text-red-600 mb-4">{error}</p>}

                            <form onSubmit={handleUpdatePlan} className="space-y-4">
                                <div>
                                    <label htmlFor="editProductId" className="block text-sm font-medium text-gray-700">Product ID:</label>
                                    <input
                                        type="text"
                                        id="editProductId"
                                        name="product_id"
                                        value={editingPlan.product_id || ''}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="editItemName" className="block text-sm font-medium text-gray-700">Item Name:</label>
                                    <input
                                        type="text"
                                        id="editItemName"
                                        name="item_name"
                                        value={editingPlan.item_name || ''}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="editDailyQuantity" className="block text-sm font-medium text-gray-700">Daily Quantity:</label>
                                    <input
                                        type="number"
                                        id="editDailyQuantity"
                                        name="daily_quantity"
                                        value={editingPlan.daily_quantity || ''}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="editUnit" className="block text-sm font-medium text-gray-700">Unit:</label>
                                    <input
                                        type="text"
                                        id="editUnit"
                                        name="unit"
                                        value={editingPlan.unit || ''}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="editStartDate" className="block text-sm font-medium text-gray-700">Start Date:</label>
                                    <input
                                        type="date"
                                        id="editStartDate"
                                        name="startDate"
                                        value={editingPlan.startDate || ''}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="editEndDate" className="block text-sm font-medium text-gray-700">End Date:</label>
                                    <input
                                        type="date"
                                        id="editEndDate"
                                        name="endDate"
                                        value={editingPlan.endDate || ''}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="editNotes" className="block text-sm font-medium text-gray-700">Notes:</label>
                                    <textarea
                                        id="editNotes"
                                        name="notes"
                                        value={editingPlan.notes || ''}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                    ></textarea>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setEditingPlan(null)}
                                        className="px-6 py-2.5 rounded-md font-semibold text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 rounded-md font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                                    >
                                        Update Plan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- NEW Confirmation Modal --- */}
                {showConfirmationModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="text-xl font-bold text-gray-800">Confirm Action</h3>
                                <button
                                    onClick={() => setShowConfirmationModal(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl font-semibold p-2 rounded-full hover:bg-gray-100"
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="mb-6 text-gray-700">
                                {confirmationDetails.action === 'update' ? (
                                    <p>
                                        The item "<span className="font-semibold">{confirmationDetails.itemName}</span>" (Product ID: <span className="font-semibold">{selectedPlanForBudget?.product_id}</span>) already exists in budget "<span className="font-semibold">{confirmationDetails.budgetName}</span>".
                                        Do you want to <span className="font-bold text-orange-600">update its consumption plan</span>?
                                    </p>
                                ) : (
                                    <p>
                                        Are you sure you want to <span className="font-bold text-green-600">add</span> the item "<span className="font-semibold">{confirmationDetails.itemName}</span>" (Product ID: <span className="font-semibold">{selectedPlanForBudget?.product_id}</span>) to budget "<span className="font-semibold">{confirmationDetails.budgetName}</span>"?
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowConfirmationModal(false)}
                                    className="px-6 py-2.5 rounded-md font-semibold text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => confirmAndExecuteBudgetLink(confirmationDetails.budgetId, confirmationDetails.planId, confirmationDetails.action)}
                                    className="px-6 py-2.5 rounded-md font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                                >
                                    {confirmationDetails.action === 'update' ? 'Confirm Update' : 'Confirm Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default ViewConPlans;