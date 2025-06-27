import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { colors, getElevationStyle } from '../styles/colors';

const { width } = Dimensions.get('window');

interface CalendarPickerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  visible: boolean;
  onClose: () => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateSelect,
  visible,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = new Date(selectedDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const today = new Date();
  const selectedDateObj = new Date(selectedDate);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const selectDate = (day: number) => {
    const dateString = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateSelect(dateString);
    onClose();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Header with month/year and navigation
    days.push(
      <View key="header" style={styles.calendarHeader}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('prev')}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthYear}>{monthYear}</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('next')}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>
    );

    // Day names header
    days.push(
      <View key="dayNames" style={styles.dayNamesRow}>
        {dayNames.map(dayName => (
          <View key={dayName} style={styles.dayNameCell}>
            <Text style={styles.dayNameText}>{dayName}</Text>
          </View>
        ))}
      </View>
    );

    // Calendar grid
    const weeks = [];
    let week = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      week.push(
        <View key={`empty-${i}`} style={styles.dayCell}>
          <View style={styles.emptyDay} />
        </View>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = dateString === selectedDate;
      const isToday = 
        currentMonth.getFullYear() === today.getFullYear() &&
        currentMonth.getMonth() === today.getMonth() &&
        day === today.getDate();

      week.push(
        <View key={day} style={styles.dayCell}>
          <TouchableOpacity
            style={[
              styles.dayButton,
              isSelected && styles.selectedDay,
              isToday && styles.todayDay,
            ]}
            onPress={() => selectDate(day)}
          >
            <Text style={[
              styles.dayText,
              isSelected && styles.selectedDayText,
              isToday && styles.todayDayText,
            ]}>
              {day}
            </Text>
          </TouchableOpacity>
        </View>
      );

      // Start new week after Saturday
      if ((firstDay + day) % 7 === 0) {
        weeks.push(
          <View key={`week-${weeks.length}`} style={styles.weekRow}>
            {week}
          </View>
        );
        week = [];
      }
    }

    // Add remaining days to last week
    if (week.length > 0) {
      // Fill remaining cells
      while (week.length < 7) {
        week.push(
          <View key={`empty-end-${week.length}`} style={styles.dayCell}>
            <View style={styles.emptyDay} />
          </View>
        );
      }
      weeks.push(
        <View key={`week-${weeks.length}`} style={styles.weekRow}>
          {week}
        </View>
      );
    }

    days.push(...weeks);
    return days;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Select Date</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.calendarScrollView}>
            {renderCalendar()}
          </ScrollView>
          
          <View style={styles.calendarFooter}>
            <TouchableOpacity style={styles.todayButton} onPress={() => {
              const todayString = today.toISOString().split('T')[0];
              onDateSelect(todayString);
              onClose();
            }}>
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: colors.surface.level2,
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: '80%',
    maxWidth: 400,
    ...colors.shadows.large,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface.level3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  calendarScrollView: {
    maxHeight: 400,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...colors.shadows.small,
  },
  navButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  dayNamesRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#6a6a6a',
    paddingVertical: 10,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c5c5c5',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#a82828',
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  emptyDay: {
    width: 36,
    height: 36,
  },
  dayText: {
    fontSize: 16,
    color: '#ffffff',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  todayDayText: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  calendarFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#6a6a6a',
    alignItems: 'center',
  },
  todayButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});