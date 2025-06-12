import React from 'react';

const BasicBudgetInfo = ({budget, formatDate}) => {
    return (
        <>
               {/* User and ID Information Section */}
                    <section className="mb-8 p-5 border border-gray-200 rounded-xl bg-gray-50 shadow-sm">
                        <h3 className="text-xl font-semibold mb-3 text-gray-700">Budget Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
                            <p><strong className="font-semibold text-gray-800">Budget ID:</strong> {budget._id || 'N/A'}</p>
                            <p><strong className="font-semibold text-gray-800">User ID:</strong> {budget.userId || 'N/A'}</p>
                            <p><strong className="font-semibold text-gray-800">Username:</strong> {budget.username || 'N/A'}</p>
                        </div>
                    </section>

                    {/* Budget Period Details Section */}
                    <section className="mb-8 p-5 border border-gray-200 rounded-xl bg-gray-50 shadow-sm">
                        <h3 className="text-xl font-semibold mb-3 text-gray-700">Budget Period</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                            <p><strong className="font-semibold text-gray-800">Start Date:</strong> {formatDate(budget.period?.startDate)}</p>
                            <p><strong className="font-semibold text-gray-800">End Date:</strong> {formatDate(budget.period?.endDate)}</p>
                        </div>
                    </section>
        </>
    );
};

export default BasicBudgetInfo;