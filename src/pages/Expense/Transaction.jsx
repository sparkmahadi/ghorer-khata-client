import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';

const Transaction = () => {
    const { isAuthenticated, loading: authLoading, userInfo } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(false); // Separate loading state for budgets
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchBudgetsByUserId = async (userId) => {
        setLoading(true);
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
        <div>
            <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Your Budgets | Select Your Budget Here</h2>
                {!isAuthenticated ? (
                    <p className="text-center py-4 text-gray-600">Please log in to view your budgets.</p>
                ) : budgets?.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No budgets found. Create one!</p>
                ) : (
                    <ul className="space-y-4">
                        {budgets?.map(budget => (
                            <li key={budget._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div className="mb-3 md:mb-0">
                                    <h3 className="text-lg font-bold text-gray-800">{budget.budgetName} ({new Date(budget.period.startDate).toLocaleDateString()} - {new Date(budget.period.endDate).toLocaleDateString()})</h3>
                                    <p className="text-gray-600 text-sm">Overall Budget: <span className="font-semibold text-green-700">${budget.overallBudgetAmount}</span></p>
                                    <p className="text-gray-600 text-sm">Allocated: <span className="font-semibold text-blue-700">${budget.overallAllocatedAmount}</span> | Utilized: <span className="font-semibold text-red-700">${budget.overallUtilizedAmount}</span></p>
                                    <p className="text-gray-600 text-sm">Remaining to Allocate: <span className="font-semibold text-indigo-700">${budget.overallBudgetAmount - budget?.overallAllocatedAmount}</span> | Remaining to Utilize: <span className="font-semibold text-orange-700">${budget.overallAllocatedAmount - budget?.overallUtilizedAmount}</span></p>
                                </div>
                                <div className="flex space-x-2 w-full md:w-auto justify-end">
                                    <button
                                        onClick={() => navigate(`/budget/expenses/${budget._id}`)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-md text-sm transition duration-200 ease-in-out shadow-sm"
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
    );
};

export default Transaction;