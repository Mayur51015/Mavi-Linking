import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * EmptyState — A reusable, animated empty-state card.
 *
 * Props:
 *  icon          – Lucide icon component (e.g. <GitBranch size={32} />)
 *  iconColor     – CSS color string for the icon glow / container tint (default: var(--accent-purple))
 *  title         – Primary heading text
 *  description   – Supporting sub-text
 *  action        – { label, onClick?, href? } for the primary CTA button
 *  secondaryAction – { label, onClick?, href? } for a secondary (outline) CTA button
 *  size          – 'sm' | 'md' | 'lg' — controls internal padding/icon size
 *  className     – extra class names to add to the wrapper
 *  style         – extra inline styles for the wrapper
 */
const EmptyState = ({
  icon,
  iconColor = 'var(--accent-purple)',
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className = '',
  style = {},
}) => {
  const navigate = useNavigate();

  const sizes = {
    sm: { padding: '2rem 1.5rem', iconBox: '52px', gap: '1rem' },
    md: { padding: '3rem 2rem', iconBox: '64px', gap: '1.25rem' },
    lg: { padding: '4rem 2rem', iconBox: '80px', gap: '1.5rem' },
  };
  const s = sizes[size] || sizes.md;

  const handleAction = (a) => {
    if (a.onClick) return a.onClick();
    if (a.href) navigate(a.href);
  };

  // Derive a subtle background tint from the icon color
  const glowBg = iconColor.startsWith('var(')
    ? 'rgba(139, 92, 246, 0.12)'
    : `${iconColor}1a`; // hex with ~10% opacity fallback

  return (
    <motion.div
      className={`glass-card empty-state-wrapper ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        padding: s.padding,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: s.gap,
        ...style,
      }}
    >
      {/* Animated Icon Container */}
      <motion.div
        className="empty-state-icon-wrap"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          width: s.iconBox,
          height: s.iconBox,
          borderRadius: '50%',
          background: glowBg,
          border: `1px solid ${iconColor}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 24px ${iconColor}22`,
          flexShrink: 0,
        }}
      >
        {icon}
      </motion.div>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxWidth: '360px' }}>
        {title && (
          <div
            style={{
              fontSize: size === 'lg' ? '1.25rem' : '1.05rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
        )}
        {description && (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.25rem' }}>
          {action && (
            <button
              className="btn btn-primary"
              onClick={() => handleAction(action)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
            >
              {action.icon && action.icon}
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              className="btn btn-outline"
              onClick={() => handleAction(secondaryAction)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
            >
              {secondaryAction.icon && secondaryAction.icon}
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState;
