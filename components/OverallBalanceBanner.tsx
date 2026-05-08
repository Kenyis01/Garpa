import { useFriends } from '@/contexts/FriendsContext';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import AnimatedAmount from './AnimatedAmount';

export default function OverallBalanceBanner() {
  const { friends } = useFriends();

  const { totalOwed, totalOwe } = useMemo(() => {
    let owed = 0;
    let owe = 0;
    for (const f of friends) {
      if (f.balance > 0) owed += f.balance;
      else if (f.balance < 0) owe += Math.abs(f.balance);
    }
    return { totalOwed: owed, totalOwe: owe };
  }, [friends]);

  if (totalOwed === 0 && totalOwe === 0) {
    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        layout={Layout.springify()}
        style={styles.container}
      >
        <View style={[styles.card, styles.settledCard]}>
          <Text style={styles.settledText}>You're all settled up</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      layout={Layout.springify()}
      style={styles.container}
    >
      {totalOwed > 0 && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(50)}
          layout={Layout.springify()}
          style={[styles.card, styles.owedCard]}
        >
          <Text style={styles.label}>you are owed</Text>
          <AnimatedAmount value={totalOwed} style={[styles.amount, { color: '#059669' }]} />
        </Animated.View>
      )}
      {totalOwe > 0 && (
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          layout={Layout.springify()}
          style={[styles.card, styles.oweCard]}
        >
          <Text style={styles.label}>you owe</Text>
          <AnimatedAmount value={totalOwe} style={[styles.amount, { color: '#dc2626' }]} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  card: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  owedCard: { backgroundColor: '#f0fdf4' },
  oweCard: { backgroundColor: '#fef2f2' },
  settledCard: {
    backgroundColor: '#f0fdf4',
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  amount: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  settledText: { fontSize: 14, color: '#059669', fontWeight: '600' },
});
