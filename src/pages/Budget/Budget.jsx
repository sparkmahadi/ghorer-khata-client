import React, { useState } from 'react';
import BudgetDashboard from './BudgetDashboard';
import BudgetMiniDetail from './BudgetMiniDetail';
import AddBudgetForm from './AddBudgetForm';

function Budget() {
    const [selectedBudgetId, setSelectedBudgetId] = useState(null);
    const [showAddBudgetForm, setShowAddBudgetForm] = useState(false);
    const [refreshDashboard, setRefreshDashboard] = useState(0); // State to trigger dashboard refresh

    const handleBudgetCreated = () => {
        setShowAddBudgetForm(false);
        setSelectedBudgetId(null); // Go back to dashboard view
        // setRefreshDashboard(prev => prev + 1); // Trigger refresh
    };

    const handleBudgetDeleted = () => {
        setSelectedBudgetId(null); // Ensure we go back to dashboard if current budget was deleted
        setRefreshDashboard(prev => prev + 1);
    };

    

    return (
        <div className="font-sans max-w-5xl mx-auto my-5 p-5 border border-gray-300 rounded-lg shadow-md bg-gray-50">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Personal Budget Manager</h1>

            {selectedBudgetId ? (
                <BudgetMiniDetail budgetId={selectedBudgetId} onBack={() => setSelectedBudgetId(null)} onBudgetUpdated={() => setRefreshDashboard(prev => prev + 1)} onBudgetDeleted={handleBudgetDeleted} />
            ) : (
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
                    <BudgetDashboard onSelectBudget={setSelectedBudgetId} refreshTrigger={refreshDashboard} onDeleteBudget={handleBudgetDeleted} />
                </>
            )}
        </div>
    );
}

export default Budget;