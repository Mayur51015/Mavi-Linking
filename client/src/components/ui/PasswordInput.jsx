import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Reusable Password Input Component with Show/Hide Eye Toggle
 * Supports independent state, dark/light theme styling, accessibility, and standard input props.
 */
const PasswordInput = forwardRef(({
  value,
  onChange,
  name,
  id,
  placeholder = '••••••••',
  required = false,
  disabled = false,
  className = 'input-field',
  style = {},
  containerStyle = {},
  autoComplete = 'current-password',
  error,
  icon: LeftIcon,
  ...rest
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    if (!disabled) {
      setShowPassword((prev) => !prev);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', ...containerStyle }}>
      {LeftIcon && (
        <div
          style={{
            position: 'absolute',
            left: '0.9rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary, #a1a1aa)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          {typeof LeftIcon === 'function' ? <LeftIcon size={18} /> : LeftIcon}
        </div>
      )}

      <input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={className}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          paddingLeft: LeftIcon ? '2.6rem' : style.paddingLeft || undefined,
          paddingRight: '2.75rem',
          ...style,
        }}
        {...rest}
      />

      <button
        type="button"
        tabIndex={0}
        onClick={toggleVisibility}
        disabled={disabled}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          padding: '0.25rem',
          margin: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: 'var(--text-secondary, #a1a1aa)',
          borderRadius: '6px',
          transition: 'color 0.2s, background 0.2s',
          zIndex: 2,
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.color = 'var(--text-primary, #ffffff)';
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.color = 'var(--text-secondary, #a1a1aa)';
        }}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
