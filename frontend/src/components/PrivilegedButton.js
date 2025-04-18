import React, { memo } from "react";
import { usePrivileges } from "./Privileges";
import { Button } from "@mui/material";

const PrivilegedButton = ({
  requiredPrivilege,
  children,
  onClick,
  disabled = false,
  ...props
}) => {
  const { hasPrivilege, loading } = usePrivileges();

  // If privileges are still loading, disable the button
  if (loading) {
    return (
      <Button disabled aria-label="Loading permissions..." {...props}>
        {children}
      </Button>
    );
  }

  // If no privilege is required, render the button normally
  if (!requiredPrivilege) {
    return (
      <Button onClick={onClick} disabled={disabled} {...props}>
        {children}
      </Button>
    );
  }

  // Check if user has the required privilege
  const hasAccess = hasPrivilege(requiredPrivilege);

  // If user doesn't have access, don't render the button
  if (!hasAccess) {
    return null;
  }

  // Render the button with the provided props
  return (
    <Button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </Button>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(PrivilegedButton); 