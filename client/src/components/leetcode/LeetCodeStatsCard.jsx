import React from 'react';
import { Trophy, Star, TrendingUp, Award } from 'lucide-react';

const LeetCodeStatsCard = ({ data }) => {
  if (!data) return null;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '1.25rem 1.4rem',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png"
          alt="LeetCode"
          style={{ width: '20px', height: '20px', objectFit: 'contain' }}
        />
        <h3
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 700,
            color: '#111111',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          LeetCode Overview
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
        <div
          style={{
            padding: '0.85rem 1rem',
            background: '#F8F9FA',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#4B5563',
              marginBottom: '0.35rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            <Trophy size={15} color="#D97706" />
            <span>Global Ranking</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111111', fontFamily: 'Inter, sans-serif' }}>
            {data.ranking ? `#${data.ranking.toLocaleString()}` : 'N/A'}
          </div>
        </div>

        <div
          style={{
            padding: '0.85rem 1rem',
            background: '#F8F9FA',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#4B5563',
              marginBottom: '0.35rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            <TrendingUp size={15} color="#2563EB" />
            <span>Contest Rating</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111111', fontFamily: 'Inter, sans-serif' }}>
            {data.contestRating ? Math.round(data.contestRating) : 'N/A'}
          </div>
        </div>

        <div
          style={{
            padding: '0.85rem 1rem',
            background: '#F8F9FA',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#4B5563',
              marginBottom: '0.35rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            <Star size={15} color="#7C3AED" />
            <span>Reputation</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111111', fontFamily: 'Inter, sans-serif' }}>
            {data.reputation || 0}
          </div>
        </div>

        <div
          style={{
            padding: '0.85rem 1rem',
            background: '#F8F9FA',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#4B5563',
              marginBottom: '0.35rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            <Award size={15} color="#16A34A" />
            <span>Total Solved</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111111', fontFamily: 'Inter, sans-serif' }}>
            {data.totalSolved || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeetCodeStatsCard;
