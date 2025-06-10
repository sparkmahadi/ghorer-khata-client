import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router'; // Using useNavigate for redirect
/**
 * Handles common API response structure for success/error.
 * @param {Object} response - The Axios response object.
 * @returns {Object} - The 'data' payload if successful.
 * @throws {Error} - If the backend indicates an error or a network error occurs.
 */
const handleApiResponse = (response) => {
    if (response.data.success) {
        return response.data.data;
    } else {
        throw new Error(response.data.message || 'An unknown error occurred');
    }
};

const updateBudget = async (id, budgetData) => {
    try {
        const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/${id}`, budgetData);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in updateBudget:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update budget');
    }
};

const deleteBudget = async (id) => {
    try {
        const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/${id}`);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in deleteBudget:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to delete budget');
    }
};


function BudgetDetails() {
    const { budgetId } = useParams();
    const navigate = useNavigate(); // Hook for navigation

    const [budget, setBudget] = useState(null); // Initialize as null to handle loading state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // State for the edit form fields
    const [editName, setEditName] = useState('');
    const [editOverallBudgetAmount, setEditOverallBudgetAmount] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');

    const fetchBudgetById = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/${id}`);
            const fetchedBudget = handleApiResponse(response);
            setBudget(fetchedBudget);
            // Initialize edit form states with fetched data
            setEditName(fetchedBudget.name || '');
            setEditOverallBudgetAmount(fetchedBudget.overallBudgetAmount?.toString() || '');
            // Convert ISO strings to YYYY-MM-DD for date input
            setEditStartDate(fetchedBudget.period?.startDate ? fetchedBudget.period.startDate.split('T')[0] : '');
            setEditEndDate(fetchedBudget.period?.endDate ? fetchedBudget.period.endDate.split('T')[0] : '');
        } catch (err) {
            setError(err.message);
            console.error('Error in fetchBudgetById:', err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (budgetId) {
            fetchBudgetById(budgetId);
        }
    }, [budgetId]);

    // Helper function to format date strings into a readable format
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            // Ensure the date string is trimmed to avoid parsing issues with extra spaces
            const date = new Date(dateString.trim());
            if (isNaN(date.getTime())) {
                throw new Error("Invalid Date"); // Catch invalid date objects
            }
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            console.error("Invalid date string for formatting:", dateString, e);
            return 'Invalid Date';
        }
    };

    // Handler for editing the main budget details
    const handleEditBudgetSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic validation
        if (new Date(editStartDate) > new Date(editEndDate)) {
            setError('End date cannot be before start date.');
            setLoading(false);
            return;
        }

        try {
            const updatedBudgetData = {
                name: editName,
                overallBudgetAmount: parseFloat(editOverallBudgetAmount),
                period: {
                    startDate: new Date(editStartDate).toISOString(),
                    endDate: new Date(editEndDate).toISOString()
                },
                // Categories are managed separately in BudgetDetail component, not here.
                // When updating the main budget, we often don't send the entire categories array back
                // unless we intend to overwrite it completely. For simplicity here,
                // we'll assume categories are stable unless managed explicitly.
                // If the backend needs existing categories, fetch them or pass them.
                categories: budget.categories // Send existing categories back to prevent loss
            };

            const response = await updateBudget(budgetId, updatedBudgetData);
            setBudget(response); // Update local state with the new budget data
            setIsEditing(false); // Exit edit mode
            alert('Budget updated successfully!');
            // You might want to trigger a dashboard refresh here if this component is used in a nested route
            // For now, assuming parent (App.js) won't directly observe this component's budget changes for its dashboard list
        } catch (err) {
            setError(err.message);
            alert(`Error updating budget: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Handler for deleting the budget
    const handleDeleteBudget = async () => {
        if (window.confirm('Are you absolutely sure you want to delete this budget and ALL its associated transactions? This action cannot be undone!')) {
            setLoading(true);
            setError(null);
            try {
                await deleteBudget(budgetId);
                alert('Budget deleted successfully!');
                navigate('/'); // Redirect to the dashboard or home page after deletion
            } catch (err) {
                setError(err.message);
                alert(`Error deleting budget: ${err.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading && !budget) return <p className="text-center py-4 text-gray-600">Loading budget details...</p>;
    if (error) return <p className="text-center text-red-600 py-4 font-medium">Error: {error}</p>;
    if (!budget) return <p className="text-center py-4 text-gray-600">Budget not found or has been deleted.</p>;

    // Extract and default financial amounts to 0 if they are undefined or null
    const overallBudgetAmount = budget.overallBudgetAmount || 0;
    const overallAllocatedAmount = budget.overallAllocatedAmount || 0;
    const overallUtilizedAmount = budget.overallUtilizedAmount || 0;

    // Calculate derived financial fields
    const remainingToAllocate = overallBudgetAmount - overallAllocatedAmount;
    const remainingToUtilize = overallAllocatedAmount - overallUtilizedAmount;

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200 mx-auto max-w-2xl my-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-700 text-center">Budget Overview</h2>

            {/* Action Buttons: Edit and Delete */}
            <div className="flex justify-center space-x-4 mb-6">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-5 rounded-lg transition duration-200 ease-in-out shadow-md"
                >
                    {isEditing ? 'Cancel Edit' : 'Edit Budget'}
                </button>
                <button
                    onClick={handleDeleteBudget}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-lg transition duration-200 ease-in-out shadow-md"
                >
                    Delete Budget
                </button>
            </div>

            {isEditing ? (
                // Edit Form Mode
                <form onSubmit={handleEditBudgetSubmit} className="flex flex-col space-y-4 mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h3 className="text-xl font-semibold mb-2 text-blue-800">Edit Budget Details</h3>
                    <label className="block">
                        <span className="text-gray-700 font-medium">Budget Name:</span>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                        />
                    </label>
                    <label className="block">
                        <span className="text-gray-700 font-medium">Overall Budget Amount:</span>
                        <input
                            type="number"
                            value={editOverallBudgetAmount}
                            onChange={(e) => setEditOverallBudgetAmount(e.target.value)}
                            required
                            step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                        />
                    </label>
                    <label className="block">
                        <span className="text-gray-700 font-medium">Start Date:</span>
                        <input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                        />
                    </label>
                    <label className="block">
                        <span className="text-gray-700 font-medium">End Date:</span>
                        <input
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                        />
                    </label>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            disabled={loading}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                // View Mode
                <>
                    {/* User and ID Information Section */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                        <p className="text-gray-700 mb-1">
                            <strong className="font-semibold text-gray-800">Budget ID:</strong> {budget.id || 'N/A'}
                        </p>
                        <p className="text-gray-700 mb-1">
                            <strong className="font-semibold text-gray-800">User ID:</strong> {budget.userId || 'N/A'}
                        </p>
                        <p className="text-gray-700">
                            <strong className="font-semibold text-gray-800">Username:</strong> {budget.username || 'N/A'}
                        </p>
                    </div>

                    {/* Budget Period Details Section */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                        <h3 className="text-xl font-semibold mb-2 text-gray-800">Budget Period</h3>
                        <p className="text-gray-700 mb-1">
                            <strong className="font-semibold text-gray-800">Start Date:</strong> {formatDate(budget.period?.startDate)}
                        </p>
                        <p className="text-gray-700">
                            <strong className="font-semibold text-gray-800">End Date:</strong> {formatDate(budget.period?.endDate)}
                        </p>
                    </div>

                    {/* Financial Summaries Section - Uses a grid for better layout on wider screens */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-gray-200">
                        <div>
                            <p className="text-gray-700 mb-1">
                                <strong className="font-semibold text-gray-800">Overall Budget:</strong>
                                <span className="text-green-600 font-bold ml-2">${overallBudgetAmount.toFixed(2)}</span>
                            </p>
                            <p className="text-gray-700 mb-1">
                                <strong className="font-semibold text-gray-800">Total Allocated:</strong>
                                <span className="text-blue-600 font-bold ml-2">${overallAllocatedAmount.toFixed(2)}</span>
                            </p>
                            <p className="text-gray-700">
                                <strong className="font-semibold text-gray-800">Remaining to Allocate:</strong>
                                <span className="text-indigo-600 font-bold ml-2">${remainingToAllocate.toFixed(2)}</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-700 mb-1">
                                <strong className="font-semibold text-gray-800">Total Utilized:</strong>
                                <span className="text-red-600 font-bold ml-2">${overallUtilizedAmount.toFixed(2)}</span>
                            </p>
                            <p className="text-gray-700">
                                <strong className="font-semibold text-gray-800">Remaining to Utilize:</strong>
                                <span className="text-orange-600 font-bold ml-2">${remainingToUtilize.toFixed(2)}</span>
                            </p>
                        </div>
                    </div>

                    {/* Categories Section */}
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3 text-gray-800">Categories</h3>
                        {budget.categories && budget.categories.length > 0 ? (
                            <ul className="space-y-4">
                                {budget.categories.map(category => (
                                    <li key={category.id} className="bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-100">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-1">{category.name}</h4>
                                        <p className="text-gray-700 text-sm mb-2">
                                            Allocated: <span className="font-semibold text-blue-600">${(category.allocatedAmount || 0).toFixed(2)}</span> |
                                            Utilized: <span className="font-semibold text-red-600">${(category.utilizedAmount || 0).toFixed(2)}</span>
                                        </p>
                                        {category.subcategories && category.subcategories.length > 0 && (
                                            <div className="ml-4 pt-2 border-t border-gray-200">
                                                <p className="text-gray-700 text-sm font-medium mb-1">Subcategories:</p>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                                    {category.subcategories.map(subcat => (
                                                        <li key={subcat.id}>
                                                            {subcat.name} (Allocated: <span className="font-semibold text-blue-500">${(subcat.allocatedAmount || 0).toFixed(2)}</span> | Utilized: <span className="font-semibold text-red-500">${(subcat.utilizedAmount || 0).toFixed(2)}</span>)
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600 text-center py-2">No categories defined for this budget.</p>
                        )}
                    </div>

                    {/* Log Timestamps Section */}
                    <div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-800">Logs</h3>
                        <p className="text-gray-700 mb-1">
                            <strong className="font-semibold text-gray-800">Created At:</strong> {formatDate(budget.createdAt)}
                        </p>
                        <p className="text-gray-700">
                            <strong className="font-semibold text-gray-800">Last Updated At:</strong> {formatDate(budget.lastUpdatedAt)}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}

export default BudgetDetails;
