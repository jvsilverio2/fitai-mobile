// ==========================================================
// FITAI MOTION PLATFORM
// MOTION METRICS 1.0
//
// Responsabilidade:
// extrair métricas temporais reutilizáveis
// a partir do Motion History.
//
// NÃO:
// - detecta corpo
// - decide exercício
// - fornece feedback
// - desenha interface
// ==========================================================


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

        return 0;

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


function min(
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

        return 0;

    }


    return Math.min(
        ...valid
    );

}


function max(
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

        return 0;

    }


    return Math.max(
        ...valid
    );

}


function standardDeviation(
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
        valid.length < 2
    ) {

        return 0;

    }


    const mean =
        average(
            valid
        );


    const variance =
        average(
            valid.map(
                value => {

                    const diff =
                        value - mean;


                    return (
                        diff * diff
                    );

                }
            )
        );


    return Math.sqrt(
        variance
    );

}


// ==========================================================
// MOTION METRICS
// ==========================================================

export class MotionMetrics {

    constructor(
        history
    ) {

        this.history =
            history;

    }


    // ======================================================
    // AMPLITUDE DE ÂNGULO
    // ======================================================

    angleRange(
        angleName,
        milliseconds = 1000
    ) {

        const history =
            this.history
                .getAngleHistory(
                    angleName,
                    milliseconds
                );


        const values =
            history.map(
                item =>
                    item.value
            );


        return {

            min:
                min(
                    values
                ),

            max:
                max(
                    values
                ),

            range:
                max(
                    values
                )
                -
                min(
                    values
                ),

            average:
                average(
                    values
                )

        };

    }


    // ======================================================
    // VELOCIDADE DE ARTICULAÇÃO
    // ======================================================

    jointSpeed(
        jointName,
        milliseconds = 1000
    ) {

        const history =
            this.history
                .getJointHistory(
                    jointName,
                    milliseconds
                );


        const speeds =
            history.map(
                item =>
                    item.velocity
                        ?.speed
                    ??
                    0
            );


        return {

            average:
                average(
                    speeds
                ),

            max:
                max(
                    speeds
                ),

            min:
                min(
                    speeds
                ),

            variability:
                standardDeviation(
                    speeds
                )

        };

    }


    // ======================================================
    // DESLOCAMENTO
    // ======================================================

    jointDisplacement(
        jointName,
        milliseconds = 1000
    ) {

        return this.history
            .getJointDisplacement(
                jointName,
                milliseconds
            );

    }


    // ======================================================
    // ESTABILIDADE
    // ======================================================

    jointStability(
        jointName,
        milliseconds = 1000
    ) {

        const history =
            this.history
                .getJointHistory(
                    jointName,
                    milliseconds
                );


        if (
            history.length < 2
        ) {

            return {

                score: 1,

                variabilityX: 0,

                variabilityY: 0,

                variabilityZ: 0

            };

        }


        const x =
            history.map(
                item =>
                    item.normalizedPosition
                        ?.x
                    ??
                    0
            );


        const y =
            history.map(
                item =>
                    item.normalizedPosition
                        ?.y
                    ??
                    0
            );


        const z =
            history.map(
                item =>
                    item.normalizedPosition
                        ?.z
                    ??
                    0
            );


        const variabilityX =
            standardDeviation(
                x
            );


        const variabilityY =
            standardDeviation(
                y
            );


        const variabilityZ =
            standardDeviation(
                z
            );


        const total =
            (
                variabilityX
                +
                variabilityY
                +
                variabilityZ
            );


        const score =
            Math.max(
                0,
                1 - total
            );


        return {

            score,

            variabilityX,

            variabilityY,

            variabilityZ

        };

    }


    // ======================================================
    // SIMETRIA
    // ======================================================

    jointSymmetry(
        leftJointName,
        rightJointName,
        milliseconds = 1000
    ) {

        const left =
            this.jointSpeed(
                leftJointName,
                milliseconds
            );


        const right =
            this.jointSpeed(
                rightJointName,
                milliseconds
            );


        const maxSpeed =
            Math.max(
                left.average,
                right.average
            );


        if (
            maxSpeed === 0
        ) {

            return {

                score: 1,

                difference: 0

            };

        }


        const difference =
            Math.abs(
                left.average
                -
                right.average
            );


        const score =
            Math.max(
                0,
                1
                -
                (
                    difference
                    /
                    maxSpeed
                )
            );


        return {

            score,

            difference,

            left:
                left.average,

            right:
                right.average

        };

    }


    // ======================================================
    // CONSISTÊNCIA
    // ======================================================

    jointConsistency(
        jointName,
        milliseconds = 1500
    ) {

        const speed =
            this.jointSpeed(
                jointName,
                milliseconds
            );


        if (
            speed.average === 0
        ) {

            return {

                score: 1,

                variability: 0

            };

        }


        const normalizedVariability =
            speed.variability
            /
            speed.average;


        const score =
            Math.max(
                0,
                1
                -
                normalizedVariability
            );


        return {

            score,

            variability:
                speed.variability

        };

    }


    // ======================================================
    // TRAJETÓRIA
    // ======================================================

    jointTrajectory(
        jointName,
        milliseconds = 1000
    ) {

        const history =
            this.history
                .getJointHistory(
                    jointName,
                    milliseconds
                );


        return history.map(
            item => ({

                timestamp:
                    item.timestamp,

                x:
                    item.normalizedPosition
                        ?.x
                    ??
                    0,

                y:
                    item.normalizedPosition
                        ?.y
                    ??
                    0,

                z:
                    item.normalizedPosition
                        ?.z
                    ??
                    0,

                confidence:
                    item.confidence
                    ??
                    0

            })
        );

    }


    // ======================================================
    // API
    // ======================================================

    snapshot(
        milliseconds = 1000
    ) {

        return {

            leftWristSpeed:
                this.jointSpeed(
                    "leftWrist",
                    milliseconds
                ),

            rightWristSpeed:
                this.jointSpeed(
                    "rightWrist",
                    milliseconds
                ),

            leftKneeRange:
                this.angleRange(
                    "leftKnee",
                    milliseconds
                ),

            rightKneeRange:
                this.angleRange(
                    "rightKnee",
                    milliseconds
                ),

            wristSymmetry:
                this.jointSymmetry(
                    "leftWrist",
                    "rightWrist",
                    milliseconds
                ),

            ankleSymmetry:
                this.jointSymmetry(
                    "leftAnkle",
                    "rightAnkle",
                    milliseconds
                )

        };

    }

}