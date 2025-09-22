import React, { useState } from "react";
import DayRoutineEditor from "./components/DayRoutineEditor";

const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function WeekRoutineEditor() {
  const [weekRoutine, setWeekRoutine] = useState({});

  const handleDayUpdate = (day, routine) => {
    setWeekRoutine({ ...weekRoutine, [day]: routine });
  };

  const handleSave = () => {
    console.log("Weekly Routine:", weekRoutine);
    alert("Routine saved! (Check console)");
    // Later: axios.post("/api/routine", weekRoutine)
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Weekly Food Routine (5-Member Family)</h1>
      {days.map((day) => (
        <DayRoutineEditor
          key={day}
          day={day}
          routine={weekRoutine[day] || {}}
          setRoutine={(routine) => handleDayUpdate(day, routine)}
        />
      ))}
      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg mt-4 hover:bg-blue-700"
      >
        Save Routine
      </button>
    </div>
  );
}
