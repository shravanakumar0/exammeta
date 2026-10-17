import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Only scroll to top on PUSH (new page) or REPLACE
    // POP means back/forward button, let browser restore scroll
    if (navType !== 'POP') {
      if (hash) {
        requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }));
      } else {
        window.scrollTo(0, 0);
      }
    }
  }, [pathname, hash, navType]);

  return null;
};

export default ScrollToTop;
