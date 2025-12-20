import React, { useState, Children, useRef, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
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
            className="relative cursor-pointer outline-none focus:outline-none"
            animate={status}
            initial={false}
        >
            <motion.div
                variants={{
                    inactive: {
                        scale: 1,
                        backgroundColor: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))'
                    },
                    active: {
                        scale: 1.15,
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        boxShadow: '0 10px 15px -3px hsl(var(--primary) / 0.3)'
                    },
                    complete: {
                        scale: 1,
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))'
                    }
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
        <div className="relative mx-0 h-1 flex-1 overflow-hidden bg-muted transition-colors duration-500">
            <motion.div
                className="absolute left-0 top-0 h-full bg-primary"
                initial={false}
                animate={{
                    width: isComplete ? '100%' : '0%',
                    opacity: isComplete ? 1 : 0.3
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
            />
        </div>
    );
}

const stepVariants = {
    enter: (dir: number) => ({
        x: dir >= 0 ? '100%' : '-100%',
        opacity: 0,
        filter: 'blur(10px)'
    }),
    center: {
        x: '0%',
        opacity: 1,
        filter: 'blur(0px)'
    },
    exit: (dir: number) => ({
        x: dir >= 0 ? '-50%' : '50%',
        opacity: 0,
        filter: 'blur(10px)'
    })
};

interface StepContentWrapperProps {
    isCompleted: boolean;
    currentStep: number;
    direction: number;
    children: React.ReactNode;
    className?: string;
}

function StepContentWrapper({ isCompleted, currentStep, direction, children, className }: StepContentWrapperProps) {
    const [parentHeight, setParentHeight] = useState<number | 'auto'>('auto');

    return (
        <motion.div
            style={{ position: 'relative', overflow: 'hidden' }}
            animate={{ height: isCompleted ? 0 : parentHeight }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
            className={className}
        >
            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                {!isCompleted && (
                    <SlideTransition key={currentStep} direction={direction} onHeightReady={h => setParentHeight(h)}>
                        {children}
                    </SlideTransition>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

const SlideTransition = forwardRef<HTMLDivElement, { children: React.ReactNode, direction: number, onHeightReady: (h: number) => void }>(
    ({ children, direction, onHeightReady }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);

        useImperativeHandle(ref, () => containerRef.current!);

        useLayoutEffect(() => {
            if (containerRef.current) onHeightReady(containerRef.current.offsetHeight);
        }, [children, onHeightReady]);

        return (
            <motion.div
                ref={containerRef}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
                style={{ width: '100%' }}
            >
                {children}
            </motion.div>
        );
    }
);

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
    ...rest
}: StepperProps) {
    const [direction, setDirection] = useState(0);
    const stepsArray = Children.toArray(children);
    const totalSteps = stepsArray.length;
    const isCompleted = currentStep > totalSteps;

    const prevStepRef = useRef(currentStep);

    useLayoutEffect(() => {
        if (currentStep !== prevStepRef.current) {
            setDirection(currentStep > prevStepRef.current ? 1 : -1);
            prevStepRef.current = currentStep;
        }
    }, [currentStep]);

    return (
        <div className={cn("flex flex-col w-full", className)} {...rest}>
            {/* Header Indicators */}
            <div className={cn("flex w-full items-center mb-16 px-0 md:px-4 relative", stepContainerClassName)}>
                {steps.map((step, index) => {
                    const stepNumber = step.id;
                    const isNotLastStep = index < steps.length - 1;
                    const isCurrent = currentStep === stepNumber;
                    const isCompletedStep = currentStep > stepNumber;

                    return (
                        <React.Fragment key={stepNumber}>
                            <div className="flex flex-col items-center relative z-10 transition-all duration-500">
                                <StepIndicator
                                    step={stepNumber}
                                    disableStepIndicators={disableStepIndicators}
                                    currentStep={currentStep}
                                    onClickStep={(clicked) => {
                                        onStepChange(clicked);
                                    }}
                                />
                                <div className="absolute top-12 text-center w-32 flex flex-col items-center">
                                    <p className={cn(
                                        "text-[9px] md:text-[10px] font-black uppercase italic tracking-widest transition-all duration-500 whitespace-nowrap",
                                        isCurrent ? "text-primary translate-y-0" : isCompletedStep ? "text-foreground opacity-80" : "text-muted-foreground/40"
                                    )}>
                                        {step.title}
                                    </p>
                                    <p className={cn(
                                        "text-[8px] font-medium hidden md:block transition-all duration-500",
                                        isCurrent ? "text-primary/70 opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                                    )}>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                            {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Content */}
            <div className="relative">
                <StepContentWrapper
                    isCompleted={isCompleted}
                    currentStep={currentStep}
                    direction={direction}
                    className={cn("w-full", contentClassName)}
                >
                    {stepsArray[currentStep - 1]}
                </StepContentWrapper>
            </div>
        </div>
    );
}

export function AnimatedStep({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("w-full", className)}>{children}</div>;
}
