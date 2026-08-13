const isMobileDevice = () => {
  const ua = navigator.userAgent;
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const touchDevice = navigator.maxTouchPoints > 1;
  return mobileUA || touchDevice;
};

export const applyMobileClass = () => {
  if (isMobileDevice()) {
    document.documentElement.classList.add('is-mobile');
  }
};
