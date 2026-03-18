"use client";

import { motion } from "framer-motion";
import { useInView } from "@/hooks/useInView";

interface SectionWrapperProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export function SectionWrapper({ children, id, className = "" }: SectionWrapperProps) {
  const [ref, inView] = useInView(0.1);

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`px-6 md:px-12 lg:px-20 py-20 md:py-28 max-w-7xl mx-auto ${className}`}
    >
      {children}
    </motion.section>
  );
}
