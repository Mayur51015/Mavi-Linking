import React, { useEffect, useRef, useState } from 'react';

const HOVER_SELECTOR =
  'a, button, input, textarea, select, [role="button"], ' +
  '.btn, .nav-link, .glass-card, .glass-card-static, .elevated-card, ' +
  '.gradient-border-card, .tab, .footer-link, .toggle-track, .badge';

const CustomCursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    const touchDevice = window.matchMedia('(pointer: coarse)').matches;
    setIsTouch(touchDevice);
    if (touchDevice) return;

    document.body.classList.add('custom-cursor-active');

    let ringX = 0, ringY = 0;
    let mouseX = 0, mouseY = 0;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      }
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px)`;
      }
      requestAnimationFrame(animateRing);
    };

    const handleOver = (e) => {
      if (e.target.closest(HOVER_SELECTOR)) {
        ringRef.current?.classList.add('cursor-hover');
      }
    };
    const handleOut = (e) => {
      if (e.target.closest(HOVER_SELECTOR)) {
        ringRef.current?.classList.remove('cursor-hover');
      }
    };
    const handleDown = () => ringRef.current?.classList.add('cursor-active');
    const handleUp = () => ringRef.current?.classList.remove('cursor-active');

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleOver);
    document.addEventListener('mouseout', handleOut);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    const rafId = requestAnimationFrame(animateRing);

    return () => {
      document.body.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleOver);
      document.removeEventListener('mouseout', handleOut);
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (isTouch) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
};

export default CustomCursor;