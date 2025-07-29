import { Badge } from "@workspace/ui";
import { Zap } from "lucide-react";
import React from "react";

interface AppliedRule {
  id?: string;
  name: string;
  type: string;
  impact: number;
}

interface AppliedRulesProps {
  rules: AppliedRule[];
  currency?: string;
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export const AppliedRules: React.FC<AppliedRulesProps> = ({
  rules,
  currency = "USD",
  className = "",
  showTitle = true,
  compact = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  if (!rules || rules.length === 0) {
    return null;
  }

  const titleClass = compact ? "text-xs" : "text-sm";
  const itemClass = compact ? "text-xs" : "text-sm";
  const badgeClass = compact ? "text-xs" : "text-xs";
  const paddingClass = compact ? "p-1.5" : "p-2";

  return (
    <div className={`space-y-2 ${className}`}>
      {showTitle && (
        <h4 className={`font-medium flex items-center gap-2 ${titleClass}`}>
          <Zap className="h-4 w-4" />
          Applied Rules
        </h4>
      )}
      <div className="space-y-1">
        {rules.map((rule, index) => (
          <div
            key={rule.id || index}
            className={`flex items-center justify-between bg-muted/50 rounded-md ${itemClass} ${paddingClass}`}
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={badgeClass}>
                {rule.type}
              </Badge>
              <span className="text-gray-700">{rule.name}</span>
            </div>
            <span
              className={`font-mono font-medium ${
                rule.impact > 0
                  ? "text-green-600"
                  : rule.impact < 0
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {rule.impact > 0 ? "+" : ""}
              {formatCurrency(rule.impact)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};