// AllocatedItem.jsx
import React from 'react';

const AllocatedItem = ({ item, handleEditProductClick, handleDeleteProduct, formatDate }) => {
    // Ensure formatDate is available, if not, provide a fallback or warning
    const safeFormatDate = formatDate || ((dateString) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A');

    return (
        <li key={item.budgetItemId} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center transform transition-transform hover:scale-[1.01] duration-200">
            <div className="mb-2 sm:mb-0">
                <p className="text-lg font-bold text-gray-800">{item.item_name}</p>
                <p className="text-sm text-gray-600">
                    Category: {item.category_id || 'N/A'}
                    {item.subcategory_id && ` > ${item.subcategory_id || 'N/A'}`}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                    Allocated: <span className="font-bold text-green-700">${(item.allocated_amount || 0).toFixed(2)}</span>
                    {item.allocated_quantity && ` (${item.allocated_quantity} ${item.unit || ''} @ $${(item.price_per_unit || 0).toFixed(2)}/${item.unit || ''})`}
                </p>
                {item.notes && <p className="text-xs text-gray-500 italic">Notes: {item.notes}</p>}

                {/* --- Display Consumption Plan Details --- */}
                {item.consumption_plan && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200 text-blue-800 text-xs">
                        <p className="font-semibold mb-1">Consumption Plan:</p>
                        <p>Daily Quantity: {item.consumption_plan.daily_quantity} {item.consumption_plan.unit}</p>
                        <p>From: {safeFormatDate(item.consumption_plan.startDate)}</p>
                        <p>To: {safeFormatDate(item.consumption_plan.endDate)}</p>
                    </div>
                )}
                {/* --- END Consumption Plan --- */}

                {/* --- Display Balance Details --- */}
                {item.balance && (
                    <div className="mt-2 p-2 bg-indigo-50 rounded-md border border-indigo-200 text-indigo-800 text-xs">
                        <p className="font-semibold mb-1">Balance:</p>
                        <p>Amount: <span className="font-bold">${(item.balance.amount || 0).toFixed(2)}</span></p>
                        <p>Quantity: <span className="font-bold">{item.balance.quantity || 0} {item.unit || 'units'}</span></p>
                        {/* Only show price per unit if it's explicitly available and not null/undefined */}
                        {item.balance.price !== undefined && item.balance.price !== null && (
                            <p>Price per Unit: <span className="font-bold">${(item.balance.price || 0).toFixed(2)}</span></p>
                        )}
                        {item.balance.lastTransactionDate && (
                            <p>Last Transaction: {safeFormatDate(item.balance.lastTransactionDate)}</p>
                        )}
                    </div>
                )}
                {/* --- END Balance --- */}

            </div>
            <div className="flex space-x-2 mt-2 sm:mt-0"> {/* Added mt-2 for smaller screens to give some spacing */}
                <button
                    onClick={() => handleEditProductClick(item)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-sm transform hover:scale-105"
                >
                    Edit
                </button>
                <button
                    onClick={() => handleDeleteProduct(item.budgetItemId, item.item_name)}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs py-2 px-4 rounded-md transition duration-200 ease-in-out shadow-sm transform hover:scale-105"
                >
                    Remove
                </button>
            </div>
        </li>
    );
};

export default AllocatedItem;