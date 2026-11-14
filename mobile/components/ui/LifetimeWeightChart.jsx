import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText, Rect } from 'react-native-svg';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants';
import { Icon } from './Icon';

export function LifetimeWeightChart({
  logs = [],
  targetWeight = 0,
}) {
  // 1. Sanitize and sort logs chronologically (oldest to newest)
  const validLogs = useMemo(() => {
    if (!logs || !Array.isArray(logs)) return [];
    return logs
      .map((l) => ({
        ...l,
        weight: parseFloat(l.weight !== undefined ? l.weight : l.weightKg),
      }))
      .filter((l) => !isNaN(l.weight) && l.weight > 0 && l.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [logs]);

  // Chart dimensions
  const chartHeight = 220;
  const paddingHorizontal = 42;
  const paddingTop = 32;
  const paddingBottom = 38;
  const width = 360;
  const innerWidth = width - paddingHorizontal * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // 2. Compute min, max, points, and summary metrics
  const {
    minVal,
    maxVal,
    points,
    startWeight,
    currentWeight,
    targetVal,
    totalLost,
    percentTowardsGoal,
  } = useMemo(() => {
    const target = parseFloat(targetWeight);
    const validTarget = !isNaN(target) && target > 0 ? target : null;

    if (validLogs.length === 0) {
      return {
        minVal: 60,
        maxVal: 80,
        points: [],
        startWeight: null,
        currentWeight: null,
        targetVal: validTarget,
        totalLost: null,
        percentTowardsGoal: null,
      };
    }

    const weights = validLogs.map((l) => l.weight);
    const allVals = validTarget ? [...weights, validTarget] : weights;

    // Generous bounding box to prevent clipping
    const min = Math.floor(Math.min(...allVals) - 1.5);
    const max = Math.ceil(Math.max(...allVals) + 1.5);
    const range = Math.max(1, max - min);

    const pts = validLogs.map((log, index) => {
      const x = validLogs.length === 1
        ? paddingHorizontal + innerWidth / 2
        : paddingHorizontal + (index / (validLogs.length - 1)) * innerWidth;
      const y = paddingTop + innerHeight - ((log.weight - min) / range) * innerHeight;
      return {
        ...log,
        x: Number(x.toFixed(1)),
        y: Number(y.toFixed(1)),
        index,
      };
    });

    const start = weights[0];
    const current = weights[weights.length - 1];
    const diff = (current - start).toFixed(1);

    let pct = null;
    if (validTarget && start !== validTarget) {
      const totalGoalDiff = start - validTarget;
      const achievedDiff = start - current;
      if (totalGoalDiff > 0) {
        pct = Math.min(100, Math.max(0, Math.round((achievedDiff / totalGoalDiff) * 100)));
      }
    }

    return {
      minVal: min,
      maxVal: max,
      points: pts,
      startWeight: start,
      currentWeight: current,
      targetVal: validTarget,
      totalLost: diff,
      percentTowardsGoal: pct,
    };
  }, [validLogs, targetWeight, innerWidth, innerHeight]);

  // 3. Target line Y coordinate
  const targetY = useMemo(() => {
    if (!targetVal || maxVal === minVal) return null;
    const y = paddingTop + innerHeight - ((targetVal - minVal) / (maxVal - minVal)) * innerHeight;
    return Number(y.toFixed(1));
  }, [targetVal, minVal, maxVal, innerHeight]);

  // 4. Construct SVG paths
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };
    const bottomY = paddingTop + innerHeight;

    if (points.length === 1) {
      const p = points[0];
      return {
        linePath: `M ${paddingHorizontal} ${p.y} L ${width - paddingHorizontal} ${p.y}`,
        areaPath: `M ${paddingHorizontal} ${p.y} L ${width - paddingHorizontal} ${p.y} L ${width - paddingHorizontal} ${bottomY} L ${paddingHorizontal} ${bottomY} Z`,
      };
    }

    // Smooth cubic bezier curve
    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const cp1x = Number((p0.x + (p1.x - p0.x) / 2).toFixed(1));
      const cp1y = p0.y;
      const cp2x = Number((p0.x + (p1.x - p0.x) / 2).toFixed(1));
      const cp2y = p1.y;
      line += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    const last = points[points.length - 1];
    const first = points[0];
    const area = `${line} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;

    return { linePath: line, areaPath: area };
  }, [points, width, innerHeight]);

  // Helper date formatter
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${months[mIdx]} ${parseInt(parts[2], 10)}`;
    }
    return dateStr;
  };

  const midPoint = points.length > 2 ? points[Math.floor(points.length / 2)] : null;
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;

  return (
    <View style={styles.card}>
      {/* 1. Header */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleRow}>
            <Icon name="TrendingDown" size={18} color={Colors.primary[600]} strokeWidth={2.4} />
            <Text style={styles.chartTitle}>Lifetime Weight Trend</Text>
          </View>
          <Text style={styles.chartSubtitle}>Historical progress vs target weight goal</Text>
        </View>

        {targetVal && (
          <View style={styles.targetBadge}>
            <Icon name="Target" size={12} color={Colors.energy[700]} strokeWidth={2.4} />
            <Text style={styles.targetBadgeText}>Goal: {targetVal} kg</Text>
          </View>
        )}
      </View>

      {/* 2. Lifetime Metric Breakdown Grid */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>START</Text>
          <Text style={styles.statVal}>{startWeight ? `${startWeight} kg` : '--'}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TARGET</Text>
          <Text style={[styles.statVal, { color: Colors.energy[700] }]}>
            {targetVal ? `${targetVal} kg` : '--'}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>CURRENT</Text>
          <Text style={[styles.statVal, { color: Colors.primary[700] }]}>
            {currentWeight ? `${currentWeight} kg` : '--'}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>PROGRESS</Text>
          <Text
            style={[
              styles.statVal,
              { color: parseFloat(totalLost) <= 0 ? Colors.success : Colors.warning },
            ]}
          >
            {totalLost ? `${parseFloat(totalLost) > 0 ? '+' : ''}${totalLost} kg` : '--'}
          </Text>
        </View>
      </View>

      {percentTowardsGoal !== null && (
        <View style={styles.goalProgressLineWrap}>
          <View style={styles.goalProgressTextRow}>
            <Text style={styles.goalProgressLabel}>Target Goal Completion</Text>
            <Text style={styles.goalProgressPercent}>{percentTowardsGoal}% achieved</Text>
          </View>
          <View style={styles.goalProgressBarBg}>
            <View
              style={[
                styles.goalProgressBarFill,
                { width: `${Math.min(100, Math.max(4, percentTowardsGoal))}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* 3. SVG Chart Canvas */}
      <View style={styles.chartContainer}>
        {points.length > 0 ? (
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${width} ${chartHeight}`}>
            <Defs>
              <LinearGradient id="lifetimeGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={Colors.primary[500]} stopOpacity="0.28" />
                <Stop offset="100%" stopColor={Colors.primary[500]} stopOpacity="0.01" />
              </LinearGradient>
            </Defs>

            {/* Subtle Horizontal Reference Grid Lines */}
            <Line
              x1={paddingHorizontal - 10}
              y1={paddingTop}
              x2={width - paddingHorizontal + 10}
              y2={paddingTop}
              stroke={Colors.borderLight}
              strokeWidth="0.8"
              strokeDasharray="3, 5"
            />
            <Line
              x1={paddingHorizontal - 10}
              y1={paddingTop + innerHeight / 2}
              x2={width - paddingHorizontal + 10}
              y2={paddingTop + innerHeight / 2}
              stroke={Colors.borderLight}
              strokeWidth="0.8"
              strokeDasharray="3, 5"
            />
            <Line
              x1={paddingHorizontal - 10}
              y1={paddingTop + innerHeight}
              x2={width - paddingHorizontal + 10}
              y2={paddingTop + innerHeight}
              stroke={Colors.borderLight}
              strokeWidth="1"
            />

            {/* Target Weight Dashed Benchmark Line */}
            {targetY !== null && (
              <>
                <Line
                  x1={paddingHorizontal - 10}
                  y1={targetY}
                  x2={width - paddingHorizontal + 10}
                  y2={targetY}
                  stroke={Colors.energy[500]}
                  strokeWidth="1.8"
                  strokeDasharray="5, 4"
                />
                <Rect
                  x={width - paddingHorizontal - 82}
                  y={targetY - 11}
                  width="92"
                  height="18"
                  rx="5"
                  fill={Colors.energy[50]}
                  stroke={Colors.energy[200]}
                  strokeWidth="0.8"
                />
                <SvgText
                  x={width - paddingHorizontal - 36}
                  y={targetY + 2}
                  fontSize="9.5"
                  fontWeight="bold"
                  fill={Colors.energy[700]}
                  textAnchor="middle"
                >
                  TARGET: {targetVal} kg
                </SvgText>
              </>
            )}

            {/* Gradient Area Fill */}
            {areaPath !== '' && <Path d={areaPath} fill="url(#lifetimeGradient)" />}

            {/* Smooth Lifetime Curve */}
            {linePath !== '' && (
              <Path
                d={linePath}
                fill="none"
                stroke={Colors.primary[600]}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Point Nodes (rendered cleanly without responder props for web compatibility) */}
            {points.map((pt, idx) => {
              const isLatest = idx === points.length - 1;
              return (
                <React.Fragment key={idx}>
                  {isLatest && (
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r="8"
                      fill={Colors.primary[100]}
                      opacity="0.9"
                    />
                  )}
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isLatest ? "4.5" : "3"}
                    fill={isLatest ? Colors.primary[700] : Colors.primary[500]}
                    stroke={Colors.white}
                    strokeWidth={isLatest ? "2" : "1.2"}
                  />
                </React.Fragment>
              );
            })}

            {/* X-Axis Clean Date Labels */}
            {points.length > 0 && (
              <>
                <SvgText
                  x={points[0].x}
                  y={chartHeight - 12}
                  fontSize="9.5"
                  fontWeight="bold"
                  fill={Colors.textMuted}
                  textAnchor="start"
                >
                  {formatDateLabel(points[0].date)}
                </SvgText>

                {midPoint && (
                  <SvgText
                    x={midPoint.x}
                    y={chartHeight - 12}
                    fontSize="9.5"
                    fill={Colors.textMuted}
                    textAnchor="middle"
                  >
                    {formatDateLabel(midPoint.date)}
                  </SvgText>
                )}

                {lastPoint && (
                  <SvgText
                    x={lastPoint.x}
                    y={chartHeight - 12}
                    fontSize="9.5"
                    fontWeight="bold"
                    fill={Colors.primary[700]}
                    textAnchor="end"
                  >
                    Today ({lastPoint.weight} kg)
                  </SvgText>
                )}
              </>
            )}
          </Svg>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="Scale" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No lifetime weight logs recorded yet.</Text>
            <Text style={styles.emptySub}>Record your weight to track progress over time.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: Typography.tracking.tight,
  },
  chartSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.energy[50],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.energy[200],
  },
  targetBadgeText: {
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    color: Colors.energy[700],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: Typography.sizes['2xs'],
    fontWeight: Typography.weights.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.extrabold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderLight,
  },
  goalProgressLineWrap: {
    gap: 6,
    paddingHorizontal: 2,
  },
  goalProgressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalProgressLabel: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  goalProgressPercent: {
    fontSize: Typography.sizes['2xs'],
    color: Colors.primary[700],
    fontWeight: Typography.weights.bold,
  },
  goalProgressBarBg: {
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  goalProgressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
  },
  emptySub: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
});
