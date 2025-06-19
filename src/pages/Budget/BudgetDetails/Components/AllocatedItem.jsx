import React from 'react';
import { useNavigate } from 'react-router';

const AllocatedItem = ({ item, budgetId, handleEditProductClick, handleDeleteProduct, formatDate }) => {
    const navigate = useNavigate();

    const safeFormatDate = formatDate || ((date) =>
        date ? new Date(date).toLocaleDateString() : 'N/A'
    );

    let dynamicBalance = null;
    let daysLeft = null;
    let showLowStockWarning = false;

    if (item.consumption_plan && item.allocated_quantity) {
        const today = new Date();
        const start = new Date(item.consumption_plan.startDate);
        const end = new Date(item.consumption_plan.endDate);

        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const passed = Math.max(0, Math.min(Math.ceil((today - start) / (1000 * 60 * 60 * 24)) + 1, totalDays));

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
    }

    return (
        <li key={item.budgetItemId} className="bg-white p-4 rounded-lg shadow border border-gray-200 transition-transform hover:scale-[1.01] duration-200 w-full">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                {/* LEFT: Info Block */}
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.item_name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1 text-sm">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            Category: {item.category_id || 'N/A'}
                        </span>
                        {item.subcategory_id && (
                            <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                                {item.subcategory_id}
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-700 mt-2">
                        Allocated: <span className="text-green-700 font-bold">${(item.allocated_amount || 0).toFixed(2)}</span>
                        {item.allocated_quantity && ` (${item.allocated_quantity} ${item.unit || ''} @ $${(item.price_per_unit || 0).toFixed(2)}/${item.unit || ''})`}
                    </p>

                    {item.notes && (
                        <p className="text-xs text-gray-500 italic mt-1">Notes: {item.notes}</p>
                    )}

                    {/* Consumption Plan */}
                    {item.consumption_plan && (
                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-900">
                            <p className="font-semibold">Consumption Plan</p>
                            <p>Daily Qty: {item.consumption_plan.daily_quantity} {item.consumption_plan.unit}</p>
                            <p>From: {safeFormatDate(item.consumption_plan.startDate)}</p>
                            <p>To: {safeFormatDate(item.consumption_plan.endDate)}</p>
                        </div>
                    )}

                    {/* Dynamic Balance */}
                    {item.balance && dynamicBalance && (
                        <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded p-2 text-xs text-indigo-900">
                            <p className="font-semibold">Estimated Balance</p>
                            <p>Remaining Qty: <span className="font-bold">{dynamicBalance.quantity} {item.unit || 'units'}</span></p>
                            <p>Amount Left: <span className="font-bold text-indigo-700">${dynamicBalance.amount}</span></p>
                            <p>Days Passed: {dynamicBalance.basedOn}</p>
                            {daysLeft !== null && (
                                <p>Estimated Days Left: <span className="font-bold">{daysLeft} day(s)</span></p>
                            )}
                            {showLowStockWarning && (
                                <p className="text-red-600 font-semibold mt-1">
                                    ⚠️ Low stock! Only {daysLeft} day(s) remaining.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: Actions */}
                <div className="flex flex-col gap-2 sm:items-end">
                    <button
                        onClick={() => handleEditProductClick(item)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-2 px-4 rounded shadow transition-transform transform hover:scale-105"
                    >
                        ✏️ Edit
                    </button>
                    <button
                        onClick={() => navigate(`/budget/expenses/${budgetId}/add-transaction`)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-4 rounded shadow transition-transform transform hover:scale-105"
                    >
                        ➕ Add Expense
                    </button>
                    <button
                        onClick={() => handleDeleteProduct(item.budgetItemId, item.item_name)}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs py-2 px-4 rounded shadow transition-transform transform hover:scale-105"
                    >
                        🗑️ Remove
                    </button>
                </div>
            </div>
        </li>
    );
};

export default AllocatedItem;
