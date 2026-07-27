import { motion, useReducedMotion } from "framer-motion";

export default function Card({ className = "", style, children, ...rest }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={"mt-card " + className}
      style={style}
      whileHover={reduceMotion ? undefined : { y: -3, boxShadow: "var(--shadow-md)" }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
