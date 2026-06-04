import React, { useCallback, useEffect, useRef, useState } from "react";
import { init as initBnplWidget } from "@neocash/bnpl-widget";
import type { WidgetHandle } from "@neocash/bnpl-widget";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Alert, Loading } from "../UI";
import { useProfile } from "../../hooks/api/useProfile";
import { useAuthStore } from "../../store/useAuthStore";
import { config } from "../../lib/config";
import {
  BNPL_ACCOUNT_SETUP_CART,
  BNPL_ACCOUNT_SETUP_CART_NAIRA,
  BNPL_WIDGET_THEME,
  buildPartnerPrefill,
  clearBnplProfileSetup,
  getBnplProfileSetup,
  saveBnplProfileSetup,
  type BnplProfileSetupRecord,
} from "../../lib/bnplWidget";

const PaymentSection: React.FC = () => {
  const { user } = useAuthStore();
  const { profile, isLoading, error, fetchProfile } = useProfile();
  const bnplWidgetHandleRef = useRef<WidgetHandle | null>(null);
  const [setupRecord, setSetupRecord] = useState<BnplProfileSetupRecord | null>(
    () => getBnplProfileSetup()
  );
  const [isOpeningWidget, setIsOpeningWidget] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [setupSuccessMessage, setSetupSuccessMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!profile) {
      void fetchProfile();
    }
  }, [profile, fetchProfile]);

  useEffect(() => {
    return () => {
      bnplWidgetHandleRef.current?.close();
      bnplWidgetHandleRef.current = null;
    };
  }, []);

  const resolvePrefill = useCallback(() => {
    return buildPartnerPrefill({
      firstName: profile?.firstName ?? user?.firstName,
      lastName: profile?.lastName ?? user?.lastName,
      phone: profile?.phone ?? user?.phone,
      email: profile?.email ?? user?.email,
    });
  }, [profile, user]);

  const handleOpenBnplSetup = () => {
    setWidgetError(null);
    setSetupSuccessMessage(null);
    setIsOpeningWidget(true);

    bnplWidgetHandleRef.current?.close();
    bnplWidgetHandleRef.current = null;

    const prefill = resolvePrefill();

    try {
      const handle = initBnplWidget({
        publicKey: config.neocash.publicKey,
        cart: BNPL_ACCOUNT_SETUP_CART,
        ...(prefill && { partnerPrefill: prefill }),
        theme: BNPL_WIDGET_THEME,
        onApprovalPending: (applicationId) => {
          saveBnplProfileSetup(applicationId);
          setSetupRecord(getBnplProfileSetup());
          setSetupSuccessMessage(
            "Your Pay Small Small application was submitted. You can use BNPL at checkout once approved."
          );
        },
        onClose: () => {
          bnplWidgetHandleRef.current = null;
          setIsOpeningWidget(false);
        },
        onError: (err) => {
          console.error("NeoCash BNPL widget error:", err);
          bnplWidgetHandleRef.current = null;
          setIsOpeningWidget(false);
          setWidgetError(
            "We could not open Pay Small Small setup. Please try again or contact support."
          );
        },
      });
      bnplWidgetHandleRef.current = handle;
    } catch (err) {
      console.error("NeoCash BNPL widget init error:", err);
      setIsOpeningWidget(false);
      setWidgetError(
        "We could not open Pay Small Small setup. Please try again or contact support."
      );
    }
  };

  const handleClearLocalSetup = () => {
    clearBnplProfileSetup();
    setSetupRecord(null);
    setSetupSuccessMessage(null);
  };

  if (isLoading && !profile) {
    return (
      <div className="flex justify-center py-12">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">My Payment Options</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage how you pay on 9jaCart, including Buy Now, Pay Later (Pay Small Small).
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      )}

      {setupSuccessMessage && (
        <Alert variant="default">
          <p>{setupSuccessMessage}</p>
        </Alert>
      )}

      {widgetError && (
        <Alert variant="destructive">
          <p>{widgetError}</p>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
          <span className="rounded-lg bg-primary/10 p-2 text-primary">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <CardTitle className="text-lg">Buy Now, Pay Later (Pay Small Small)</CardTitle>
            <p className="mt-1 text-sm font-normal text-muted-foreground">
              Complete identity and credit verification here before checkout so your first
              BNPL purchase is faster. The NeoCash widget walks you through BVN verification,
              selfie liveness, and employment details when needed.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {setupRecord ? (
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">Setup submitted</p>
                <p className="text-muted-foreground">
                  Application reference saved on this device. Final approval is sent via
                  NeoCash webhooks — you can still complete or refresh verification if
                  prompted at checkout.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Submitted{" "}
                  {new Date(setupRecord.completedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You have not started Pay Small Small setup on this device yet.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleOpenBnplSetup}
              disabled={isOpeningWidget}
            >
              {setupRecord ? "Update Pay Small Small details" : "Set up Pay Small Small"}
            </Button>
            {setupRecord && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearLocalSetup}
              >
                Clear saved status on this device
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Powered by NeoCash. The widget requires a basket within NeoCash limits (about
            ₦{BNPL_ACCOUNT_SETUP_CART_NAIRA.toLocaleString()} placeholder for setup only).
            That amount is not a 9jaCart purchase — your real order total applies when you
            choose BNPL at checkout.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Card and bank transfer options are selected during checkout. Saved cards will
            appear here when available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSection;
