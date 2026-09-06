// ==========================================================
// FITAI MOTION PLATFORM
// MOTION COMPARATOR 1.0
//
// Responsabilidade:
// comparar o estado corporal atual com uma referência.
//
// Ele NÃO:
// - decide se o movimento está certo ou errado
// - dá feedback ao usuário
// - conhece exercícios específicos
//
// Ele apenas mede diferenças.
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


function distance3D(
    a,
    b
) {

    if (
        !a
        ||
        !b
    ) {

        return null;

    }


    const dx =
        (a.x ?? 0)
        -
        (b.x ?? 0);


    const dy =
        (a.y ?? 0)
        -
        (b.y ?? 0);


    const dz =
        (a.z ?? 0)
        -
        (b.z ?? 0);


    return Math.hypot(
        dx,
        dy,
        dz
    );

}


function vectorMagnitude(
    vector
) {

    if (
        !vector
    ) {

        return 0;

    }


    return Math.hypot(
        vector.x ?? 0,
        vector.y ?? 0,
        vector.z ?? 0
    );

}


function angleDifference(
    a,
    b
) {

    if (
        !Number.isFinite(a)
        ||
        !Number.isFinite(b)
    ) {

        return null;

    }


    return Math.abs(
        a - b
    );

}


function average(
    values
) {

    const valid =
        values.filter(
            value =>
                Number.isFinite(value)
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


// ==========================================================
// MOTION COMPARATOR
// ==========================================================

export class MotionComparator {

    constructor(
        options = {}
    ) {

        this.options = {

            minimumJointConfidence:
                options.minimumJointConfidence
                ??
                0.45,

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
                0.25

        };


        this.lastComparison =
            null;

    }


    // ======================================================
    // COMPARE
    // ======================================================

    compare(
        current = {},
        reference = {},
        options = {}
    ) {

        const jointNames =
            options.joints
            ??
            this.getCommonKeys(
                current.joints,
                reference.joints
            );


        const angleNames =
            options.angles
            ??
            this.getCommonKeys(
                current.angles,
                reference.angles
            );


        const joints =
            {};


        const angles =
            {};


        // --------------------------------------------------
        // JOINTS
        // --------------------------------------------------

        for (
            const jointName
            of
            jointNames
        ) {

            const currentJoint =
                current.joints
                    ?.[jointName];


            const referenceJoint =
                reference.joints
                    ?.[jointName];


            if (
                !currentJoint
                ||
                !referenceJoint
            ) {

                continue;

            }


            joints[
                jointName
            ] =
                this.compareJoint(
                    currentJoint,
                    referenceJoint
                );

        }


        // --------------------------------------------------
        // ANGLES
        // --------------------------------------------------

        for (
            const angleName
            of
            angleNames
        ) {

            const currentAngle =
                current.angles
                    ?.[angleName];


            const referenceAngle =
                reference.angles
                    ?.[angleName];


            const difference =
                angleDifference(
                    currentAngle,
                    referenceAngle
                );


            if (
                difference === null
            ) {

                continue;

            }


            angles[
                angleName
            ] = {

                current:
                    currentAngle,

                reference:
                    referenceAngle,

                difference,

                normalizedError:
                    clamp(
                        difference
                        /
                        180
                    ),

                withinTolerance:
                    difference
                    <=
                    this.options.angleTolerance

            };

        }


        // --------------------------------------------------
        // GLOBAL
        // --------------------------------------------------

        const positionErrors =
            Object.values(joints)
            .map(
                joint =>
                    joint.positionError
            );


        const velocityErrors =
            Object.values(joints)
            .map(
                joint =>
                    joint.velocityError
            );


        const angleErrors =
            Object.values(angles)
            .map(
                angle =>
                    angle.difference
            );


        const averagePositionError =
            average(
                positionErrors
            );


        const averageVelocityError =
            average(
                velocityErrors
            );


        const averageAngleError =
            average(
                angleErrors
            );


        const comparison = {

            timestamp:
                performance.now(),

            valid:
                Object.keys(joints).length > 0
                ||
                Object.keys(angles).length > 0,

            joints,

            angles,

            summary: {

                comparedJoints:
                    Object.keys(joints).length,

                comparedAngles:
                    Object.keys(angles).length,

                averagePositionError,

                averageVelocityError,

                averageAngleError,

                positionScore:
                    this.errorToScore(
                        averagePositionError,
                        this.options.positionTolerance
                    ),

                velocityScore:
                    this.errorToScore(
                        averageVelocityError,
                        this.options.velocityTolerance
                    ),

                angleScore:
                    this.errorToScore(
                        averageAngleError,
                        this.options.angleTolerance
                    )

            }

        };


        comparison.summary.overallScore =
            average([
                comparison.summary.positionScore,
                comparison.summary.velocityScore,
                comparison.summary.angleScore
            ])
            ??
            0;


        this.lastComparison =
            comparison;


        return comparison;

    }


    // ======================================================
    // JOINT
    // ======================================================

    compareJoint(
        currentJoint,
        referenceJoint
    ) {

        const currentConfidence =
            currentJoint.confidence
            ??
            currentJoint.visibility
            ??
            0;


        const referenceConfidence =
            referenceJoint.confidence
            ??
            referenceJoint.visibility
            ??
            0;


        const usable =
            currentConfidence
            >=
            this.options.minimumJointConfidence
            &&
            referenceConfidence
            >=
            this.options.minimumJointConfidence;


        const currentPosition =
            currentJoint.normalizedPosition
            ??
            currentJoint.position
            ??
            null;


        const referencePosition =
            referenceJoint.normalizedPosition
            ??
            referenceJoint.position
            ??
            null;


        const positionError =
            usable
                ?
                distance3D(
                    currentPosition,
                    referencePosition
                )
                :
                null;


        const currentVelocity =
            currentJoint.velocity
            ??
            null;


        const referenceVelocity =
            referenceJoint.velocity
            ??
            null;


        const currentSpeed =
            vectorMagnitude(
                currentVelocity
            );


        const referenceSpeed =
            vectorMagnitude(
                referenceVelocity
            );


        const velocityError =
            usable
                ?
                Math.abs(
                    currentSpeed
                    -
                    referenceSpeed
                )
                :
                null;


        return {

            usable,

            confidence: {

                current:
                    currentConfidence,

                reference:
                    referenceConfidence

            },

            position: {

                current:
                    currentPosition,

                reference:
                    referencePosition

            },

            velocity: {

                current:
                    currentVelocity,

                reference:
                    referenceVelocity,

                currentSpeed,

                referenceSpeed

            },

            positionError,

            velocityError,

            positionScore:
                this.errorToScore(
                    positionError,
                    this.options.positionTolerance
                ),

            velocityScore:
                this.errorToScore(
                    velocityError,
                    this.options.velocityTolerance
                ),

            withinPositionTolerance:
                positionError !== null
                &&
                positionError
                <=
                this.options.positionTolerance,

            withinVelocityTolerance:
                velocityError !== null
                &&
                velocityError
                <=
                this.options.velocityTolerance

        };

    }


    // ======================================================
    // SCORE
    //
    // 1 = muito próximo
    // 0 = muito distante
    //
    // Ainda NÃO significa "correto".
    // ======================================================

    errorToScore(
        error,
        tolerance
    ) {

        if (
            !Number.isFinite(error)
            ||
            !Number.isFinite(tolerance)
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


    // ======================================================
    // HELPERS
    // ======================================================

    getCommonKeys(
        a = {},
        b = {}
    ) {

        const keysA =
            Object.keys(
                a ?? {}
            );


        const keysB =
            new Set(
                Object.keys(
                    b ?? {}
                )
            );


        return keysA.filter(
            key =>
                keysB.has(key)
        );

    }


    // ======================================================
    // CONSULTAS
    // ======================================================

    getJointComparison(
        jointName
    ) {

        return (
            this.lastComparison
                ?.joints
                ?.[jointName]
            ??
            null
        );

    }


    getAngleComparison(
        angleName
    ) {

        return (
            this.lastComparison
                ?.angles
                ?.[angleName]
            ??
            null
        );

    }


    getLastComparison() {

        return this.lastComparison;

    }


    // ======================================================
    // RESET
    // ======================================================

    reset() {

        this.lastComparison =
            null;

    }

}