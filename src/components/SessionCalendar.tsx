import React, { useState, useCallback } from "react";
import { Calendar } from "react-calendar";
import type { CalendarProps } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface TimeSlot {
  value: string;
  label: string;
}

interface DurationOption {
  value: number;
  label: string;
}

interface SessionCalendarProps {
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  onDurationSelect: (duration: number) => void;
  timezone: string;
  existingSessions?: Date[];
}

const TIME_SLOTS: TimeSlot[] = [
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
];

const DURATION_OPTIONS: DurationOption[] = [
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
];

const SessionCalendar: React.FC<SessionCalendarProps> = ({
  onDateSelect,
  onTimeSelect,
  onDurationSelect,
  timezone,
  existingSessions = [],
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(120); // Default 2 hours
  const [isSlotBooked, setIsSlotBooked] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const formatTimeDisplay = useCallback((time: string): string => {
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return format(date, "h:mm a");
    } catch (error) {
      console.error("Error formatting time:", error);
      setError("Error formatting time");
      return time;
    }
  }, []);

  const handleDateChange: CalendarProps["onChange"] = useCallback(
    (value: CalendarProps["value"]) => {
      try {
        if (!value || Array.isArray(value)) return;
        const zonedDate = toZonedTime(value, timezone);
        setSelectedDate(zonedDate);
        onDateSelect(zonedDate);
        setIsSlotBooked(false);
        setError(null);
      } catch (error) {
        console.error("Error selecting date:", error);
        setError("Error selecting date");
      }
    },
    [timezone, onDateSelect]
  );

  const handleTimeChange = useCallback(
    (time: string) => {
      try {
        setSelectedTime(time);
        onTimeSelect(time);

        const [hours, minutes] = time.split(":").map(Number);
        const slotDate = new Date(selectedDate);
        slotDate.setHours(hours, minutes, 0, 0);

        const isBooked = existingSessions.some((session) => {
          const sessionDate = new Date(session);
          return sessionDate.getTime() === slotDate.getTime();
        });

        setIsSlotBooked(isBooked);
        setError(null);
      } catch (error) {
        console.error("Error selecting time:", error);
        setError("Error selecting time");
      }
    },
    [selectedDate, existingSessions, onTimeSelect]
  );

  const handleDurationChange = useCallback(
    (value: number) => {
      try {
        setDuration(value);
        onDurationSelect(value);
        setError(null);
      } catch (error) {
        console.error("Error selecting duration:", error);
        setError("Error selecting duration");
      }
    },
    [onDurationSelect]
  );

  const isTimeSlotBooked = useCallback(
    (time: string): boolean => {
      try {
        const [hours, minutes] = time.split(":").map(Number);
        const slotDate = new Date(selectedDate);
        slotDate.setHours(hours, minutes, 0, 0);

        return existingSessions.some((session) => {
          const sessionDate = new Date(session);
          return sessionDate.getTime() === slotDate.getTime();
        });
      } catch (error) {
        console.error("Error checking time slot availability:", error);
        setError("Error checking time slot availability");
        return false;
      }
    },
    [selectedDate, existingSessions]
  );

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-2 bg-error/10 border border-error/20 rounded text-error">{error}</div>
      )}

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
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.value}
              type="button"
              onClick={() => handleTimeChange(slot.value)}
              className={`p-2 rounded ${
                selectedTime === slot.value
                  ? isTimeSlotBooked(slot.value)
                    ? "bg-warning text-primary-foreground"
                    : "bg-primary text-primary-foreground"
                  : isTimeSlotBooked(slot.value)
                    ? "bg-warning/10 text-warning hover:bg-warning/20"
                    : "bg-card hover:bg-muted text-primary-foreground"
              }`}
            >
              {formatTimeDisplay(slot.value)}
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
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="text-primary">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-secondary">Timezone: {timezone}</div>
    </div>
  );
};

export default SessionCalendar;
