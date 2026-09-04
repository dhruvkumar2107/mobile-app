import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../utils/theme';
import { formatDate, getStatusColor } from '../utils/helpers';

const OrderTimeline = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isActive = step.active || step.completed;
        const isDelivered = step.title?.toLowerCase().includes('delivered') && step.completed;
        const statusColor = isDelivered ? COLORS.success : isActive ? COLORS.secondary : COLORS.gray300;

        return (
          <View key={index} style={styles.stepContainer}>
            <View style={styles.leftColumn}>
              <View style={[styles.dot, { backgroundColor: statusColor }]}>
                {step.completed ? (
                  <Ionicons name="checkmark" size={12} color={COLORS.white} />
                ) : step.active ? (
                  <View style={styles.activeDotInner} />
                ) : null}
              </View>
              {!isLast && <View style={[styles.line, { backgroundColor: step.completed ? COLORS.secondary : COLORS.gray200 }]} />}
            </View>
            <View style={[styles.rightColumn, isActive && styles.activeRightColumn]}>
              <Text style={[styles.stepTitle, isActive && styles.activeStepTitle]}>{step.title}</Text>
              {step.description && <Text style={styles.stepDescription}>{step.description}</Text>}
              {step.date && <Text style={styles.stepDate}>{formatDate(step.date)}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SIZES.sm,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  leftColumn: {
    alignItems: 'center',
    width: 30,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 30,
  },
  rightColumn: {
    flex: 1,
    paddingBottom: SIZES.lg,
    marginLeft: SIZES.sm,
  },
  activeRightColumn: {
    backgroundColor: COLORS.secondary + '08',
    marginHorizontal: -SIZES.sm,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.radiusSm,
    paddingTop: SIZES.xs,
    paddingBottom: SIZES.lg + SIZES.xs,
  },
  stepTitle: {
    fontSize: SIZES.font.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeStepTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  stepDescription: {
    fontSize: SIZES.font.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stepDate: {
    fontSize: SIZES.font.xs,
    color: COLORS.gray400,
    marginTop: 2,
  },
});

export default OrderTimeline;
