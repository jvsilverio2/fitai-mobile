// ==========================================================
// FITAI MOTION PLATFORM
// BODY NORMALIZER 2.0
//
// Responsabilidade:
// normalizar posições corporais de forma adaptativa.
//
// Objetivo:
// funcionar mesmo quando apenas parte do corpo
// estiver visível.
//
// Estratégia:
// 1. tenta usar quadris como centro principal
// 2. se não houver quadris confiáveis, usa ombros
// 3. se necessário, usa combinação dos pontos visíveis
//
// NÃO:
// - detecta landmarks
// - desenha
// - avalia exercício
// ==========================================================


function safeDivide(
    value,
    divisor
) {

    if (
        !Number.isFinite(value)
        ||
        !Number.isFinite(divisor)
        ||
        Math.abs(divisor) < 0.000001
    ) {

        return 0;

    }


    return value / divisor;
}


function distance2D(
    a,
    b
) {

    if (
        !a
        ||
        !b
    ) {

        return 0;

    }


    return Math.hypot(
        b.x - a.x,
        b.y - a.y
    );
}


function midpoint(
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


    return {

        x:
            (a.x + b.x) / 2,

        y:
            (a.y + b.y) / 2,

        z:
            ((a.z ?? 0) + (b.z ?? 0)) / 2

    };
}


function getJointConfidence(
    joint
) {

    if (!joint) {

        return 0;

    }


    return (
        joint.confidence
        ??
        joint.visibility
        ??
        0
    );
}


function isUsableJoint(
    joint,
    minimumConfidence
) {

    return (
        joint
        &&
        joint.position
        &&
        getJointConfidence(joint)
        >=
        minimumConfidence
    );
}


function averagePoint(
    joints,
    minimumConfidence
) {

    const usable =
        joints.filter(
            joint =>
                isUsableJoint(
                    joint,
                    minimumConfidence
                )
        );


    if (
        usable.length === 0
    ) {

        return null;

    }


    const total =
        usable.reduce(
            (
                acc,
                joint
            ) => {

                acc.x +=
                    joint.position.x;

                acc.y +=
                    joint.position.y;

                acc.z +=
                    joint.position.z
                    ??
                    0;


                return acc;

            },
            {
                x: 0,
                y: 0,
                z: 0
            }
        );


    return {

        x:
            total.x
            /
            usable.length,

        y:
            total.y
            /
            usable.length,

        z:
            total.z
            /
            usable.length

    };
}


// ==========================================================
// BODY NORMALIZER
// ==========================================================

export class BodyNormalizer {

    constructor(
        options = {}
    ) {

        this.minimumConfidence =
            options.minimumConfidence
            ??
            0.35;


        this.reference = {

            center: {

                x: 0,
                y: 0,
                z: 0

            },

            scale: 1,

            mode:
                "none",

            shoulderWidth: 0,

            hipWidth: 0,

            torsoLength: 0,

            legLength: 0

        };


        this.ready =
            false;

    }


    // ======================================================
    // UPDATE
    // ======================================================

    update(
        body
    ) {

        if (
            !body
            ||
            !body.joints
        ) {

            this.ready =
                false;


            return this.reference;

        }


        const joints =
            body.joints;


        const leftShoulder =
            joints.leftShoulder;

        const rightShoulder =
            joints.rightShoulder;

        const leftHip =
            joints.leftHip;

        const rightHip =
            joints.rightHip;

        const leftKnee =
            joints.leftKnee;

        const rightKnee =
            joints.rightKnee;

        const leftAnkle =
            joints.leftAnkle;

        const rightAnkle =
            joints.rightAnkle;


        const shoulderCenter =
            this.getPairCenter(
                leftShoulder,
                rightShoulder
            );


        const hipCenter =
            this.getPairCenter(
                leftHip,
                rightHip
            );


        const centerResult =
            this.chooseCenter(
                joints,
                hipCenter,
                shoulderCenter
            );


        if (
            !centerResult.center
        ) {

            this.ready =
                false;


            return this.reference;

        }


        const shoulderWidth =
            this.getPairDistance(
                leftShoulder,
                rightShoulder
            );


        const hipWidth =
            this.getPairDistance(
                leftHip,
                rightHip
            );


        const torsoLength =
            (
                shoulderCenter
                &&
                hipCenter
            )
                ?
                distance2D(
                    shoulderCenter,
                    hipCenter
                )
                :
                0;


        const leftLegLength =
            this.getLegLength(
                leftHip,
                leftKnee,
                leftAnkle
            );


        const rightLegLength =
            this.getLegLength(
                rightHip,
                rightKnee,
                rightAnkle
            );


        const validLegLengths =
            [
                leftLegLength,
                rightLegLength
            ]
            .filter(
                value =>
                    value > 0
            );


        const legLength =
            validLegLengths.length > 0
                ?
                validLegLengths.reduce(
                    (
                        total,
                        value
                    ) =>
                        total + value,
                    0
                )
                /
                validLegLengths.length
                :
                0;


        const scaleResult =
            this.chooseScale({

                shoulderWidth,

                hipWidth,

                torsoLength,

                legLength,

                joints

            });


        if (
            scaleResult.scale
            <=
            0.0001
        ) {

            this.ready =
                false;


            return this.reference;

        }


        this.reference = {

            center:
                centerResult.center,

            scale:
                scaleResult.scale,

            mode:
                centerResult.mode,

            shoulderWidth,

            hipWidth,

            torsoLength,

            legLength

        };


        this.ready =
            true;


        return this.reference;

    }


    // ======================================================
    // ESCOLHA DO CENTRO
    // ======================================================

    chooseCenter(
        joints,
        hipCenter,
        shoulderCenter
    ) {

        if (
            hipCenter
        ) {

            return {

                center:
                    hipCenter,

                mode:
                    "hips"

            };

        }


        if (
            shoulderCenter
        ) {

            return {

                center:
                    shoulderCenter,

                mode:
                    "shoulders"

            };

        }


        const fallback =
            averagePoint(
                Object.values(
                    joints
                ),
                this.minimumConfidence
            );


        if (
            fallback
        ) {

            return {

                center:
                    fallback,

                mode:
                    "visible-body"

            };

        }


        return {

            center:
                null,

            mode:
                "none"

        };

    }


    // ======================================================
    // ESCOLHA DE ESCALA
    // ======================================================

    chooseScale({

        shoulderWidth,

        hipWidth,

        torsoLength,

        legLength,

        joints

    }) {

        const candidates = [];


        if (
            shoulderWidth > 0
        ) {

            candidates.push(
                shoulderWidth
            );

        }


        if (
            hipWidth > 0
        ) {

            candidates.push(
                hipWidth
            );

        }


        if (
            torsoLength > 0
        ) {

            candidates.push(
                torsoLength
            );

        }


        if (
            legLength > 0
        ) {

            candidates.push(
                legLength * 0.5
            );

        }


        if (
            candidates.length > 0
        ) {

            return {

                scale:
                    Math.max(
                        ...candidates
                    ),

                mode:
                    "anatomical"

            };

        }


        const visiblePositions =
            Object.values(
                joints
            )
            .filter(
                joint =>
                    isUsableJoint(
                        joint,
                        this.minimumConfidence
                    )
            )
            .map(
                joint =>
                    joint.position
            );


        if (
            visiblePositions.length
            <
            2
        ) {

            return {

                scale: 0,

                mode:
                    "none"

            };

        }


        let maximumDistance =
            0;


        for (
            let i = 0;
            i < visiblePositions.length;
            i += 1
        ) {

            for (
                let j = i + 1;
                j < visiblePositions.length;
                j += 1
            ) {

                maximumDistance =
                    Math.max(

                        maximumDistance,

                        distance2D(
                            visiblePositions[i],
                            visiblePositions[j]
                        )

                    );

            }

        }


        return {

            scale:
                maximumDistance,

            mode:
                "visible-body"

        };

    }


    // ======================================================
    // CENTRO DE PAR
    // ======================================================

    getPairCenter(
        jointA,
        jointB
    ) {

        if (
            !isUsableJoint(
                jointA,
                this.minimumConfidence
            )
            ||
            !isUsableJoint(
                jointB,
                this.minimumConfidence
            )
        ) {

            return null;

        }


        return midpoint(
            jointA.position,
            jointB.position
        );

    }


    // ======================================================
    // DISTÂNCIA DE PAR
    // ======================================================

    getPairDistance(
        jointA,
        jointB
    ) {

        if (
            !isUsableJoint(
                jointA,
                this.minimumConfidence
            )
            ||
            !isUsableJoint(
                jointB,
                this.minimumConfidence
            )
        ) {

            return 0;

        }


        return distance2D(
            jointA.position,
            jointB.position
        );

    }


    // ======================================================
    // COMPRIMENTO DE PERNA
    // ======================================================

    getLegLength(
        hip,
        knee,
        ankle
    ) {

        if (
            !isUsableJoint(
                hip,
                this.minimumConfidence
            )
            ||
            !isUsableJoint(
                knee,
                this.minimumConfidence
            )
            ||
            !isUsableJoint(
                ankle,
                this.minimumConfidence
            )
        ) {

            return 0;

        }


        return (
            distance2D(
                hip.position,
                knee.position
            )
            +
            distance2D(
                knee.position,
                ankle.position
            )
        );

    }


    // ======================================================
    // NORMALIZAR UM PONTO
    // ======================================================

    normalizePoint(
        point
    ) {

        if (
            !point
            ||
            !this.ready
        ) {

            return {

                x: 0,
                y: 0,
                z: 0

            };

        }


        const center =
            this.reference.center;


        const scale =
            this.reference.scale;


        return {

            x:
                safeDivide(
                    point.x - center.x,
                    scale
                ),

            y:
                safeDivide(
                    point.y - center.y,
                    scale
                ),

            z:
                safeDivide(
                    (point.z ?? 0)
                    -
                    (center.z ?? 0),
                    scale
                )

        };

    }


    // ======================================================
    // NORMALIZAR DISTÂNCIA
    // ======================================================

    normalizeDistance(
        value
    ) {

        if (
            !this.ready
        ) {

            return 0;

        }


        return safeDivide(
            value,
            this.reference.scale
        );

    }


    // ======================================================
    // NORMALIZAR CORPO
    // ======================================================

    normalizeBody(
        body
    ) {

        if (
            !body
            ||
            !body.joints
        ) {

            return null;

        }


        this.update(
            body
        );


        if (
            !this.ready
        ) {

            return null;

        }


        const joints = {};


        for (
            const [
                name,
                joint
            ]
            of
            Object.entries(
                body.joints
            )
        ) {

            if (
                !joint
            ) {

                continue;

            }


            const normalized =
                this.normalizePoint(
                    joint.position
                );


            joints[name] = {

                x:
                    normalized.x,

                y:
                    normalized.y,

                z:
                    normalized.z,

                confidence:
                    getJointConfidence(
                        joint
                    )

            };

        }


        return {

            timestamp:
                body.timestamp,

            valid:
                true,

            center: {

                x: 0,
                y: 0,
                z: 0

            },

            mode:
                this.reference.mode,

            scale:
                this.reference.scale,

            proportions: {

                shoulderWidth:
                    this.normalizeDistance(
                        this.reference.shoulderWidth
                    ),

                hipWidth:
                    this.normalizeDistance(
                        this.reference.hipWidth
                    ),

                torsoLength:
                    this.normalizeDistance(
                        this.reference.torsoLength
                    ),

                legLength:
                    this.normalizeDistance(
                        this.reference.legLength
                    )

            },

            joints

        };

    }


    // ======================================================
    // API
    // ======================================================

    getReference() {

        return {

            ...this.reference,

            center: {

                ...this.reference.center

            }

        };

    }


    getMode() {

        return this.reference.mode;

    }


    reset() {

        this.reference = {

            center: {

                x: 0,
                y: 0,
                z: 0

            },

            scale: 1,

            mode:
                "none",

            shoulderWidth: 0,

            hipWidth: 0,

            torsoLength: 0,

            legLength: 0

        };


        this.ready =
            false;

    }

}


// ==========================================================
// INSTÂNCIA PRINCIPAL
// ==========================================================

export const fitaiBodyNormalizer =
    new BodyNormalizer();