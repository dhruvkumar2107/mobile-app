import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

const FlashSaleTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endTime) {
      setTimeLeft({ hours: 5, minutes: 23, seconds: 47 });
      return;
    }
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;
      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const TimeBlock = ({ value, label }) => (
    <View style={styles.timeBlock}>
      <Text style={styles.timeValue}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TimeBlock value={timeLeft.hours} label="HRS" />
      <Text style={styles.separator}>:</Text>
      <TimeBlock value={timeLeft.minutes} label="MIN" />
      <Text style={styles.separator}>:</Text>
      <TimeBlock value={timeLeft.seconds} label="SEC" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 40,
  },
  timeValue: {
    color: COLORS.white,
    fontSize: SIZES.font.lg,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
  },
  separator: {
    color: COLORS.error,
    fontSize: SIZES.font.lg,
    fontWeight: '800',
    marginHorizontal: 3,
  },
});

export default FlashSaleTimer;
