import React, { useEffect, useState } from 'react';
import { updateBudget } from '../../api/budgetService';
import TransactionList from './TransactionList';
import AddTransactionForm from './AddTransactionForm';
import { useAuth } from '../../contexts/AuthContext';

function BudgetMiniDetail({ budgetId, onBack, onBudgetUpdated, onBudgetDeleted }) {
    const { userInfo, isAuthenticated } = useAuth();
    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [showManageCategories, setShowManageCategories] = useState(false); // Renamed for clarity
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryAllocated, setNewCategoryAllocated] = useState('');



    const loadBudget = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchBudgetsByUserId(userInfo._id);
            setBudget(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (budgetId) {
            loadBudget();
        }
    }, [budgetId]);

    const handleTransactionAdded = () => {
        setShowAddTransaction(false);
        loadBudget(); // Refresh budget details to update aggregates
        onBudgetUpdated(); // Notify parent for dashboard refresh
    };

    const handleAddCategory = async () => {
        if (!newCategoryName || newCategoryAllocated === '') {
            alert('Please enter category name and allocated amount.');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const updatedCategories = [
                ...(budget.categories || []), // Ensure it's an array
                {
                    id: `cat_${Date.now()}`, // Simple ID generation
                    name: newCategoryName,
                    allocatedAmount: parseFloat(newCategoryAllocated),
                    utilizedAmount: 0, // Starts at 0
                    subcategories: []
                }
            ];
            const updatedBudget = await updateBudget(budgetId, { categories: updatedCategories });
            setBudget(updatedBudget); // Update local state with the new budget
            setNewCategoryName('');
            setNewCategoryAllocated('');
            alert('Category added successfully!');
        } catch (err) {
            alert(`Error adding category: ${err.message}`);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryIdToDelete) => {
        if (window.confirm('Are you sure you want to delete this category? This will update the budget aggregates, but transactions originally linked to this category will remain.')) {
            try {
                setLoading(true);
                setError(null);
                const updatedCategories = budget.categories.filter(cat => cat.id !== categoryIdToDelete);
                const updatedBudget = await updateBudget(budgetId, { categories: updatedCategories });
                setBudget(updatedBudget); // Update local state
                alert('Category deleted successfully!');
            } catch (err) {
                alert(`Error deleting category: ${err.message}`);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    };


    if (loading) return <p className="text-center py-4 text-gray-600">Loading budget details...</p>;
    if (error) return <p className="text-center text-red-600 py-4 font-medium">Error: {error}</p>;
    if (!budget) return <p className="text-center py-4 text-gray-600">Budget not found or has been deleted.</p>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <button onClick={onBack} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg mb-4 transition duration-200 ease-in-out shadow-sm">
                &larr; Back to Budgets
            </button>
            <h2 className="text-2xl font-bold mb-3 text-blue-700">{budget.name}</h2>
            <p className="text-gray-700 mb-1">
                <strong className="font-semibold">Period:</strong> {new Date(budget.period.startDate).toLocaleDateString()} - {new Date(budget.period.endDate).toLocaleDateString()}
            </p>
            <p className="text-gray-700 mb-1">
                <strong className="font-semibold">Overall Budget:</strong> <span className="text-green-600 font-bold">${budget.overallBudgetAmount.toFixed(2)}</span>
            </p>
            <p className="text-gray-700 mb-1">
                <strong className="font-semibold">Total Allocated:</strong> <span className="text-blue-600 font-bold">${budget.overallAllocatedAmount.toFixed(2)}</span>
            </p>
            <p className="text-gray-700 mb-4">
                <strong className="font-semibold">Total Utilized:</strong> <span className="text-red-600 font-bold">${budget.overallUtilizedAmount.toFixed(2)}</span>
            </p>
            <p className="text-gray-700 mb-1">
                <strong className="font-semibold">Remaining to Allocate:</strong> <span className="text-indigo-600 font-bold">${budget.remainingToAllocate.toFixed(2)}</span>
            </p>
            <p className="text-gray-700 mb-6">
                <strong className="font-semibold">Remaining to Utilize:</strong> <span className="text-orange-600 font-bold">${budget.remainingToUtilize.toFixed(2)}</span>
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">Categories Overview</h3>
            <button
                onClick={() => setShowManageCategories(!showManageCategories)}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-1 px-3 rounded-lg text-sm mb-4 transition duration-200 ease-in-out shadow-sm"
            >
                {showManageCategories ? 'Hide Category Management' : 'Manage Categories'}
            </button>

            {showManageCategories && (
                <div className="bg-gray-100 p-4 rounded-md mb-4 border border-gray-200">
                    <h4 className="text-lg font-semibold mb-2 text-gray-800">Add New Category</h4>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
                        <input
                            type="text"
                            placeholder="Category Name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        />
                        <input
                            type="number"
                            placeholder="Allocated Amount"
                            value={newCategoryAllocated}
                            onChange={(e) => setNewCategoryAllocated(e.target.value)}
                            className="w-full sm:w-32 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            step="0.01"
                        />
                        <button
                            onClick={handleAddCategory}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-sm"
                        >
                            Add
                        </button>
                    </div>

                    <h4 className="text-lg font-semibold mb-2 text-gray-800">Existing Categories</h4>
                    <ul className="space-y-2">
                        {budget.categories?.length === 0 && <p className="text-gray-600 text-sm">No categories defined. Add some above!</p>}
                        {budget.categories?.map(category => (
                            <li key={category.id} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm border border-gray-200">
                                <span className="text-gray-700">{category.name} (<span className="font-semibold text-blue-600">${category.allocatedAmount.toFixed(2)}</span> allocated)</span>
                                <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded-md text-xs transition duration-200 ease-in-out shadow-sm"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}


            <ul className="list-none p-0 space-y-4 mt-6">
                {budget.categories?.length === 0 ? (
                    <p className="text-gray-600">No categories to display. Manage categories above.</p>
                ) : (
                    budget.categories?.map(category => (
                        <li key={category.id} className="bg-gray-50 p-4 rounded-md shadow-inner border border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-800">{category.name}</h4>
                            <p className="text-gray-700 text-sm">
                                Allocated: <span className="font-semibold text-blue-600">${category.allocatedAmount.toFixed(2)}</span> |
                                Utilized: <span className="font-semibold text-red-600">${category.utilizedAmount.toFixed(2)}</span>
                            </p>
                            {category.subcategories && category.subcategories.length > 0 && (
                                <ul className="list-disc ml-6 mt-2 text-sm text-gray-600 space-y-1">
                                    {category.subcategories.map(subcat => (
                                        <li key={subcat.id}>
                                            {subcat.name} (Allocated: <span className="font-semibold text-blue-600">${subcat.allocatedAmount.toFixed(2)}</span> | Utilized: <span className="font-semibold text-red-600">${subcat.utilizedAmount.toFixed(2)}</span>)
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))
                )}
            </ul>

            <h3 className="text-xl font-semibold mt-8 mb-3 text-gray-800">Transactions</h3>
            <button
                onClick={() => setShowAddTransaction(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out mb-4 shadow-md"
            >
                Add New Transaction
            </button>
            {showAddTransaction && (
                <div className="border border-gray-200 p-4 my-5 rounded-lg bg-gray-50 shadow-inner">
                    <h4 className="text-lg font-semibold mb-3 text-gray-800">Add Transaction</h4>
                    <AddTransactionForm
                        budgetId={budgetId}
                        categories={budget.categories || []}
                        onTransactionAdded={handleTransactionAdded}
                        onCancel={() => setShowAddTransaction(false)}
                    />
                </div>
            )}
            {/* Refresh transaction list when budget aggregates change (indicating a transaction was added/deleted) */}
            <TransactionList budgetId={budgetId} refreshTrigger={budget.overallUtilizedAmount} />
        </div>
    );
}

export default BudgetMiniDetail;