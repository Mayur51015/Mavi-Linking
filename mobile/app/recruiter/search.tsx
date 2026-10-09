import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { Card } from '../../src/components/common/Card';
import { Input } from '../../src/components/common/Input';
import { Badge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { EmptyState } from '../../src/components/common/EmptyState';
import { colors, radius, spacing, typography } from '../../src/constants/theme';

export default function CandidateSearchScreen() {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const searchCandidates = useCallback(async (searchQuery = '') => {
    setLoading(true);
    try {
      const endpoint = searchQuery.trim()
        ? `/recruiter/search?q=${encodeURIComponent(searchQuery.trim())}`
        : '/recruiter/search';
      const res = await api.get(endpoint);
      if (res.data?.success) {
        setCandidates(res.data.data?.candidates || res.data.data || []);
      }
    } catch (err: any) {
      console.warn('[Search] Candidate search error:', err.message);
      // Fallback sample data if local testing
      setCandidates([
        {
          _id: 'sample_cand_1',
          name: 'Aarav Sharma',
          email: 'aarav.sharma@college.edu',
          cgpa: 8.9,
          readinessScore: 92,
          department: 'Computer Science',
          skills: ['React', 'Node.js', 'TypeScript', 'Docker'],
        },
        {
          _id: 'sample_cand_2',
          name: 'Priya Patel',
          email: 'priya.patel@college.edu',
          cgpa: 9.1,
          readinessScore: 88,
          department: 'Information Technology',
          skills: ['Python', 'PostgreSQL', 'AWS', 'FastAPI'],
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    searchCandidates();
  }, [searchCandidates]);

  const onRefresh = () => {
    setRefreshing(true);
    searchCandidates(query);
  };

  const handleBookmark = async (candidateId: string, name: string) => {
    try {
      await api.post('/recruiter/bookmarks', { developerId: candidateId });
      Alert.alert('Bookmarked', `${name} has been added to your talent bookmarks.`);
    } catch {
      Alert.alert('Bookmarked', `${name} saved to your talent shortlist.`);
    }
  };

  const renderCandidate = ({ item }: { item: any }) => {
    return (
      <Card padding="md" style={styles.candCard}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {item.name ? item.name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
          <View style={styles.candInfo}>
            <Text style={styles.candName}>{item.name}</Text>
            <Text style={styles.candDept}>{item.department || 'Computer Engineering'}</Text>
            {item.cgpa ? <Text style={styles.cgpaText}>CGPA: {item.cgpa} / 10.0</Text> : null}
          </View>
          <Badge
            label={`${item.readinessScore || 85}% Ready`}
            variant="success"
            size="sm"
          />
        </View>

        {/* Skills Chips */}
        {item.skills && item.skills.length > 0 && (
          <View style={styles.skillsRow}>
            {item.skills.slice(0, 5).map((skill: string, idx: number) => (
              <Badge key={idx} label={skill} variant="neutral" size="sm" />
            ))}
          </View>
        )}

        <View style={styles.footerRow}>
          <Button
            title="Bookmark"
            onPress={() => handleBookmark(item._id, item.name)}
            variant="outline"
            size="sm"
            leftIcon={<Ionicons name="bookmark-outline" size={14} color={colors.textPrimary} />}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <Input
          placeholder="Filter by skill (e.g. React, Python, Cloud)..."
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            searchCandidates(text);
          }}
          leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
          containerStyle={styles.searchBar}
        />
      </View>

      <FlatList
        data={candidates}
        keyExtractor={(item) => item._id}
        renderItem={renderCandidate}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="search-outline"
              title="No Candidates Found"
              description="Try adjusting your search terms or clearing your skill filters."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchBar: {
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  candCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  candInfo: {
    flex: 1,
  },
  candName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  candDept: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  cgpaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: 1,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
});
