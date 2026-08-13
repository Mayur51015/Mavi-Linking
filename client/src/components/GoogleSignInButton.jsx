import React, { useEffect, useRef } from 'react';

const GoogleSignInButton = ({ onSuccess, onError, text = 'signin_with', requestedRole = 'user' }) => {
  const buttonRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '891234567890-example.apps.googleusercontent.com';

  useEffect(() => {
    const handleCredentialResponse = (response) => {
      if (response && response.credential) {
        onSuccess(response.credential);
      } else if (onError) {
        onError('Google Sign-In credential response was empty.');
      }
    };

    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
        });

        if (buttonRef.current) {
          buttonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'filled_black',
            size: 'large',
            text: text,
            width: '100%',
            shape: 'rectangular',
          });
        }
      }
    };

    if (window.google && window.google.accounts) {
      initializeGoogleSignIn();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    }
  }, [clientId, text, onSuccess, onError]);

  return (
    <div style={{ width: '100%', marginTop: '1rem', marginBottom: '1rem' }}>
      <div ref={buttonRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
    </div>
  );
};

export default GoogleSignInButton;
