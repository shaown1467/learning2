import React, { useState } from 'react';
import { Calendar, Clock, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { Event } from '../../types';

const CalendarSection: React.FC = () => {
  const { documents: events } = useFirestore('events', 'date');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event: Event) => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'live': return 'bg-red-500';
      case 'assignment': return 'bg-blue-500';
      case 'exam': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'live': return 'লাইভ ক্লাস';
      case 'assignment': return 'অ্যাসাইনমেন্ট';
      case 'exam': return 'পরীক্ষা';
      default: return 'অন্যান্য';
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();

  const calendarDays = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20 lg:pb-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ক্যালেন্ডার</h1>
        <p className="text-gray-600">আসন্ন ইভেন্ট এবং ক্লাসের সময়সূচী দেখুন</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {new Intl.DateTimeFormat('bn-BD', { 
                  year: 'numeric', 
                  month: 'long' 
                }).format(currentDate)}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={index} className="p-2 h-12"></div>;
                }

                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dayEvents = getEventsForDate(date);
                const isToday = date.toDateString() === today.toDateString();
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`p-2 h-12 text-sm rounded-lg transition-colors relative ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : isSelected
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="flex space-x-1">
                          {dayEvents.slice(0, 3).map((event: Event, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${getEventTypeColor(event.type)}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-6">
          {/* Selected Date Events */}
          {selectedDate && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {formatDate(selectedDate)}
              </h3>
              
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateEvents.map((event: Event) => (
                    <div key={event.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getEventTypeColor(event.type)}`}>
                          {getEventTypeLabel(event.type)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{event.time}</span>
                        </div>
                        {event.liveLink && (
                          <a
                            href={event.liveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>লাইভ লিংক</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">এই দিনে কোন ইভেন্ট নেই</p>
              )}
            </div>
          )}

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">আসন্ন ইভেন্ট</h3>
            
            <div className="space-y-3">
              {events
                .filter((event: Event) => new Date(event.date) >= today)
                .slice(0, 5)
                .map((event: Event) => (
                  <div key={event.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-600">
                        {new Intl.DateTimeFormat('bn-BD', { 
                          month: 'short', 
                          day: 'numeric' 
                        }).format(new Date(event.date))} • {event.time}
                      </p>
                    </div>
                  </div>
                ))}
              
              {events.filter((event: Event) => new Date(event.date) >= today).length === 0 && (
                <p className="text-gray-500 text-center py-4">কোন আসন্ন ইভেন্ট নেই</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSection;