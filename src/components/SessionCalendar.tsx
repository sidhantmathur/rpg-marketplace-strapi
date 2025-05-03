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
  const [isSlotBooked, setIsSlotBooked] = useState<boolean>(false);

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

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format(date, 'h:mm a');
  };

  const handleDateChange: CalendarProps['onChange'] = (value) => {
    if (!value || Array.isArray(value)) return;
    const zonedDate = toZonedTime(value, timezone);
    setSelectedDate(zonedDate);
    onDateSelect(zonedDate);
    setIsSlotBooked(false); // Reset booked state when date changes
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    onTimeSelect(time);
    
    // Check if the selected time slot is booked
    const [hours, minutes] = time.split(':').map(Number);
    const slotDate = new Date(selectedDate);
    slotDate.setHours(hours, minutes, 0, 0);
    
    const isBooked = existingSessions.some(session => {
      const sessionDate = new Date(session);
      return sessionDate.getTime() === slotDate.getTime();
    });
    
    setIsSlotBooked(isBooked);
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
        <h3 className="text-lg font-semibold mb-2 text-secondary">Select Date</h3>
        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          minDate={new Date()}
          className="border border-border rounded-lg p-2 [&_.react-calendar__tile]:text-primary [&_.react-calendar__tile--weekend]:text-primary [&_.react-calendar__tile--now]:text-primary [&_.react-calendar__tile--active]:text-primary-foreground [&_.react-calendar__tile--hasActive]:text-primary-foreground [&_.react-calendar__tile--active]:bg-primary [&_.react-calendar__tile--hasActive]:bg-primary"
        />
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-secondary">Select Time</h3>
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map((time) => (
            <button
              key={time}
              onClick={() => handleTimeChange(time)}
              className={`p-2 rounded ${
                selectedTime === time
                  ? isTimeSlotBooked(time)
                    ? 'bg-warning text-primary-foreground'
                    : 'bg-primary text-primary-foreground'
                  : isTimeSlotBooked(time)
                  ? 'bg-warning/10 text-warning hover:bg-warning/20'
                  : 'bg-card hover:bg-muted text-primary'
              }`}
            >
              {formatTimeDisplay(time)}
            </button>
          ))}
        </div>
        {isSlotBooked && (
          <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded text-warning">
            Note: You already have a session booked at this time
          </div>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-secondary">Session Duration</h3>
        <select
          value={duration}
          onChange={(e) => handleDurationChange(Number(e.target.value))}
          className="w-full p-2 border border-border rounded text-primary bg-input"
        >
          {durationOptions.map((option) => (
            <option key={option.value} value={option.value} className="text-primary">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-secondary">
        Timezone: {timezone}
      </div>
    </div>
  );
};

export default SessionCalendar; 