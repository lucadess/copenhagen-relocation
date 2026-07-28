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
            initial={reduceMotion ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
