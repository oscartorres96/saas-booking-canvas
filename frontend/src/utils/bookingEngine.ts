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
        if (bookingConfig?.packages?.enabled !== false) {
            steps.push('PACKAGE');
        }
    }

    if (productType === 'SERVICE' || isBuyAndBook) {
        if (bookingConfig?.services?.enabled !== false) {
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
        if (bookingConfig?.services?.paymentTiming === 'BEFORE_BOOKING' && !userHasValidPackage) {
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
