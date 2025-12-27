export type StepType =
    | 'SERVICE'
    | 'PACKAGE'
    | 'RESOURCE'
    | 'SCHEDULE'
    | 'DETAILS'
    | 'PAYMENT'
    | 'CONFIRMATION';

export interface BookingEngineContext {
    bookingConfig?: {
        services?: { enabled: boolean; paymentTiming: 'NONE' | 'BEFORE_BOOKING' };
        packages?: { enabled: boolean; paymentTiming: 'BEFORE_BOOKING' };
    };
    paymentMode?: 'DIRECT_TO_BUSINESS' | 'BOOKPRO_COLLECTS';
    productType: 'SERVICE' | 'PACKAGE';
    requiresResource?: boolean;
    userHasValidPackage?: boolean;
    isBuyAndBook?: boolean;
    paymentPolicy?: 'RESERVE_ONLY' | 'PAY_BEFORE_BOOKING' | 'PACKAGE_OR_PAY';
}

/**
 * Modern, dynamic booking step generator.
 * This engine centralizes all business logic for the booking flow.
 * The frontend should only render what this function returns.
 */
export function generateBookingSteps(context: BookingEngineContext): StepType[] {
    const { bookingConfig, productType, requiresResource, userHasValidPackage, isBuyAndBook } = context;
    const steps: StepType[] = [];

    // 1. Initial product selection
    if (productType === 'PACKAGE' || isBuyAndBook) {
        if (bookingConfig?.packages?.enabled !== false || productType === 'PACKAGE') {
            steps.push('PACKAGE');
        }
    }

    if (productType === 'SERVICE' || isBuyAndBook) {
        if (bookingConfig?.services?.enabled !== false || productType === 'SERVICE') {
            steps.push('SERVICE');
        }

        // 1. Schedule selection
        steps.push('SCHEDULE');

        // 2. Resource selection (Map/Bike/etc) - MUST be after schedule as it depends on it
        if (requiresResource) {
            steps.push('RESOURCE');
        }
    }

    // 4. Customer Details
    steps.push('DETAILS');

    // 5. Payment Decision
    let paymentRequired = false;

    if (productType === 'PACKAGE' || isBuyAndBook) {
        paymentRequired = bookingConfig?.packages?.paymentTiming === 'BEFORE_BOOKING';
    } else {
        // SERVICE flow
        const policy = context.paymentPolicy;
        const isMandatoryByPolicy = policy === 'PAY_BEFORE_BOOKING' || policy === 'PACKAGE_OR_PAY';

        if ((bookingConfig?.services?.paymentTiming === 'BEFORE_BOOKING' || isMandatoryByPolicy) && !userHasValidPackage) {
            paymentRequired = true;
        }
    }

    if (paymentRequired) {
        steps.push('PAYMENT');
    }

    // 6. Confirmation
    steps.push('CONFIRMATION');

    return steps;
}
