import React, { useState } from 'react';
import { createBudget } from '../../api/budgetService';
import { useAuth } from '../../contexts/AuthContext';

function AddBudgetForm({ onBudgetCreated, onCancel }) {
        const {userInfo, isAuthenticated} = useAuth();
        console.log(userInfo);
    const [name, setName] = useState('');
    const [overallBudgetAmount, setOverallBudgetAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Basic validation
        if (new Date(startDate) > new Date(endDate)) {
            setError('End date cannot be before start date.');
            setLoading(false);
            return;
        }

        try {
            const newBudgetData = {
                userId: userInfo?._id,
                username: userInfo?.username,
                budgetName: name,
                overallBudgetAmount: parseFloat(overallBudgetAmount),
                period: {
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString()
                },
                categories: [
                    // Example initial categories - you might want a separate form for this
                    { id: 'cat_groceries', name: 'Groceries & Essentials', allocatedAmount: 500, utilizedAmount: 0, subcategories: [
                        { id: 'sub_rice_lentils', name: 'Rice, Lentils, Oil, Salt, Spices', allocatedAmount: 200, utilizedAmount: 0 },
                        { id: 'sub_vegetables_fruits', name: 'Vegetables & Fruits', allocatedAmount: 300, utilizedAmount: 0 }
                    ]},
                    { id: 'cat_transport', name: 'Transportation', allocatedAmount: 100, utilizedAmount: 0, subcategories: [] },
                    { id: 'cat_entertainment', name: 'Entertainment', allocatedAmount: 50, utilizedAmount: 0, subcategories: [] }
                ]
            };
            await createBudget(newBudgetData);
            alert('Budget created successfully!');
            onBudgetCreated();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 max-w-md mx-auto p-4 bg-white rounded-lg shadow-md border border-gray-100">
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <label className="block">
                <span className="text-gray-700 font-medium">Budget Name:</span>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                />
            </label>
            <label className="block">
                <span className="text-gray-700 font-medium">Overall Budget Amount:</span>
                <input
                    type="number"
                    value={overallBudgetAmount}
                    onChange={(e) => setOverallBudgetAmount(e.target.value)}
                    required
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                />
            </label>
            <label className="block">
                <span className="text-gray-700 font-medium">Start Date:</span>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                />
            </label>
            <label className="block">
                <span className="text-gray-700 font-medium">End Date:</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 p-2"
                />
            </label>
            <div className="flex justify-end space-x-3 mt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating...' : 'Create Budget'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default AddBudgetForm;