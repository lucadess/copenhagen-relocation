import { motion, useReducedMotion } from "framer-motion";

export default function Card({ className = "", style, children, ...rest }) {
  const reduceMotion = useReducedMotion();
  const isInteractive = typeof rest.onClick === "function";
  return (
    <motion.div
      className={"mt-card " + className}
      style={style}
      whileHover={reduceMotion ? undefined : { y: -3, boxShadow: "var(--shadow-md)" }}
      whileTap={reduceMotion || !isInteractive ? undefined : { scale: 0.985 }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.3 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
