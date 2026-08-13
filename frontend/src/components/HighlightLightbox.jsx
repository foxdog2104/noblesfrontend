import React, { useEffect, useCallback } from 'react';
import arrowLeft from '../assets/images/arrow-left.svg';
import arrowRight from '../assets/images/arrow-right.svg';
import closeX from '../assets/images/close-x.svg';

const HighlightLightbox = ({ highlights, activeIndex, onClose, onIndexChange }) => {
  const total = highlights.length;

  const goPrev = useCallback((e) => {
    e.stopPropagation();
    onIndexChange((i) => (i - 1 + total) % total);
  }, [total, onIndexChange]);

  const goNext = useCallback((e) => {
    e.stopPropagation();
    onIndexChange((i) => (i + 1) % total);
  }, [total, onIndexChange]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onIndexChange((i) => (i - 1 + total) % total);
      if (e.key === 'ArrowRight') onIndexChange((i) => (i + 1) % total);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onIndexChange, total]);

  if (activeIndex === null) return null;

  return (
    <div
      className="highlight-lightbox"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        className="highlight-lightbox-close"
        onClick={onClose}
        aria-label="Close"
      >
        <img src={closeX} alt="" className="lightbox-icon" />
      </button>

      <button
        type="button"
        className="lightbox-nav lightbox-nav-prev"
        onClick={goPrev}
        aria-label="Previous image"
      >
        <img src={arrowLeft} alt="" className="lightbox-icon" />
      </button>

      <div
        className="highlight-lightbox-content"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={highlights[activeIndex].src}
          alt=""
          className="highlight-lightbox-image"
        />
        <div className="highlight-lightbox-caption">
          <p className="highlight-lightbox-credit">
            {activeIndex + 1} / {total}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="lightbox-nav lightbox-nav-next"
        onClick={goNext}
        aria-label="Next image"
      >
        <img src={arrowRight} alt="" className="lightbox-icon" />
      </button>
    </div>
  );
};

export default HighlightLightbox;
