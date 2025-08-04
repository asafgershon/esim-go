"use client";

import { LoginModalWrapper } from "@/components/login-modal-wrapper";
import { parseAsBoolean, useQueryState } from "nuqs";

export function HomeWithState() {
  const [showLogin] = useQueryState(
    "showLogin",
    parseAsBoolean.withDefault(false)
  );

  // Handle successful login - just navigate directly
  const handleLoginSuccess = () => {
    // Use the most direct navigation method
    window.location.href = "/profile";
  };

  return (
    <>
      {showLogin && <LoginModalWrapper onLoginSuccess={handleLoginSuccess} />}
    </>
  );
}