import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ViewConPlans from './Components/ViewConPlans';
import AddConsumptionPlan from './AddConsumptionPlan';

function ConsumptionPlan() {
    const { userInfo, loading: Authloading, isAuthenticated } = useAuth();
    const userId = userInfo?._id;

    const [currentView, setCurrentView] = useState('add'); // 'add', 'view', 'active', 'expected'

    if (Authloading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
                <p className="text-lg text-gray-700">Loading application...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-100 p-4">
                <p className="text-lg text-red-700">Error: user not authenticated.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
            <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl p-6 md:p-8">
                <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">Consumption Plan Manager</h1>
                <p className="text-center text-sm text-gray-600 mb-6">Your User ID: <span className="font-semibold text-blue-500">{userId}</span></p>

                <div className="flex flex-wrap justify-center gap-4 mb-8">
                    <button
                        onClick={() => setCurrentView('addPlan')}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${currentView === 'addPlan' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`}
                    >
                        Add Plan
                    </button>
                    <button
                        onClick={() => setCurrentView('view')}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${currentView === 'view' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`}
                    >
                        All Con Plans
                    </button>
                    
                </div>
                {currentView === "view" && <ViewConPlans userId={userId} />}
                {currentView === "addPlan" && <AddConsumptionPlan userId={userId} />}

            </div>

        </div>
    );
}

export default ConsumptionPlan;
