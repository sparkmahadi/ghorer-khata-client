import React, { useRef } from 'react';
import { FloatingFigure } from './FloatingFigure';

const FinancialSummary = ({budget}) => {

    // Calculate derived financial fields
    // Ensure these use the fetched budget's values
    const overallBudgetAmount = budget?.overallBudgetAmount || 0;
    const overallAllocatedAmount = budget?.overallAllocatedAmount || 0; // This is now directly from backend calculation
    const overallUtilizedAmount = budget?.overallUtilizedAmount || 0;

    const remainingToAllocate = overallBudgetAmount - overallAllocatedAmount;
    const remainingToUtilize = overallAllocatedAmount - overallUtilizedAmount;

    // Use useRef to store previous values for animation comparison
    const prevOverallBudgetAmountRef = useRef(overallBudgetAmount);
    const prevOverallAllocatedAmountRef = useRef(overallAllocatedAmount);
    const prevRemainingToAllocateRef = useRef(remainingToAllocate);
    const prevOverallUtilizedAmountRef = useRef(overallUtilizedAmount);
    const prevRemainingToUtilizeRef = useRef(remainingToUtilize);

    return (
        <section className="mb-8 p-6 bg-blue-100 rounded-xl shadow-lg border border-blue-200">
            <h3 className="xl:text-2xl font-semibold mb-2 xl:mb-5 text-blue-800 text-center">Financial Dashboard</h3>
            <div className="grid grid-cols-3 lg:grid-cols-3 gap-2 lg:gap-6">
                <FloatingFigure
                    label="Overall Budget"
                    value={overallBudgetAmount}
                    colorClass="text-green-700"
                    previousValue={prevOverallBudgetAmountRef.current}
                />
                <FloatingFigure
                    label="Total Allocated"
                    value={overallAllocatedAmount}
                    colorClass="text-blue-700"
                    previousValue={prevOverallAllocatedAmountRef.current}
                />
                <FloatingFigure
                    label="Remaining to Allocate"
                    value={remainingToAllocate}
                    colorClass="text-indigo-700"
                    previousValue={prevRemainingToAllocateRef.current}
                />
                <FloatingFigure
                    label="Total Utilized"
                    value={overallUtilizedAmount}
                    colorClass="text-red-700"
                    previousValue={prevOverallUtilizedAmountRef.current}
                />
                <FloatingFigure
                    label="Remaining to Utilize"
                    value={remainingToUtilize}
                    colorClass="text-orange-700"
                    previousValue={prevRemainingToUtilizeRef.current}
                />
                <FloatingFigure
                    label="Budget Burn Rate (Daily)"
                    value={
                        (overallUtilizedAmount /
                            ((new Date(budget.period?.endDate).getTime() - new Date(budget.period?.startDate).getTime()) / (1000 * 60 * 60 * 24) || 1))
                    }
                    colorClass="text-purple-700"
                    previousValue={
                        (prevOverallUtilizedAmountRef.current /
                            ((new Date(budget.period?.endDate).getTime() - new Date(budget.period?.startDate).getTime()) / (1000 * 60 * 60 * 24) || 1))
                    }
                    unit="$"
                />
            </div>
        </section>
    );
};

export default FinancialSummary;