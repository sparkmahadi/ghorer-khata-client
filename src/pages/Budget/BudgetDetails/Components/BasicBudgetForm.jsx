import React from 'react';
import axios from 'axios';

const BasicBudgetForm = ({
    editName, setEditName, editOverallBudgetAmount, setEditOverallBudgetAmount, editStartDate, editEndDate, setEditStartDate, setEditEndDate, loading, setIsEditing, setLoading, setError, budgetId, setBudget,
}) => {

    const updateBudget = async (id, budgetData) => {
    try {
        const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/${id}`, budgetData);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in updateBudget:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update budget');
    }
};

const handleApiResponse = (response) => {
    if (response.data.success) {
        return response.data.data;
    } else {
        throw new Error(response.data.message || 'An unknown error occurred');
    }
};


    // --- Main Budget Handlers ---
    const handleEditBudgetSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (new Date(editStartDate) > new Date(editEndDate)) {
            setError('End date cannot be before start date.');
            setLoading(false);
            return;
        }

        try {
            const updatedBudgetData = {
                budgetName: editName, // Use budgetName for consistency with your structure
                overallBudgetAmount: parseFloat(editOverallBudgetAmount),
                period: {
                    startDate: new Date(editStartDate).toISOString(),
                    endDate: new Date(editEndDate).toISOString()
                },
                // Categories and budgetItems are managed separately by backend.
                // When updating the main budget details, we only send the relevant fields.
            };

            const response = await updateBudget(budgetId, updatedBudgetData);
            setBudget(response);
            setIsEditing(false);
            // Using custom modal/toast instead of alert for better UX
            // alert('Budget updated successfully!');
            console.log('Budget updated successfully!'); // Replace with toast/modal
        } catch (err) {
            setError(err.message);
            // alert(`Error updating budget: ${err.message}`);
            console.error(`Error updating budget: ${err.message}`); // Replace with toast/modal
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleEditBudgetSubmit} className="flex flex-col space-y-5 mb-8 p-6 border border-blue-200 rounded-xl bg-blue-50 shadow-inner">
            <h3 className="text-2xl font-bold mb-3 text-blue-800 text-center">Edit Budget Details</h3>
            <label className="block">
                <span className="text-gray-700 font-medium">Budget Name:</span>
                <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-3 text-lg"
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
                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-3 text-lg"
                />
            </label>
            <label className="block">
                <span className="text-gray-700 font-medium">Start Date:</span>
                <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    required
                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-3 text-lg"
                />
            </label>
            <label className="block">
                <span className="text-gray-700 font-medium">End Date:</span>
                <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    required
                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-3 text-lg"
                />
            </label>
            <div className="flex justify-end space-x-4 mt-6">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default BasicBudgetForm;