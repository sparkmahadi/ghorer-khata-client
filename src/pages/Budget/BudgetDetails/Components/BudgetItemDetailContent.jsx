// components/BudgetItemDetailContent.jsx
import React from 'react';
import { useNavigate } from 'react-router';


const BudgetItemDetailContent = ({ item, budgetId, handleEditProductClick, handleDeleteProduct, formatDate, onCloseModal }) => {
    const navigate = useNavigate();

    // Utility function for formatting dates
    const safeFormatDate = formatDate || ((date) =>
        date ? new Date(date).toLocaleDateString() : 'N/A'
    );

    // --- Start Calculation Logic (Copied from previous versions) ---
    let dynamicBalance = null;
    let daysLeft = null;
    let showLowStockWarning = false;
    let consumptionProgressPercentage = 0;
    let balancePercentage = 0;
    let totalDays = 0;
    let passed = 0;

    if (item && item.consumption_plan && item.allocated_quantity) {
        const today = new Date();
        const start = new Date(item.consumption_plan.startDate);
        const end = new Date(item.consumption_plan.endDate);

        totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        passed = Math.max(0, Math.min(Math.ceil((today - start) / (1000 * 60 * 60 * 24)) + 1, totalDays));

        const dailyQty = item.consumption_plan.daily_quantity || 1;
        const consumed = dailyQty * passed;
        const remainingQty = Math.max(0, item.allocated_quantity - consumed);
        const roundedQty = Math.round(remainingQty * 100) / 100;

        const price = item.price_per_unit || 0;
        const remainingAmt = +(roundedQty * price).toFixed(2);

        daysLeft = dailyQty > 0 ? Math.floor(roundedQty / dailyQty) : null;
        showLowStockWarning = daysLeft !== null && daysLeft <= 3;

        dynamicBalance = {
            quantity: roundedQty,
            amount: remainingAmt,
            price,
            basedOn: passed
        };

        if (totalDays > 0) {
            consumptionProgressPercentage = Math.min(100, (passed / totalDays) * 100);
        } else {
            consumptionProgressPercentage = 0;
        }

        if (item.allocated_amount && item.allocated_amount > 0) {
            balancePercentage = Math.min(100, (remainingAmt / item.allocated_amount) * 100);
        } else {
            balancePercentage = 0;
        }
    }
    // --- End Calculation Logic ---

    // Ensure item is always provided as this component doesn't fetch
    if (!item) {
        return <p className="text-gray-600">No item data to display.</p>;
    }

    // Helper for action buttons to close modal after action
    const handleEditClick = (itemToEdit) => {
        handleEditProductClick(itemToEdit);
        onCloseModal(); // Close the modal after triggering edit
    };

    const handleDeleteClick = (itemIdToDelete, itemName) => {
        handleDeleteProduct(itemIdToDelete, itemName);
        onCloseModal(); // Close the modal after triggering delete
    };

    const handleAddExpenseClick = () => {
        navigate(`/budget/expenses/${budgetId}/add-transaction`);
        onCloseModal(); // Close modal before navigating
    };


    return (
        <div className="bg-white">
            {/* General Information Section */}
            <section className="mb-6 p-5 bg-gray-50 rounded-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">General Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700">
                    <p><strong>Item ID:</strong> <span className="break-all">{item.budgetItemId}</span></p>
                    <p><strong>Category:</strong> <span className="font-medium text-gray-800">{item.category_id || 'N/A'}</span></p>
                    <p><strong>Subcategory:</strong> <span className="font-medium text-gray-800">{item.subcategory_id || 'N/A'}</span></p>
                    <p><strong>Unit:</strong> <span className="font-medium text-gray-800">{item.unit || 'N/A'}</span></p>
                    <p><strong>Price Per Unit:</strong> <span className="font-medium text-gray-800">${parseFloat(item.price_per_unit || 0).toFixed(2)}</span></p>
                    <p><strong>Allocated Quantity:</strong> <span className="font-medium text-gray-800">{item.allocated_quantity || 'N/A'}</span></p>
                    <p><strong>Allocated Amount:</strong> <strong className="text-green-700 text-lg">${(item.allocated_amount || 0).toFixed(2)}</strong></p>
                </div>
                {item.notes && (
                    <div className="mt-6 p-4 bg-gray-100 rounded-md border-l-4 border-gray-300">
                        <p className="font-semibold text-gray-800 mb-1">Notes:</p>
                        <p className="text-gray-700 italic">{item.notes}</p>
                    </div>
                )}
            </section>

            {/* Consumption & Balance Section */}
            {(item.consumption_plan || (item.balance && dynamicBalance)) && (
                <section className="mb-6 p-5 bg-blue-50 rounded-lg border border-blue-100">
                    <h2 className="text-2xl font-bold text-blue-900 mb-4">Consumption & Balance</h2>

                    {item.consumption_plan && (
                        <div className="mb-6 p-4 bg-blue-100 rounded-md border border-blue-200">
                            <h3 className="text-xl font-semibold text-blue-800 mb-3">Consumption Plan</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-blue-900">
                                <p><strong>Daily Quantity:</strong> <span className="font-bold">{item.consumption_plan.daily_quantity} {item.consumption_plan.unit}</span></p>
                                <p><strong>Start Date:</strong> <span className="font-bold">{safeFormatDate(item.consumption_plan.startDate)}</span></p>
                                <p><strong>End Date:</strong> <span className="font-bold">{safeFormatDate(item.consumption_plan.endDate)}</span></p>
                                <p className="col-span-1 sm:col-span-2 lg:col-span-3">
                                    <strong>Days Passed:</strong> <span className="font-bold">{passed} / {totalDays}</span>
                                </p>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-3 mt-4" role="progressbar" aria-valuenow={consumptionProgressPercentage} aria-valuemin="0" aria-valuemax="100">
                                <div
                                    className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${consumptionProgressPercentage}%` }}
                                    title={`Consumption Progress: ${consumptionProgressPercentage.toFixed(0)}%`}
                                ></div>
                            </div>
                            <p className="text-right text-xs text-blue-700 mt-1">Progress: {consumptionProgressPercentage.toFixed(1)}%</p>
                        </div>
                    )}

                    {item.balance && dynamicBalance && (
                        <div className={`p-4 rounded-md border ${showLowStockWarning ? 'bg-red-50 border-red-200 text-red-900' : 'bg-indigo-50 border-indigo-200 text-indigo-900'}`}>
                            <h3 className="text-xl font-semibold mb-3">Estimated Current Balance</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <p><strong>Remaining Quantity:</strong> <span className="font-bold">{dynamicBalance.quantity} {item.unit || 'units'}</span></p>
                                <p><strong>Remaining Amount:</strong> <strong className="text-indigo-700 text-lg">${dynamicBalance.amount}</strong></p>
                                {daysLeft !== null && (
                                    <p className="flex items-center gap-2">
                                        <strong>Days Left:</strong>
                                        <span className={`font-bold text-xl ${showLowStockWarning ? 'text-red-700' : ''}`}>
                                            {daysLeft}
                                        </span>
                                        <span className={`text-sm ${showLowStockWarning ? 'text-red-700' : ''}`}>
                                            day(s)
                                        </span>
                                        {showLowStockWarning && (
                                            <span className="text-red-600 font-bold ml-2 animate-pulse" aria-live="polite">⚠️ Low stock!</span>
                                        )}
                                    </p>
                                )}
                            </div>
                            {item.allocated_amount && item.allocated_amount > 0 && (
                                <>
                                    <div className="w-full bg-gray-200 rounded-full h-3 mt-4" role="progressbar" aria-valuenow={balancePercentage} aria-valuemin="0" aria-valuemax="100">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-500 ease-out ${balancePercentage < 20 ? 'bg-red-500' : balancePercentage < 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${balancePercentage}%` }}
                                            title={`Balance Remaining: ${balancePercentage.toFixed(0)}%`}
                                        ></div>
                                    </div>
                                    <p className="text-right text-xs text-gray-700 mt-1">Balance: {balancePercentage.toFixed(1)}%</p>
                                </>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* Actions Section */}
            <section className="mt-6 flex flex-col sm:flex-row justify-center gap-4 p-5 bg-gray-100 rounded-lg border border-gray-200">
                <button
                    onClick={() => handleEditClick(item)}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-base py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center justify-center gap-2 font-semibold"
                    title="Edit Allocation"
                    aria-label={`Edit allocation for ${item.item_name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-7.793 7.793-2.007.471.471-2.007 7.793-7.793zM10.74 5.656L14 8.916 6.364 16.552 6 16 9.656 12.364z" />
                    </svg>
                    Edit Allocation
                </button>
                <button
                    onClick={handleAddExpenseClick}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-base py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center justify-center gap-2 font-semibold"
                    title="Add Expense"
                    aria-label={`Add expense for ${item.item_name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Expense
                </button>
                <button
                    onClick={() => handleDeleteClick(item.budgetItemId, item.item_name)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-base py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center justify-center gap-2 font-semibold"
                    title="Remove Allocation"
                    aria-label={`Remove ${item.item_name} allocation`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm6 3a1 1 0 100 2H8a1 1 0 100-2h5z" clipRule="evenodd" />
                    </svg>
                    Remove Allocation
                </button>
            </section>
        </div>
    );
};

export default BudgetItemDetailContent;