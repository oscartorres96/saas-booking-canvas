import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
    id: number;
    title: string;
    description: string;
}

interface BookingStepperProps {
    steps: Step[];
    currentStep: number;
}

export const BookingStepper = ({ steps, currentStep }: BookingStepperProps) => {
    return (
        <div className="w-full py-4 md:py-8 bg-transparent overflow-hidden relative">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between relative">
                    {/* Progress Bar Background */}
                    <div className="absolute left-0 top-5 md:top-6 w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full -z-10" />

                    {/* Active Progress Bar */}
                    <motion.div
                        className="absolute left-0 top-5 md:top-6 h-1 bg-primary rounded-full -z-10 origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: (currentStep - 1) / (steps.length - 1) }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    />

                    {steps.map((step, index) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        const isUpcoming = currentStep < step.id;

                        return (
                            <div key={step.id} className="flex flex-col items-center relative group">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isCurrent ? 1.1 : 1,
                                        backgroundColor: isCompleted ? "var(--primary)" : (isCurrent ? "var(--foreground)" : "var(--background)"),
                                        borderColor: isCompleted || isCurrent ? "var(--primary)" : "var(--border)",
                                    }}
                                    className={cn(
                                        "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center transition-colors duration-500 z-10 shadow-sm",
                                        isCurrent && "shadow-xl shadow-primary/20 ring-4 ring-primary/10",
                                        isUpcoming && "bg-background border-slate-200 dark:border-slate-800"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
                                    ) : (
                                        <span className={cn(
                                            "text-xs font-black italic",
                                            isCurrent ? "text-primary-foreground dark:text-primary" : "text-muted-foreground"
                                        )}>
                                            {String(step.id).padStart(2, '0')}
                                        </span>
                                    )}
                                </motion.div>

                                <div className="mt-3 text-center">
                                    <p className={cn(
                                        "text-[10px] md:text-[11px] font-black uppercase italic tracking-widest transition-all duration-300",
                                        isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground/60"
                                    )}>
                                        {step.title}
                                    </p>
                                    <p className={cn(
                                        "text-[8px] md:text-[9px] font-medium hidden md:block",
                                        isCurrent ? "text-primary transition-colors" : "text-muted-foreground/40"
                                    )}>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

