import React from 'react';
import { getBudgetDayInfo } from '../../../../api/budgetService';

// Assuming getBudgetDayInfo and formatDate are available in the scope where this component is used
// or passed as props if they are external utilities.
// For this example, let's assume they are either imported or passed.

const BudgetSideBarInfo = ({ budget, formatDate }) => {

    const { currentDay, remainingDays, totalDays } = getBudgetDayInfo(budget.period.startDate, budget.period.endDate);

    return (
        <div className="xl:flex gap-5 justify-around space-y-4 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
            {/* Budget Overview: Timeline */}
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-2">Budget Overview</h3>
                <p className="text-sm text-gray-700">
                    Day <span className="font-bold text-blue-700">{currentDay}</span> of <span className="font-bold">{totalDays}</span> days
                    <span className="ml-2 font-semibold text-red-600">({remainingDays} remaining)</span>
                </p>
            </section>

            {/* Budget Details (ID, User, Dates) */}
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-2">Details</h3>
                <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-medium text-gray-800">ID:</span> <span className="break-all">{budget._id || 'N/A'}</span></p>
                    <p><span className="font-medium text-gray-800">User:</span> {budget.username || 'N/A'} ({budget.userId || 'N/A'})</p>
                    <p><span className="font-medium text-gray-800">Period:</span> {formatDate(budget.period?.startDate)} – {formatDate(budget.period?.endDate)}</p>
                </div>
            </section>

            {/* Timestamps */}
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-2">Logs</h3>
                <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-medium text-gray-800">Created:</span> {formatDate(budget.createdAt)}</p>
                    <p><span className="font-medium text-gray-800">Last Updated:</span> {formatDate(budget.lastUpdatedAt)}</p>
                </div>
            </section>
        </div>
    );
};

export default BudgetSideBarInfo;