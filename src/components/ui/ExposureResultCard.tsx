"use client";

import { motion } from "framer-motion";

interface ExposureResultCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color: "red" | "amber" | "green";
  delay?: number;
}

const colorMap = {
  red: "text-shieldtx-red border-shieldtx-red/30 bg-shieldtx-red/5",
  amber: "text-shieldtx-amber border-shieldtx-amber/30 bg-shieldtx-amber/5",
  green: "text-shieldtx-green border-shieldtx-green/30 bg-shieldtx-green/5",
};

export function ExposureResultCard({
  label,
  value,
  unit,
  color,
  delay = 0,
}: ExposureResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={`border p-6 ${colorMap[color]}`}
    >
      <p className="font-mono text-xs uppercase tracking-wider text-shieldtx-muted mb-2">
        {label}
      </p>
      <p className="font-mono text-3xl md:text-4xl font-bold">
        {value}
        {unit && <span className="text-lg ml-1 font-normal opacity-70">{unit}</span>}
      </p>
    </motion.div>
  );
}
