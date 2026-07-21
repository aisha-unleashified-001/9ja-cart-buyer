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
  clearBnplWelcomePending,
  hasBnplWelcomeBeenSeen,
  isBnplWelcomePending,
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
  const [pendingShow, setPendingShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const markSeenAndClose = useCallback(() => {
    markBnplWelcomeSeen();
    setPendingShow(false);
    setIsOpen(false);
  }, []);

  // Pick up the pending flag set by login / Google login / email verify.
  useEffect(() => {
    if (!isAuthenticated) {
      clearTimer();
      setPendingShow(false);
      setIsOpen(false);
      return;
    }

    if (hasBnplWelcomeBeenSeen()) {
      clearBnplWelcomePending();
      return;
    }

    if (isBnplWelcomePending()) {
      setPendingShow(true);
    }
  }, [isAuthenticated, clearTimer]);

  // Wait until the user is off auth/checkout, then show after a short delay.
  useEffect(() => {
    clearTimer();

    if (!pendingShow || !isAuthenticated || isOpen || hasBnplWelcomeBeenSeen()) {
      return;
    }

    if (shouldSkipPath(pathname)) {
      return;
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (!useAuthStore.getState().isAuthenticated) return;
      if (shouldSkipPath(window.location.pathname)) return;
      if (hasBnplWelcomeBeenSeen()) return;
      setIsOpen(true);
    }, SHOW_DELAY_MS);

    return clearTimer;
  }, [pendingShow, isAuthenticated, pathname, isOpen, clearTimer]);

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
          <img
            src="/banners/9jacart%20BNPL%20seal.png"
            alt=""
            aria-hidden
            className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 object-contain -m-1 opacity-90"
          />
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
