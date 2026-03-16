"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <motion.div
      className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

