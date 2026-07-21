import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Check } from "lucide-react";
import { Button, Modal } from "../UI";
import { useAuthStore } from "../../store/useAuthStore";
import {
  BNPL_MIN_ORDER_NAIRA,
  BNPL_MIN_PAY_NOW_RATE,
} from "../../lib/bnplWidget";
import {
  hasBnplWelcomeBeenSeen,
  markBnplWelcomeSeen,
} from "../../lib/bnplWelcomePopup";

const SHOW_DELAY_MS = 3000;

const minOrderLabel = `₦${BNPL_MIN_ORDER_NAIRA.toLocaleString("en-NG")}`;
const payTodayPercent = Math.round(BNPL_MIN_PAY_NOW_RATE * 100);

const HIGHLIGHTS = [
  `Cart total must be at least ${minOrderLabel} to use BNPL at checkout.`,
  `Pay about ${payTodayPercent}% today; spread the rest over flexible plans (up to 5 months).`,
  "Approval may include identity checks (e.g. BVN) via our NeoCash partner.",
  "Fees and repayment terms are shown upfront before you confirm.",
  "You can set up Pay Small Small under Account → Payment for a faster checkout.",
] as const;

function shouldSkipPath(pathname: string): boolean {
  return (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  );
}

/**
 * Informational BNPL popup after login. Isolated from checkout/account BNPL widgets.
 */
const BnplWelcomePopup: React.FC = () => {
  const { pathname } = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const markSeenAndClose = useCallback(() => {
    markBnplWelcomeSeen();
    setIsOpen(false);
  }, []);

  // Show popup after the user is on a normal website route for a few seconds.
  // This is route-based (not the exact login/sign-up moment).
  useEffect(() => {
    clearTimer();

    if (!isAuthenticated) {
      setIsOpen(false);
      return;
    }

    if (isOpen) return;

    if (hasBnplWelcomeBeenSeen()) {
      setIsOpen(false);
      return;
    }

    if (shouldSkipPath(pathname)) {
      setIsOpen(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (!useAuthStore.getState().isAuthenticated) return;
      if (hasBnplWelcomeBeenSeen()) return;
      if (shouldSkipPath(window.location.pathname)) return;
      setIsOpen(true);
    }, SHOW_DELAY_MS);

    return clearTimer;
  }, [isAuthenticated, pathname, isOpen, clearTimer]);

  useEffect(() => {
    if (isOpen && shouldSkipPath(pathname)) {
      setIsOpen(false);
    }
  }, [isOpen, pathname]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={markSeenAndClose}
      title="Buy Now, Pay Later"
      size="md"
      className="border border-gray-200"
      contentClassName="px-6 pt-0 pb-5"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden">
            <img
              src="/banners/9jacart%20BNPL%20seal.png"
              alt=""
              aria-hidden
                className="absolute inset-0 h-full w-full scale-[1.15] object-cover opacity-90"
            />
          </div>
          <p className="text-sm text-muted-foreground leading-snug">
            Welcome to 9jaCart. With{" "}
            <span className="font-medium text-foreground">Pay Small Small</span>,
            you can shop now and pay in installments.
          </p>
        </div>

        <div className="rounded-lg border border-[#2ac12a]/40 bg-[#f0fde8] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[#1E4700]/80">
            Minimum order to use BNPL
          </p>
          <p className="mt-0.5 text-2xl font-semibold text-[#1E4700]">
            {minOrderLabel}
          </p>
          <p className="mt-1 text-xs text-[#1E4700]/75">
            Add enough items to your cart, then choose BNPL at checkout.
          </p>
        </div>

        <ul className="space-y-2.5">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8DEB6E]/25 text-[#1E4700]">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="leading-snug text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-end pt-1">
          <Button type="button" onClick={markSeenAndClose}>
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BnplWelcomePopup;
