import React, { useEffect, useState } from 'react';
import AddBudgetForm from './AddBudgetForm';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { deleteBudget } from '../../api/budgetService';
import { useNavigate } from 'react-router';

function Budget() {
    const { userInfo, isAuthenticated, loading: authLoading } = useAuth(); // Destructure authLoading
    const [selectedBudgetId, setSelectedBudgetId] = useState(null);
    const [showAddBudgetForm, setShowAddBudgetForm] = useState(false);
    const [refreshDashboard, setRefreshDashboard] = useState(0); // State to trigger dashboard refresh

    const navigate = useNavigate();


    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this budget and all its transactions? This action cannot be undone.')) {
            try {
                setLoading(true);
                setError(null);
                await deleteBudget(id); // Use the centralized service for deletion
                alert('Budget deleted successfully!'); // Provide user feedback
                handleBudgetDeleted(); // Inform parent to refresh dashboard
                // After deletion, re-fetch budgets to update the list immediately
                if (isAuthenticated && userInfo?._id) {
                    fetchBudgetsByUserId(userInfo._id);
                }
            } catch (err) {
                alert(`Error deleting budget: ${err.message}`);
                setError(err.message); // Display error on component
            } finally {
                setLoading(false);
            }
        }
    };


    const handleBudgetCreated = () => {
        setShowAddBudgetForm(false);
        setSelectedBudgetId(null); // Go back to dashboard view
        // setRefreshDashboard(prev => prev + 1); // Trigger refresh
    };

    const handleBudgetDeleted = () => {
        setSelectedBudgetId(null); // Ensure we go back to dashboard if current budget was deleted
        setRefreshDashboard(prev => prev + 1);
    };

    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true); // Separate loading state for budgets
    const [error, setError] = useState(null);

    const fetchBudgetsByUserId = async (userId) => {
        console.log('fetchBudgetByuserId');
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/user/${userId}`);
            console.log(response);
            toast.success(response.data.message);
            setBudgets(response.data.budgets);
            setLoading(false);
        } catch (error) {
            console.error('Error in fetchBudgetById:', error.response?.data?.message || error.message);
            setLoading(false);
            throw new Error(error.response?.data?.message || 'Failed to fetch budget');
        }
    };

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchBudgetsByUserId(userInfo._id);
        }
    }, [authLoading, isAuthenticated]);

    if (authLoading) return <p className="text-center py-4 text-gray-600">Checking authentication...</p>;
    if (loading) return <p className="text-center py-4 text-gray-600">Loading budgets...</p>;
    if (error) return <p className="text-center text-red-600 py-4 font-medium">Error: {error}</p>;

    return (
        <div className="font-sans max-w-5xl mx-auto my-5 p-5 border border-gray-300 rounded-lg shadow-md bg-gray-50">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Personal Budget Manager</h1>

            <>
                <button
                    onClick={() => setShowAddBudgetForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out mb-4 shadow-md"
                >
                    Create New Budget
                </button>
                {showAddBudgetForm && (
                    <div className="border border-gray-200 p-4 my-5 rounded-lg bg-white shadow-inner">
                        <h2 className="text-xl font-semibold mb-3 text-gray-800">Create New Budget</h2>
                        <AddBudgetForm onBudgetCreated={handleBudgetCreated} onCancel={() => setShowAddBudgetForm(false)} />
                    </div>
                )}

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
                                        <p className="text-gray-600 text-sm">Remaining to Allocate: <span className="font-semibold text-indigo-700">${budget.overallBudgetAmount - budget?.overallAllocatedAmount}</span> | Remaining to Utilize: <span className="font-semibold text-orange-700">${budget.overallAllocatedAmount - budget?.overallUtilizedAmount}</span></p>
                                    </div>
                                    <div className="flex space-x-2 w-full md:w-auto justify-end">
                                        <button
                                            onClick={() => navigate(`/budgets/${budget._id}`)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-md text-sm transition duration-200 ease-in-out shadow-sm"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => handleDelete(budget._id)}
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
            </>
        </div>
    );
}

export default Budget;