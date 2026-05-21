"use client";

import { type FormEvent, useState } from "react";
import { submitFeedbackReport } from "@/lib/supabase/core";
import type { FeedbackCategory } from "@/types/user";

type FeedbackDialogProps = {
  initialCategory?: FeedbackCategory;
  onClose: () => void;
  onSubmitted?: () => void;
};

export default function FeedbackDialog({
  initialCategory = "feedback",
  onClose,
  onSubmitted,
}: FeedbackDialogProps) {
  const [feedbackCategory, setFeedbackCategory] =
    useState<FeedbackCategory>(initialCategory);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState("");

  async function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = feedbackMessage.trim();
    if (!message) {
      setFeedbackStatus("Please write something before submitting.");
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackStatus("");
    try {
      await submitFeedbackReport({
        category: feedbackCategory,
        message,
        pagePath: typeof window === "undefined" ? null : window.location.pathname,
        userAgent: typeof navigator === "undefined" ? null : navigator.userAgent,
      });
      setFeedbackMessage("");
      setFeedbackStatus("Thanks, your report has been saved.");
      onSubmitted?.();
    } catch {
      setFeedbackStatus("Could not submit this right now. Please try again.");
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111015] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-cindr)]">
              Help improve Cindr
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Send feedback
            </h2>
            <p className="mt-1 text-sm text-white/55">
              Tell us what felt broken, confusing, or what you want next.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.04] p-1">
            {(["feedback", "issue"] as FeedbackCategory[]).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setFeedbackCategory(category)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  feedbackCategory === category
                    ? "bg-[var(--color-cindr)] text-white"
                    : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {category === "feedback" ? "Feedback" : "Report issue"}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-white/75">
              What happened?
            </span>
            <textarea
              value={feedbackMessage}
              onChange={(event) => setFeedbackMessage(event.target.value)}
              rows={5}
              placeholder="Example: The trailer opened but would not play on mobile..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[var(--color-cindr)]/60"
            />
          </label>

          {feedbackStatus && (
            <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/70">
              {feedbackStatus}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={feedbackSubmitting}
              className="rounded-full bg-[var(--color-cindr)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-cindr-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {feedbackSubmitting ? "Sending..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
