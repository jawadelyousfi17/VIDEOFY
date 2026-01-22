import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepProps {
  step: number; // The number of this step
  currentStep: number; // The current active step in the wizard
  title: string;
}

const Step = ({ step, currentStep, title }: StepProps) => {
  const status =
    step < currentStep
      ? "completed"
      : step === currentStep
        ? "current"
        : "upcoming";

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[80px] z-10 relative group">
      <div
        className={cn(
          "flex justify-center items-center h-10 w-10 rounded-full border-2 transition-all duration-300 shadow-sm",
          status === "completed"
            ? "bg-primary border-primary text-primary-foreground"
            : status === "current"
              ? "bg-background border-primary text-primary ring-4 ring-primary/20"
              : "bg-muted/50 border-muted-foreground/30 text-muted-foreground",
        )}
      >
        {status === "completed" ? (
          <Check className="h-5 w-5" />
        ) : (
          <span className="text-sm font-bold">{step}</span>
        )}
      </div>
      <span
        className={cn(
          "text-xs font-semibold text-center select-none max-w-[120px] transition-colors duration-300",
          status === "current"
            ? "text-primary"
            : status === "completed"
              ? "text-foreground/80"
              : "text-muted-foreground",
        )}
      >
        {title}
      </span>
    </div>
  );
};

export default Step;
