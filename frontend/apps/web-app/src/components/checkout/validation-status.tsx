import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface ValidationStatusProps {
  status: "pending" | "valid" | "invalid" | null;
  error?: string | null;
  loading?: boolean;
}

export function ValidationStatus({ status, error, loading }: ValidationStatusProps) {
  if (status === null) return null;

  const getStatusDisplay = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Clock className="w-4 h-4 text-blue-500" />,
          text: "Validating order...",
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
        };
      case "valid":
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          text: "Order validated successfully",
          bgColor: "bg-green-50",
          textColor: "text-green-700",
        };
      case "invalid":
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          text: error || "Order validation failed",
          bgColor: "bg-red-50",
          textColor: "text-red-700",
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4 text-gray-500" />,
          text: "Unknown validation status",
          bgColor: "bg-gray-50",
          textColor: "text-gray-700",
        };
    }
  };

  const { icon, text, bgColor, textColor } = getStatusDisplay();

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${bgColor} ${textColor}`}>
      {loading && status === "pending" ? (
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}