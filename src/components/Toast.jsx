import { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function Toast({ toast, onDone }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  return (
    <div className="mt-toast-wrap">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="mt-toast"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.3 }}
          >
            <span>{toast.message}</span>
            {toast.actionLabel && (
              <button
                type="button"
                className="mt-toast-action"
                onClick={() => {
                  toast.onAction?.();
                  onDone();
                }}
              >
                {toast.actionLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
