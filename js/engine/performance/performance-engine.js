// ==========================================================
// FITAI MOTION PLATFORM
// PERFORMANCE ENGINE 1.0
//
// Responsabilidade:
// transformar dados de movimento e comparação
// em métricas genéricas de desempenho.
//
// NÃO conhece exercícios específicos.
// NÃO dá feedback.
// NÃO decide "certo" ou "errado".
// ==========================================================


// ==========================================================
// HELPERS
// ==========================================================

function clamp(
    value,
    min = 0,
    max = 1
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}


function average(
    values
) {

    const valid =
        values.filter(
            value =>
                Number.isFinite(
                    value
                )
        );


    if (
        valid.length === 0
    ) {

        return null;

    }


    return (
        valid.reduce(
            (
                total,
                value
            ) =>
                total + value,
            0
        )
        /
        valid.length
    );

}


function scoreFromError(
    error,
    tolerance
) {

    if (
        !Number.isFinite(
            error
        )
        ||
        !Number.isFinite(
            tolerance
        )
        ||
        tolerance <= 0
    ) {

        return null;

    }


    return clamp(
        1
        -
        (
            error
            /
            (
                tolerance
                *
                3
            )
        )
    );

}


// ==========================================================
// PERFORMANCE ENGINE
// ==========================================================

export class PerformanceEngine {

    constructor(
        options = {}
    ) {

        this.options = {

            positionTolerance:
                options.positionTolerance
                ??
                0.15,

            angleTolerance:
                options.angleTolerance
                ??
                15,

            velocityTolerance:
                options.velocityTolerance
                ??
                0.25,

            stabilityReference:
                options.stabilityReference
                ??
                0.05,

            symmetryTolerance:
                options.symmetryTolerance
                ??
                0.12

        };


        this.state =
            this.emptyState();

    }


    // ======================================================
    // UPDATE
    // ======================================================

    update(
        context = {}
    ) {

        const body =
            context.body
            ??
            null;


        const motion =
            context.motion
            ??
            null;


        const comparison =
            context.comparison
            ??
            null;


        const metrics =
            context.metrics
            ??
            null;


        const confidence =
            context.confidence
            ??
            null;


        const performanceState = {

            timestamp:
                performance.now(),

            valid:
                Boolean(
                    body
                    &&
                    confidence
                        ?.detected
                ),

            confidence:
                confidence
                    ?.detectionScore
                ??
                confidence
                    ?.overall
                ??
                0,

            movement: {

                state:
                    motion
                        ?.bodyState
                    ??
                    "unknown",

                intensity:
                    motion
                        ?.intensity
                    ??
                    0

            },

            reference: {

                active:
                    Boolean(
                        comparison
                            ?.valid
                    ),

                position:
                    comparison
                        ?.summary
                        ?.positionScore
                    ??
                    null,

                velocity:
                    comparison
                        ?.summary
                        ?.velocityScore
                    ??
                    null,

                angles:
                    comparison
                        ?.summary
                        ?.angleScore
                    ??
                    null,

                overall:
                    comparison
                        ?.summary
                        ?.overallScore
                    ??
                    null

            },

            stability:
                this.calculateStability(
                    context
                ),

            symmetry:
                this.calculateSymmetry(
                    context
                ),

            control:
                this.calculateControl(
                    context
                ),

            consistency:
                this.calculateConsistency(
                    context
                ),

            rangeOfMotion:
                this.calculateRangeOfMotion(
                    context
                ),

            timing:
                this.calculateTiming(
                    context
                ),

            overall:
                null

        };


        performanceState.overall =
    this.calculateOverall(
        performanceState
    );


        this.state =
    performanceState;


return performanceState;

    }


    // ======================================================
    // STABILITY
    // ======================================================

    calculateStability(
        context
    ) {

        const motion =
            context.motion;


        if (
            !motion
        ) {

            return null;

        }


        const intensity =
            motion.intensity
            ??
            0;


        if (
            motion.bodyState
            ===
            "still"
        ) {

            return 1;

        }


        return scoreFromError(
            intensity,
            1
        );

    }


    // ======================================================
    // SYMMETRY
    // ======================================================

    calculateSymmetry(
        context
    ) {

        const body =
            context.body;


        if (
            !body
        ) {

            return null;

        }


        const pairs = [

            [
                "leftElbow",
                "rightElbow"
            ],

            [
                "leftShoulder",
                "rightShoulder"
            ],

            [
                "leftHip",
                "rightHip"
            ],

            [
                "leftKnee",
                "rightKnee"
            ]

        ];


        const errors =
            [];


        for (
            const [
                left,
                right
            ]
            of
            pairs
        ) {

            const leftAngle =
                body.angles
                    ?.[left];


            const rightAngle =
                body.angles
                    ?.[right];


            if (
                Number.isFinite(
                    leftAngle
                )
                &&
                Number.isFinite(
                    rightAngle
                )
            ) {

                errors.push(
                    Math.abs(
                        leftAngle
                        -
                        rightAngle
                    )
                    /
                    180
                );

            }

        }


        const error =
            average(
                errors
            );


        if (
            error === null
        ) {

            return null;

        }


        return scoreFromError(
            error,
            this.options.symmetryTolerance
        );

    }


    // ======================================================
    // CONTROL
    // ======================================================

    calculateControl(
        context
    ) {

        const comparison =
            context.comparison;


        if (
            comparison
                ?.summary
                ?.velocityScore
            !==
            undefined
            &&
            comparison
                ?.summary
                ?.velocityScore
            !==
            null
        ) {

            return comparison
                .summary
                .velocityScore;

        }


        const intensity =
            context.motion
                ?.intensity;


        if (
            !Number.isFinite(
                intensity
            )
        ) {

            return null;

        }


        return clamp(
            1
            -
            (
                intensity
                *
                0.35
            )
        );

    }


    // ======================================================
    // CONSISTENCY
    // ======================================================

    calculateConsistency(
    context
) {

    const history =
        context.history;


    if (
        !history
        ||
        typeof history.getFrames
        !==
        "function"
    ) {

        return null;

    }


    const frames =
        history.getFrames();


    if (
        frames.length < 10
    ) {

        return null;

    }


    const frameSpeeds =
        [];


    for (
        const frame
        of
        frames
    ) {

        const joints =
            frame.joints
            ??
            {};


        const speeds =
            [];


        for (
            const joint
            of
            Object.values(
                joints
            )
        ) {

            const velocity =
                joint
                    ?.velocity;


            if (
                !velocity
            ) {

                continue;

            }


            const speed =
                Math.hypot(

                    velocity.x ?? 0,

                    velocity.y ?? 0,

                    velocity.z ?? 0

                );


            if (
                Number.isFinite(
                    speed
                )
            ) {

                speeds.push(
                    speed
                );

            }

        }


        const frameAverage =
            average(
                speeds
            );


        if (
            frameAverage !== null
        ) {

            frameSpeeds.push(
                frameAverage
            );

        }

    }


    if (
        frameSpeeds.length < 5
    ) {

        return null;

    }


    const mean =
        average(
            frameSpeeds
        );


    const variance =
        average(

            frameSpeeds.map(
                value =>
                    (
                        value
                        -
                        mean
                    )
                    **
                    2
            )

        );


    if (
        variance === null
    ) {

        return null;

    }


    const deviation =
        Math.sqrt(
            variance
        );


    return clamp(
        1
        -
        deviation
    );

}


    // ======================================================
    // RANGE OF MOTION
    // ======================================================

    calculateRangeOfMotion(
        context
    ) {

        const body =
            context.body;


        if (
            !body
            ||
            !body.angles
        ) {

            return null;

        }


        const values =
            Object.values(
                body.angles
            )
            .filter(
                value =>
                    Number.isFinite(
                        value
                    )
            );


        if (
            values.length
            ===
            0
        ) {

            return null;

        }


        const min =
            Math.min(
                ...values
            );


        const max =
            Math.max(
                ...values
            );


        return {

            min,

            max,

            range:
                max - min

        };

    }


    // ======================================================
    // TIMING
    // ======================================================

    calculateTiming(
        context
    ) {

        const referenceFrame =
            context.referenceFrame;


        if (
            !referenceFrame
        ) {

            return null;

        }


        return {

            referenceProgress:
                referenceFrame.progress
                ??
                null,

            referenceTime:
                referenceFrame.time
                ??
                null

        };

    }


    // ======================================================
    // OVERALL
    // ======================================================

    calculateOverall(
        performanceState
    ) {

        const values = [

            performanceState.reference
                ?.overall,

            performanceState.stability,

            performanceState.symmetry,

            performanceState.control,

            performanceState.consistency

        ];


        return average(
            values
        );

    }


    // ======================================================
    // STATE
    // ======================================================

    getState() {

        return this.state;

    }


    emptyState() {

        return {

            timestamp: 0,

            valid: false,

            confidence: 0,

            movement: {

                state:
                    "unknown",

                intensity:
                    0

            },

            reference: {

                active:
                    false,

                position:
                    null,

                velocity:
                    null,

                angles:
                    null,

                overall:
                    null

            },

            stability:
                null,

            symmetry:
                null,

            control:
                null,

            consistency:
                null,

            rangeOfMotion:
                null,

            timing:
                null,

            overall:
                null

        };

    }


    // ======================================================
    // RESET
    // ======================================================

    reset() {

        this.state =
            this.emptyState();

    }

}