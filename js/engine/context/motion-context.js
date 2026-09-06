// ============================================================
// FITAI MOTION CONTEXT 1.1
// ============================================================
//
// Pacote padronizado com o estado final de um frame.
//
// O Motion Context NÃO calcula biomecânica.
// Ele apenas organiza e disponibiliza os dados produzidos
// pelos diferentes motores da FitAI Motion Platform.
//
// ============================================================


export class MotionContext {

    constructor(
        data = {}
    ) {

        // --------------------------------------------------
        // FRAME
        // --------------------------------------------------

        this.timestamp =
            data.timestamp
            ??
            performance.now();

        this.frameCount =
            data.frameCount
            ??
            0;


        // --------------------------------------------------
        // BODY
        // --------------------------------------------------

        this.body =
            data.body
            ??
            null;

        this.normalizedBody =
            data.normalizedBody
            ??
            null;

        this.confidence =
            data.confidence
            ??
            null;


        // --------------------------------------------------
        // MOTION
        // --------------------------------------------------

        this.motion =
            data.motion
            ??
            null;


        // --------------------------------------------------
        // REFERENCE
        // --------------------------------------------------

        this.reference =
            data.reference
            ??
            null;

        this.referenceFrame =
            data.referenceFrame
            ??
            null;

        this.comparison =
            data.comparison
            ??
            null;


        // --------------------------------------------------
        // PERFORMANCE
        // --------------------------------------------------

        this.performance =
            data.performance
            ??
            null;


        // --------------------------------------------------
        // SKILL
        // --------------------------------------------------

        this.skill =
            data.skill
            ??
            null;


        // --------------------------------------------------
        // SESSION
        // --------------------------------------------------

        this.session =
            data.session
            ??
            null;


        // --------------------------------------------------
        // EVENT BUS
        // --------------------------------------------------

        this.events =
            Array.isArray(
                data.events
            )
                ? [
                    ...data.events
                ]
                : [];


        // --------------------------------------------------
        // COACH
        // --------------------------------------------------

        this.coach =
            data.coach
            ??
            null;


        // --------------------------------------------------
        // FEEDBACK
        // --------------------------------------------------

        this.feedback =
            data.feedback
            ??
            null;


        // --------------------------------------------------
        // VALIDITY
        // --------------------------------------------------

        this.valid =
            Boolean(
                data.valid
            );


        // --------------------------------------------------
        // META
        // --------------------------------------------------

        this.meta = {

            bodyValid:
                Boolean(
                    this.body
                        ?.valid
                ),

            confidenceValid:
                Boolean(
                    this.confidence
                        ?.valid
                    ??
                    this.confidence
                        ?.detected
                ),

            motionValid:
                Boolean(
                    this.motion
                ),

                motionEngineValid:
    Boolean(
        this.motion
            ?.valid
    ),

            referenceActive:
                Boolean(
                    this.reference
                        ?.active
                ),

            skillActive:
                Boolean(
                    this.skill
                        ?.active
                ),

            sessionActive:
                Boolean(
                    this.session
                        ?.active
                ),

            sessionStatus:
                this.session
                    ?.status
                ??
                null,

            coachActive:
                Boolean(
                    this.coach
                        ?.active
                ),

            feedbackActive:
                Boolean(
                    this.feedback
                        ?.active
                ),

            eventCount:
                this.events.length

        };

    }


    // ========================================================
    // BODY
    // ========================================================

    hasBody() {

        return Boolean(
            this.body
        );

    }


    getJoint(
        jointName
    ) {

        if (
            !jointName
            ||
            !this.body
                ?.joints
        ) {

            return null;

        }

        return (
            this.body
                .joints[
                    jointName
                ]
            ??
            null
        );

    }


    getNormalizedJoint(
        jointName
    ) {

        if (
            !jointName
            ||
            !this.normalizedBody
                ?.joints
        ) {

            return null;

        }

        return (
            this.normalizedBody
                .joints[
                    jointName
                ]
            ??
            null
        );

    }


    getAngle(
        angleName
    ) {

        if (
            !angleName
            ||
            !this.body
                ?.angles
        ) {

            return null;

        }

        return (
            this.body
                .angles[
                    angleName
                ]
            ??
            null
        );

    }


    // ========================================================
    // CONFIDENCE
    // ========================================================

    getRegion(
        regionName
    ) {

        if (
            !regionName
            ||
            !this.confidence
        ) {

            return null;

        }

        if (
            this.confidence
                ?.regions
                ?.[
                    regionName
                ]
        ) {

            return (
                this.confidence
                    .regions[
                        regionName
                    ]
            );

        }

        return (
            this.confidence[
                regionName
            ]
            ??
            null
        );

    }


    // ========================================================
    // MOTION
    // ========================================================

    hasMotion() {

        return Boolean(
            this.motion
        );

    }


    // ========================================================
    // REFERENCE
    // ========================================================

    hasReference() {

        return Boolean(
            this.reference
                ?.active
            ||
            this.referenceFrame
        );

    }


    // ========================================================
    // SKILL
    // ========================================================

    hasSkill() {

        return Boolean(
            this.skill
                ?.active
        );

    }


    getSkillMetric(
        metricName
    ) {

        if (
            !metricName
            ||
            !this.skill
                ?.metrics
        ) {

            return null;

        }

        return (
            this.skill
                .metrics[
                    metricName
                ]
            ??
            null
        );

    }


    // ========================================================
    // SESSION
    // ========================================================

    hasSession() {

        return Boolean(
            this.session
                ?.sessionId
            ||
            this.session
                ?.active
        );

    }


    isSessionActive() {

        return (
            this.session
                ?.status
            ===
            "active"
        );

    }


    getCurrentExercise() {

        return (
            this.session
                ?.exercise
            ??
            null
        );

    }


    // ========================================================
    // EVENTS
    // ========================================================

    hasEvents() {

        return (
            this.events.length
            >
            0
        );

    }


    hasEvent(
        type
    ) {

        if (
            !type
        ) {

            return false;

        }

        return this.events.some(
            event =>
                event
                    ?.type
                ===
                type
        );

    }


    getEvents(
        type = null
    ) {

        if (
            !type
        ) {

            return [
                ...this.events
            ];

        }

        return this.events.filter(
            event =>
                event
                    ?.type
                ===
                type
        );

    }


    getLatestEvent(
        type = null
    ) {

        const events =
            this.getEvents(
                type
            );

        if (
            events.length
            ===
            0
        ) {

            return null;

        }

        return events[
            events.length
            -
            1
        ];

    }


    // ========================================================
    // COACH
    // ========================================================

    hasCoachMessage() {

        return Boolean(
            this.coach
                ?.active
            &&
            this.coach
                ?.message
        );

    }


    // ========================================================
    // FEEDBACK
    // ========================================================

    hasFeedback() {

        return Boolean(
            this.feedback
                ?.active
        );

    }


    // ========================================================
    // SUMMARY
    // ========================================================

    toSummary() {

        return {

            timestamp:
                this.timestamp,

            frameCount:
                this.frameCount,

            valid:
                this.valid,

            body:
                {
                    valid:
                        this.meta
                            .bodyValid,

                    confidence:
                        this.confidence
                            ?.overall
                        ??
                        null
                },

            motion:
                {
                    active:
                        this.hasMotion(),

valid:
    this.meta
        .motionEngineValid,


                   state:
    this.motion
        ?.bodyState
    ??
    null,

                    intensity:
                        this.motion
                            ?.intensity
                        ??
                        null
                },

            reference:
                {
                    active:
                        this.meta
                            .referenceActive
                },

            skill:
                {
                    active:
                        this.meta
                            .skillActive,

                    id:
                        this.skill
                            ?.id
                        ??
                        null,

                    phase:
                        this.skill
                            ?.phase
                        ??
                        null
                },

            session:
                {
                    active:
                        this.meta
                            .sessionActive,

                    status:
                        this.meta
                            .sessionStatus,

                    exercise:
                        this.session
                            ?.exercise
                            ?.id
                        ??
                        this.session
                            ?.exercise
                            ?.name
                        ??
                        null,

                    reps:
                        this.session
                            ?.reps
                        ??
                        null,

                    set:
                        this.session
                            ?.set
                        ??
                        null
                },

            events:
                {
                    count:
                        this.events.length,

                    latest:
                        this.getLatestEvent()
                            ?.type
                        ??
                        null
                },

            coach:
                {
                    active:
                        this.meta
                            .coachActive,

                    message:
                        this.coach
                            ?.message
                        ??
                        null
                },

            feedback:
                {
                    active:
                        this.meta
                            .feedbackActive
                }

        };

    }

}


// ============================================================
// FACTORY
// ============================================================

export function createMotionContext(
    data = {}
) {

    return new MotionContext(
        data
    );

}