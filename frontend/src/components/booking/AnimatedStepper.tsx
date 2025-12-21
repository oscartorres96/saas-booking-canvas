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
                        scale: 1.15,
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        boxShadow: '0 10px 15px -3px hsl(var(--primary) / 0.3)'
                    },
                    complete: { scale: 1, backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex h-10 w-10 items-center justify-center rounded-full font-black shadow-lg border-2 border-transparent z-20"
            >
                {status === 'complete' ? (
                    <Check className="h-5 w-5" strokeWidth={4} />
                ) : (
                    <span className="text-sm italic">{String(step).padStart(2, '0')}</span>
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
            <div className={cn("flex w-full items-center mb-16 px-0 md:px-4 relative", stepContainerClassName)}>
                {steps.map((step, index) => {
                    const stepNumber = step.id;
                    const isNotLastStep = index < steps.length - 1;
                    const isCurrent = currentStep === stepNumber;
                    const isCompletedStep = currentStep > stepNumber;

                    return (
                        <React.Fragment key={stepNumber}>
                            <div className="flex flex-col items-center relative z-10">
                                <StepIndicator
                                    step={stepNumber}
                                    disableStepIndicators={disableStepIndicators || stepNumber > currentStep}
                                    currentStep={currentStep}
                                    onClickStep={(clicked) => {
                                        if (clicked <= currentStep) onStepChange(clicked);
                                    }}
                                />
                                <div className="absolute top-12 text-center w-32 flex flex-col items-center">
                                    <p className={cn(
                                        "text-[9px] md:text-[10px] font-black uppercase italic tracking-widest",
                                        isCurrent ? "text-primary" : isCompletedStep ? "text-foreground opacity-80" : "text-muted-foreground/40"
                                    )}>
                                        {step.title}
                                    </p>
                                </div>
                            </div>
                            {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
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
