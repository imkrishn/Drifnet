import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function WarningModal({
  open = false,
  onClose = () => {},
  onConfirm = () => {},
  title = "Are you sure?",
  message = "This action cannot be undone.",
  okText = "OK",
  cancelText = "Cancel",
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Background Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Warning Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative bg-[hsl(var(--background))] text-[hsl(var(--foreground))] rounded-2xl shadow-2xl w-[90%] max-w-md p-6 md:p-8 border border-[hsl(var(--border))] flex flex-col items-center text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/10 ring-2 ring-orange-500/20">
                <AlertTriangle className="w-14 h-14 text-orange-500" />
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-semibold mb-2">{title}</h2>
            <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-sm">
              {message}
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted-hover))] transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                {okText}
              </button>
            </div>

            <span className="text-xs text-muted-foreground mt-4 opacity-70">
              This action will be executed immediately.
            </span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
