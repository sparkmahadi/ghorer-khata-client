import React, { useEffect, useState } from 'react';
import { deleteBudget } from '../../api/budgetService'; // Keep deleteBudget from service
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios'; // Directly use axios for fetchBudgetsByUserId
import { useNavigate } from 'react-router';

function BudgetDashboard({ onSelectBudget, refreshTrigger, onDeleteBudget }) {
    const { userInfo, isAuthenticated, loading: authLoading } = useAuth(); // Destructure authLoading
    const navigate = useNavigate();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true); // Separate loading state for budgets
    const [error, setError] = useState(null);

  

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this budget and all its transactions? This action cannot be undone.')) {
            try {
                setLoading(true);
                setError(null);
                await deleteBudget(id); // Use the centralized service for deletion
                alert('Budget deleted successfully!'); // Provide user feedback
                onDeleteBudget(); // Inform parent to refresh dashboard
                // After deletion, re-fetch budgets to update the list immediately
                if (isAuthenticated && userInfo?._id) {
                    fetchBudgetsForUser(userInfo._id);
                }
            } catch (err) {
                alert(`Error deleting budget: ${err.message}`);
                setError(err.message); // Display error on component
            } finally {
                setLoading(false);
            }
        }
    };

    // Show a general loading message if authentication is still in progress
    if (authLoading) return <p className="text-center py-4 text-gray-600">Checking authentication...</p>;

    // Show specific loading for budgets or error if authentication is resolved
    if (loading) return <p className="text-center py-4 text-gray-600">Loading budgets...</p>;
    if (error) return <p className="text-center text-red-600 py-4 font-medium">Error: {error}</p>;

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Your Budgets</h2>
            {!isAuthenticated ? (
                <p className="text-center py-4 text-gray-600">Please log in to view your budgets.</p>
            ) : budgets?.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No budgets found. Create one!</p>
            ) : (
                <ul className="space-y-4">
                    {budgets.map(budget => (
                        <li key={budget._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="mb-3 md:mb-0">
                                <h3 className="text-lg font-bold text-gray-800">{budget.name} ({new Date(budget.period.startDate).toLocaleDateString()} - {new Date(budget.period.endDate).toLocaleDateString()})</h3>
                                <p className="text-gray-600 text-sm">Overall Budget: <span className="font-semibold text-green-700">${budget.overallBudgetAmount}</span></p>
                                <p className="text-gray-600 text-sm">Allocated: <span className="font-semibold text-blue-700">${budget.overallAllocatedAmount}</span> | Utilized: <span className="font-semibold text-red-700">${budget.overallUtilizedAmount}</span></p>
                                <p className="text-gray-600 text-sm">Remaining to Allocate: <span className="font-semibold text-indigo-700">${budget.remainingToAllocate}</span> | Remaining to Utilize: <span className="font-semibold text-orange-700">${budget.remainingToUtilize}</span></p>
                            </div>
                            <div className="flex space-x-2 w-full md:w-auto justify-end">
                                <button
                                    onClick={() => navigate(`/budgets/${budget._id}`)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-md text-sm transition duration-200 ease-in-out shadow-sm"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => handleDelete(budget.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-md text-sm transition duration-200 ease-in-out shadow-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default BudgetDashboard;