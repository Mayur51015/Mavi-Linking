import React from 'react';
import { Link } from 'react-router-dom';

/**
 * BrandLogo — Official Reusable EduTalentX Logo Component
 *
 * @param {'full'|'compact'|'icon'|'icon-only'} variant - Display variant
 * @param {'sm'|'md'|'lg'|'xl'|number} size - Visual size preset or pixel value
 * @param {'horizontal'|'vertical'} layout - Layout direction (default: 'horizontal')
 * @param {boolean} showTagline - Whether to show the official tagline below the name
 * @param {string} linkTo - Optional route to link to (e.g. '/')
 * @param {string} alt - Accessible alt text (defaults to 'EduTalentX')
 * @param {string} className - Additional CSS class name
 * @param {object} style - Inline style overrides for container
 * @param {object} textStyle - Inline style overrides for text
 * @param {object} taglineStyle - Inline style overrides for tagline
 */
const BrandLogo = ({
  variant = 'full',
  size = 'md',
  layout = 'horizontal',
  showTagline = false,
  linkTo,
  alt = 'EduTalentX',
  className = '',
  style = {},
  textStyle = {},
  taglineStyle = {},
  onClick,
}) => {
  // Resolve image dimension
  let iconDimension;
  let fontSize;
  let taglineSize;

  if (typeof size === 'number') {
    iconDimension = size;
    fontSize = `${Math.max(1, (size * 0.038)).toFixed(2)}rem`;
    taglineSize = `${Math.max(0.65, (size * 0.022)).toFixed(2)}rem`;
  } else {
    switch (size) {
      case 'sm':
        iconDimension = 26;
        fontSize = '1.05rem';
        taglineSize = '0.65rem';
        break;
      case 'lg':
        iconDimension = 44;
        fontSize = '1.45rem';
        taglineSize = '0.8rem';
        break;
      case 'xl':
        iconDimension = 56;
        fontSize = '1.85rem';
        taglineSize = '0.875rem';
        break;
      case 'md':
      default:
        iconDimension = 34;
        fontSize = '1.25rem';
        taglineSize = '0.75rem';
        break;
    }
  }

  const isIconOnly = variant === 'icon' || variant === 'icon-only';
  const isVertical = layout === 'vertical';

  const logoImage = (
    <img
      src="/branding/edutalentx-logo.png"
      alt={isIconOnly ? alt : ''}
      aria-hidden={isIconOnly ? undefined : 'true'}
      width={iconDimension}
      height={iconDimension}
      style={{
        width: `${iconDimension}px`,
        height: `${iconDimension}px`,
        objectFit: 'contain',
        flexShrink: 0,
        display: 'block',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
      loading="eager"
    />
  );

  const content = (
    <div
      className={`brand-logo brand-logo-${variant} ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center',
        gap: isVertical ? `${Math.round(iconDimension * 0.22)}px` : `${Math.round(iconDimension * 0.28)}px`,
        textDecoration: 'none',
        userSelect: 'none',
        ...(isVertical ? { textAlign: 'center' } : {}),
        ...style,
      }}
      onClick={onClick}
    >
      {logoImage}

      {!isIconOnly && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1.15,
          ...(isVertical ? { alignItems: 'center' } : {}),
        }}>
          <span
            style={{
              fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 800,
              fontSize,
              letterSpacing: '-0.025em',
              color: 'var(--text-primary, #ffffff)',
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              ...textStyle,
            }}
          >
            EduTalent<span style={{ color: 'var(--brand-blue, #3B82F6)', fontWeight: 800 }}>X</span>
          </span>
          {showTagline && (
            <span
              style={{
                fontSize: taglineSize,
                color: 'var(--text-secondary, #94a3b8)',
                fontWeight: 500,
                marginTop: isVertical ? '0.35rem' : '0.2rem',
                letterSpacing: '-0.01em',
                ...(isVertical ? { textAlign: 'center' } : {}),
                ...taglineStyle,
              }}
            >
              Education, Skills, Intelligence & Hiring
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        style={{
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: isVertical ? 'center' : undefined,
          color: 'inherit',
          ...(isVertical ? { width: '100%' } : {}),
        }}
        aria-label={alt}
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;
