// components/AllocatedItem.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import BudgetItemModal from './BudgetItemModal';
import BudgetItemDetailContent from './BudgetItemDetailContent';

const AllocatedItem = ({ item, budgetId, handleEditProductClick, handleDeleteProduct, formatDate, isTableView }) => {
    const navigate = useNavigate();
    const [showDetailModal, setShowDetailModal] = useState(false); // State to control modal visibility

    // --- Start Calculation Logic (Remains the same) ---
    let dynamicBalance = null;
    let daysLeft = null;
    let showLowStockWarning = false;
    let consumptionProgressPercentage = 0;
    let balancePercentage = 0;

    let totalDays = 0;
    let passed = 0;

    if (item.consumption_plan && item.allocated_quantity) {
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

    // Function to open the detail modal
    const openDetailModal = () => setShowDetailModal(true);
    // Function to close the detail modal
    const closeDetailModal = () => setShowDetailModal(false);

    if (isTableView) {
        return (
            <>
                <tr
                    key={item.budgetItemId}
                    className="hover:bg-gray-50 transition duration-150 ease-in-out text-xs lg:text-base"
                >
                    <td className="px-1 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_name}</td>
                    <td className="px-1 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="font-semibold text-green-700">${(item.allocated_amount || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-1 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {dynamicBalance ? (
                            <span className={showLowStockWarning ? "font-semibold text-red-700" : "font-semibold text-indigo-700"}>
                                ${dynamicBalance.amount} ({dynamicBalance.quantity} {item.unit || 'units'})
                            </span>
                        ) : 'N/A'}
                    </td>
                    <td className="px-1 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {daysLeft !== null ? (
                            <span className={showLowStockWarning ? "font-semibold text-red-700" : ""}>
                                {daysLeft}
                            </span>
                        ) : 'N/A'}
                    </td>
                    <td className="px-1 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2 items-center">
                            {/* New "View Details" button */}
                            <button
                                onClick={openDetailModal}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="View Details"
                                aria-label={`View details for ${item.item_name}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleEditProductClick(item)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Edit"
                                aria-label={`Edit ${item.item_name}`}
                            >
                                ✏️
                            </button>
                            <button
                                onClick={() => navigate(`/budget/expenses/${budgetId}/add-transaction`)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Add Expense"
                                aria-label={`Add expense for ${item.item_name}`}
                            >
                                ➕
                            </button>
                            <button
                                onClick={() => handleDeleteProduct(item.budgetItemId, item.item_name)}
                                className="text-red-600 hover:text-red-900"
                                title="Remove"
                                aria-label={`Remove ${item.item_name}`}
                            >
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
                {showDetailModal && (
                    <BudgetItemModal isOpen={showDetailModal} onClose={closeDetailModal} title={`${item.item_name} Details`}>
                        <BudgetItemDetailContent
                            item={item}
                            budgetId={budgetId}
                            handleEditProductClick={handleEditProductClick}
                            handleDeleteProduct={handleDeleteProduct}
                            formatDate={formatDate}
                            onCloseModal={closeDetailModal} // Pass close function to content for actions
                        />
                    </BudgetItemModal>
                )}
            </>
        );
    }

    return (
        <>
            <li
                key={item.budgetItemId}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition duration-150 ease-in-out focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
            >
                {/* LEFT: Item Info */}
                <div className="flex-1 min-w-0 pr-4 mb-3 sm:mb-0">
                    <h4 className="text-lg font-semibold text-gray-800">{item.item_name}</h4>
                    <p className="text-sm text-gray-600 truncate">{item.category_id} {item.subcategory_id && ` / ${item.subcategory_id}`}</p>
                    <p className="text-xl font-bold text-green-700 mt-1">${(item.allocated_amount || 0).toFixed(2)}</p>

                    {/* Dynamic Balance Info for Card View */}
                    {item.balance && dynamicBalance && (
                        <div className="mt-2 text-sm text-gray-700">
                            <p className={showLowStockWarning ? "text-red-600 font-semibold" : ""}>
                                Remaining: <span className="font-bold">${dynamicBalance.amount}</span> ({dynamicBalance.quantity} {item.unit || 'units'})
                                {showLowStockWarning && <span className="ml-2 font-bold animate-pulse">⚠️ Low stock!</span>}
                            </p>
                            {daysLeft !== null && (
                                <p className={showLowStockWarning ? "text-red-600 font-semibold" : ""}>
                                    Est. Days Left: <span className="font-bold">{daysLeft}</span>
                                </p>
                            )}
                            {item.allocated_amount > 0 && (
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div
                                        className={`h-2 rounded-full ${balancePercentage < 20 ? 'bg-red-500' : balancePercentage < 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${balancePercentage}%` }}
                                        title={`Balance Remaining: ${balancePercentage.toFixed(0)}%`}
                                    ></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: Actions */}
                <div className="flex flex-row sm:flex-col gap-2 ml-0 sm:ml-4 w-full sm:w-auto justify-end sm:justify-start">
                    {/* New "View Details" button */}
                    <button
                        onClick={openDetailModal}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1"
                        title="View Details"
                        aria-label={`View details for ${item.item_name}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        Details
                    </button>
                    <button
                        onClick={() => handleEditProductClick(item)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1"
                        title="Edit"
                        aria-label={`Edit ${item.item_name}`}
                    >
                        ✏️ <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                        onClick={() => navigate(`/budget/expenses/${budgetId}/add-transaction`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1"
                        title="Add Expense"
                        aria-label={`Add expense for ${item.item_name}`}
                    >
                        ➕ <span className="hidden sm:inline">Expense</span>
                    </button>
                    <button
                        onClick={() => handleDeleteProduct(item.budgetItemId, item.item_name)}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1"
                        title="Remove"
                        aria-label={`Remove ${item.item_name}`}
                    >
                        🗑️ <span className="hidden sm:inline">Remove</span>
                    </button>
                </div>
            </li>
            {showDetailModal && (
                <BudgetItemModal isOpen={showDetailModal} onClose={closeDetailModal} title={`${item.item_name} Details`}>
                    <BudgetItemDetailContent
                        item={item}
                        budgetId={budgetId}
                        handleEditProductClick={handleEditProductClick}
                        handleDeleteProduct={handleDeleteProduct}
                        formatDate={formatDate}
                        onCloseModal={closeDetailModal} // Pass close function to content for actions
                    />
                </BudgetItemModal>
            )}
        </>
    );
};

export default AllocatedItem;   