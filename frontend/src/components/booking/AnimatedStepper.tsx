import React, { useState, Children, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
    step: number;
    currentStep: number;
    onClickStep: (step: number) => void;
    disableStepIndicators?: boolean;
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators }: StepIndicatorProps) {
    const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';

    const handleClick = () => {
        if (step !== currentStep && !disableStepIndicators) onClickStep(step);
    };

    return (
        <motion.div
            onClick={handleClick}
            className="relative cursor-pointer"
            animate={status}
            initial={false}
        >
            <motion.div
                variants={{
                    inactive: { scale: 1, backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' },
                    active: {
                        scale: 1.1,
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        boxShadow: '0 8px 12px -3px hsl(var(--primary) / 0.3)'
                    },
                    complete: { scale: 1, backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex h-8 w-8 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-full font-black shadow-lg border-2 border-transparent z-20"
            >
                {status === 'complete' ? (
                    <Check className="h-3.5 w-3.5 sm:h-5 sm:w-5 md:h-6 md:w-6" strokeWidth={4} />
                ) : (
                    <span className="text-xs sm:text-base md:text-lg italic">{String(step).padStart(2, '0')}</span>
                )}
            </motion.div>
        </motion.div>
    );
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
    return (
        <div className="relative mx-0 h-1 flex-1 overflow-hidden bg-muted">
            <motion.div
                className="absolute left-0 top-0 h-full bg-primary"
                initial={false}
                animate={{ width: isComplete ? '100%' : '0%', opacity: isComplete ? 1 : 0.3 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
            />
        </div>
    );
}

const stepVariants = {
    enter: (dir: number) => ({
        x: dir > 0 ? '20px' : '-20px',
        opacity: 0,
        pointerEvents: 'none' as const,
        zIndex: 0
    }),
    center: {
        x: 0,
        opacity: 1,
        pointerEvents: 'auto' as const,
        zIndex: 10
    },
    exit: (dir: number) => ({
        x: dir > 0 ? '-20px' : '20px',
        opacity: 0,
        pointerEvents: 'none' as const,
        zIndex: 0
    })
};

interface Step {
    id: number;
    title: string;
    description: string;
}

interface StepperProps {
    steps: Step[];
    children: React.ReactNode;
    currentStep: number;
    onStepChange?: (step: number) => void;
    className?: string;
    stepContainerClassName?: string;
    contentClassName?: string;
    disableStepIndicators?: boolean;
}

export default function AnimatedStepper({
    steps,
    children,
    currentStep,
    onStepChange = () => { },
    className = '',
    stepContainerClassName = '',
    contentClassName = '',
    disableStepIndicators = false,
}: StepperProps) {
    const stepsArray = Children.toArray(children);
    const [direction, setDirection] = useState(0);
    const prevStepRef = useRef(currentStep);

    useEffect(() => {
        if (currentStep !== prevStepRef.current) {
            setDirection(currentStep > prevStepRef.current ? 1 : -1);
            prevStepRef.current = currentStep;
        }
    }, [currentStep]);

    return (
        <div className={cn("flex flex-col w-full", className)}>
            {/* Header */}
            <div
                className={cn(
                    "flex w-full items-center mb-6 sm:mb-12 md:mb-16 px-4 sm:px-6 relative overflow-x-auto pb-10 sm:pb-14 md:pb-16 no-scrollbar snap-x justify-start sm:justify-center min-w-0 max-w-full",
                    stepContainerClassName
                )}
                style={{
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                }}
            >
                {steps.map((step, index) => {
                    const stepNumber = step.id;
                    const isNotLastStep = index < steps.length - 1;
                    const isCurrent = currentStep === stepNumber;
                    const isCompletedStep = currentStep > stepNumber;
                    const hasManySteps = steps.length > 4;

                    return (
                        <React.Fragment key={stepNumber}>
                            <div className="flex flex-col items-center relative z-10 shrink-0 snap-center min-w-[32px] sm:min-w-[80px]">
                                <StepIndicator
                                    step={stepNumber}
                                    disableStepIndicators={disableStepIndicators || stepNumber > currentStep}
                                    currentStep={currentStep}
                                    onClickStep={(clicked) => {
                                        if (clicked <= currentStep) onStepChange(clicked);
                                    }}
                                />
                                <div className="absolute top-9 sm:top-14 left-1/2 -translate-x-1/2 text-center w-14 sm:w-24 md:w-32 flex flex-col items-center">
                                    <p className={cn(
                                        "text-[7px] sm:text-[9px] md:text-[10px] font-black uppercase italic leading-tight transition-all duration-300",
                                        isCurrent
                                            ? "text-primary scale-105 opacity-100 block"
                                            : hasManySteps
                                                ? "hidden xs:block opacity-40"
                                                : "opacity-40 block",
                                        !isCurrent && "tracking-tighter sm:tracking-normal"
                                    )}>
                                        {step.title}
                                    </p>
                                </div>
                            </div>
                            {isNotLastStep && (
                                <div className={cn(
                                    "relative mx-0 h-0.5 sm:h-1 overflow-hidden bg-muted/20 rounded-full transition-all duration-500",
                                    hasManySteps ? "w-4 sm:flex-1 sm:min-w-[60px]" : "flex-1 min-w-[8px] sm:min-w-[60px]"
                                )}>
                                    <motion.div
                                        className="absolute left-0 top-0 h-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                                        initial={false}
                                        animate={{ width: currentStep > stepNumber ? '100%' : '0%', opacity: currentStep > stepNumber ? 1 : 0.3 }}
                                        transition={{ duration: 0.6, ease: "easeInOut" }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Content Stack - Using Grid for seamless transitions without layout issues */}
            <div className={cn("grid w-full", contentClassName)} style={{ gridTemplateColumns: '1fr' }}>
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.15 }
                        }}
                        style={{ gridArea: '1 / 1' }}
                        className="w-full relative"
                    >
                        {stepsArray[currentStep - 1]}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export function AnimatedStep({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("w-full mb-4", className)}>{children}</div>;
}
