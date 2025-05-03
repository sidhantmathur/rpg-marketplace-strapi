import React, { useState } from 'react';
import { Calendar } from 'react-calendar';
import type { CalendarProps } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, addHours } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface SessionCalendarProps {
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  onDurationSelect: (duration: number) => void;
  timezone: string;
  existingSessions?: Date[];
}

const SessionCalendar: React.FC<SessionCalendarProps> = ({
  onDateSelect,
  onTimeSelect,
  onDurationSelect,
  timezone,
  existingSessions = [],
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(120); // Default 2 hours

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const durationOptions = [
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 240, label: '4 hours' }
  ];

  const handleDateChange: CalendarProps['onChange'] = (value) => {
    if (!value || Array.isArray(value)) return;
    const zonedDate = toZonedTime(value, timezone);
    setSelectedDate(zonedDate);
    onDateSelect(zonedDate);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    onTimeSelect(time);
  };

  const handleDurationChange = (value: number) => {
    setDuration(value);
    onDurationSelect(value);
  };

  const isTimeSlotBooked = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotDate = new Date(selectedDate);
    slotDate.setHours(hours, minutes, 0, 0);
    
    return existingSessions.some(session => {
      const sessionDate = new Date(session);
      return sessionDate.getTime() === slotDate.getTime();
    });
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Select Date</h3>
        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          minDate={new Date()}
          className="border rounded-lg p-2 [&_.react-calendar__tile]:text-gray-900 [&_.react-calendar__tile--weekend]:text-gray-900 [&_.react-calendar__tile--now]:text-gray-900 [&_.react-calendar__tile--active]:text-white [&_.react-calendar__tile--hasActive]:text-white"
        />
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Select Time</h3>
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map((time) => (
            <button
              key={time}
              onClick={() => handleTimeChange(time)}
              disabled={isTimeSlotBooked(time)}
              className={`p-2 rounded ${
                selectedTime === time
                  ? 'bg-blue-500 text-white'
                  : isTimeSlotBooked(time)
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Session Duration</h3>
        <select
          value={duration}
          onChange={(e) => handleDurationChange(Number(e.target.value))}
          className="w-full p-2 border rounded text-gray-900"
        >
          {durationOptions.map((option) => (
            <option key={option.value} value={option.value} className="text-gray-900">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-gray-700">
        Timezone: {timezone}
      </div>
    </div>
  );
};

export default SessionCalendar; 