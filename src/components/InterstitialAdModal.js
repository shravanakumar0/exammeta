import React from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM
import { motion, AnimatePresence } from 'framer-motion';
import './InterstitialAdModal.css';

const InterstitialAdModal = ({ isOpen, onComplete, resourceTitle }) => {
  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="interstitial-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="interstitial-modal"
          >
            <div className="modal-header">
              <h3>Resource ready</h3>
            </div>

            <div className="modal-body">
              <div className="modal-footer-action">
                <p>{resourceTitle ? `Open ${resourceTitle}?` : "Open this study resource?"}</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="continue-resource-btn"
                  onClick={onComplete}
                >
                  Continue to Resource
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default InterstitialAdModal;
