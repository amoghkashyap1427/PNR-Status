import React, { useState } from 'react';
import './style.css';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CustomDatePicker = ({ selectedDate, onSelect, onClose, runDays }) => {
    // initialize to selected date, or today
    const initDate = selectedDate ? new Date(selectedDate) : new Date();
    const [viewDate, setViewDate] = useState(new Date(initDate.getFullYear(), initDate.getMonth(), 1));

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 for Sunday

    const prevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
    const nextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

    const handleDayClick = (day) => {
        // Format as YYYY-MM-DD
        const yyyy = currentYear;
        const mm = String(currentMonth + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        onSelect(`${yyyy}-${mm}-${dd}`);
    };

    // calculate run days string
    // runDays is an array [Mon, Tue, Wed, Thu, Fri, Sat, Sun] booleans
    const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const runDaysStr = runDays 
        ? DAY_LABELS.filter((_, i) => runDays[i]).join(', ')
        : DAY_LABELS.join(', ');

    return (
        <div className="rrDatePickerOverlay" onClick={onClose}>
            <div className="rrDatePickerModal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="rrDatePickerHeader">
                    <div className="rrDatePickerHeaderTop">
                        <span className="rrDatePickerTitle">Select Journey Date</span>
                        <button className="rrDatePickerCloseBtn" onClick={onClose}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div className="rrDatePickerHeaderSub">
                        Runs on: {runDaysStr}
                    </div>
                </div>

                {/* Body */}
                <div className="rrDatePickerBody">
                    <div className="rrDatePickerControls">
                        <button onClick={prevMonth} className="rrDatePickerNavBtn">
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        <span className="rrDatePickerMonthLabel">
                            {MONTH_NAMES[currentMonth]} {currentYear}
                        </span>
                        <button onClick={nextMonth} className="rrDatePickerNavBtn">
                            <i className="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>

                    <div className="rrDatePickerGrid">
                        <div className="rrDatePickerDayHeader">Su</div>
                        <div className="rrDatePickerDayHeader">Mo</div>
                        <div className="rrDatePickerDayHeader">Tu</div>
                        <div className="rrDatePickerDayHeader">We</div>
                        <div className="rrDatePickerDayHeader">Th</div>
                        <div className="rrDatePickerDayHeader">Fr</div>
                        <div className="rrDatePickerDayHeader">Sa</div>

                        {Array.from({ length: firstDayIndex }).map((_, i) => (
                            <div key={`empty-${i}`} className="rrDatePickerCell empty"></div>
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const d = new Date(currentYear, currentMonth, day);
                            const jsDay = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
                            
                            // Map JS day to runDays index (Mon=0, Sun=6)
                            const runDayIndex = jsDay === 0 ? 6 : jsDay - 1;
                            const isValid = runDays ? runDays[runDayIndex] : true;
                            
                            // check if it's the currently selected date
                            const isSelected = selectedDate === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            // or if selectedDate is empty and it's today
                            const isToday = !selectedDate && (new Date().toDateString() === d.toDateString());

                            return (
                                <button 
                                    key={day}
                                    className={`rrDatePickerCell ${isValid ? 'valid' : 'invalid'} ${(isSelected || isToday) ? 'selected' : ''}`}
                                    onClick={() => handleDayClick(day)}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="rrDatePickerLegend">
                    <span className="rrDatePickerLegendDot"></span>
                    <span>Valid journey dates (train runs on these days)</span>
                </div>
                
                <div className="rrDatePickerFooter">
                    <button className="rrDatePickerFooterClose" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default CustomDatePicker;
