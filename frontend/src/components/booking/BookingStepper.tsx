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
        <div className="w-full py-6 md:py-10 lg:py-12 bg-white dark:bg-black overflow-hidden relative">
            {/* Background Texture (Subtle) */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className="max-w-5xl mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between relative">
                    {/* Main Progress Line (The Floor) */}
                    <div className="absolute left-0 top-[18px] md:top-[22px] h-[1px] w-full bg-slate-100 dark:bg-slate-800 -z-10" />

                    {/* Animated Progress Line */}
                    <motion.div
                        className="absolute left-0 top-[18px] md:top-[22px] h-[2px] bg-primary -z-10 origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: (currentStep - 1) / (steps.length - 1) }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    />

                    {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = currentStep > stepNumber;
                        const isCurrent = currentStep === stepNumber;
                        const isUpcoming = currentStep < stepNumber;

                        return (
                            <div key={step.id} className="flex flex-col items-center relative group">
                                {/* Dot/Indicator */}
                                <div className="relative">
                                    <motion.div
                                        animate={isCurrent ? {
                                            scale: [1, 1.3, 1],
                                            boxShadow: ["0 0 0 0px rgba(var(--primary-rgb), 0)", "0 0 0 10px rgba(var(--primary-rgb), 0.1)", "0 0 0 0px rgba(var(--primary-rgb), 0)"]
                                        } : {}}
                                        transition={{ repeat: Infinity, duration: 2.5 }}
                                        className={cn(
                                            "w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-700 z-10",
                                            isCompleted && "bg-primary text-white scale-90",
                                            isCurrent && "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl scale-110",
                                            isUpcoming && "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-300"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <Check className="h-4 w-4 md:h-5 md:w-5" strokeWidth={3} />
                                        ) : (
                                            <span className="text-[10px] md:text-xs font-black italic tracking-tighter">{String(stepNumber).padStart(2, '0')}</span>
                                        )}
                                    </motion.div>

                                    {/* Pulse effect for Current */}
                                    {isCurrent && (
                                        <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
                                    )}
                                </div>

                                {/* Label */}
                                <div className="mt-3 md:mt-6 text-center px-1">
                                    <motion.p
                                        animate={{ opacity: isCurrent || isCompleted ? 1 : 0.4 }}
                                        className={cn(
                                            "text-[8px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-black uppercase italic tracking-[0.15em] md:tracking-[0.2em] transition-all duration-500",
                                            (isCurrent || isCompleted) ? "text-slate-900 dark:text-white" : "text-slate-400"
                                        )}
                                    >
                                        {step.title}
                                    </motion.p>

                                    {/* Indicator bar for active step */}
                                    {isCurrent && (
                                        <motion.div
                                            layoutId="active-step-bar"
                                            className="h-0.5 w-4 md:w-6 bg-primary mx-auto mt-1 rounded-full"
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
