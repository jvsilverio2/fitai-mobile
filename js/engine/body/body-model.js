// ==========================================================
// FITAI MOTION PLATFORM
// BODY MODEL 2.0
//
// Responsabilidade:
// transformar landmarks brutos do detector de pose
// em uma representação corporal semântica.
//
// NÃO:
// - desenha esqueleto
// - conta repetições
// - avalia exercício
// - fornece feedback
// ==========================================================


// ==========================================================
// LANDMARKS DO MEDIAPIPE POSE
// ==========================================================

export const LANDMARK = Object.freeze({

    nose: 0,

    leftEyeInner: 1,
    leftEye: 2,
    leftEyeOuter: 3,

    rightEyeInner: 4,
    rightEye: 5,
    rightEyeOuter: 6,

    leftEar: 7,
    rightEar: 8,

    mouthLeft: 9,
    mouthRight: 10,

    leftShoulder: 11,
    rightShoulder: 12,

    leftElbow: 13,
    rightElbow: 14,

    leftWrist: 15,
    rightWrist: 16,

    leftPinky: 17,
    rightPinky: 18,

    leftIndex: 19,
    rightIndex: 20,

    leftThumb: 21,
    rightThumb: 22,

    leftHip: 23,
    rightHip: 24,

    leftKnee: 25,
    rightKnee: 26,

    leftAnkle: 27,
    rightAnkle: 28,

    leftHeel: 29,
    rightHeel: 30,

    leftFootIndex: 31,
    rightFootIndex: 32

});


// ==========================================================
// FUNÇÕES MATEMÁTICAS
// ==========================================================

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

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


function distance3D(
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

        b.y - a.y,

        (b.z ?? 0)
        -
        (a.z ?? 0)

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
            (
                a.x
                +
                b.x
            )
            /
            2,

        y:
            (
                a.y
                +
                b.y
            )
            /
            2,

        z:
            (
                (a.z ?? 0)
                +
                (b.z ?? 0)
            )
            /
            2

    };

}


function angle2D(
    a,
    b,
    c
) {

    if (
        !a
        ||
        !b
        ||
        !c
    ) {

        return null;

    }


    const ab = {

        x:
            a.x
            -
            b.x,

        y:
            a.y
            -
            b.y

    };


    const cb = {

        x:
            c.x
            -
            b.x,

        y:
            c.y
            -
            b.y

    };


    const dot =
        (
            ab.x
            *
            cb.x
        )
        +
        (
            ab.y
            *
            cb.y
        );


    const magnitudeAB =
        Math.hypot(
            ab.x,
            ab.y
        );


    const magnitudeCB =
        Math.hypot(
            cb.x,
            cb.y
        );


    if (
        magnitudeAB === 0
        ||
        magnitudeCB === 0
    ) {

        return null;

    }


    const cosine =
        clamp(
            dot
            /
            (
                magnitudeAB
                *
                magnitudeCB
            ),
            -1,
            1
        );


    return (
        Math.acos(
            cosine
        )
        *
        180
        /
        Math.PI
    );

}


function vectorAngle(
    vector
) {

    if (
        !vector
    ) {

        return 0;

    }


    return Math.atan2(
        vector.y,
        vector.x
    );

}


// ==========================================================
// JOINT
// ==========================================================

function createJoint(
    name,
    landmark,
    worldLandmark = null
) {

    if (
        !landmark
    ) {

        return null;

    }


    return {

        name,

        position: {

            x:
                landmark.x
                ??
                0,

            y:
                landmark.y
                ??
                0,

            z:
                landmark.z
                ??
                0

        },


        worldPosition:
            worldLandmark
                ?
                {

                    x:
                        worldLandmark.x
                        ??
                        0,

                    y:
                        worldLandmark.y
                        ??
                        0,

                    z:
                        worldLandmark.z
                        ??
                        0

                }
                :
                null,


        normalizedPosition: {

            x: 0,
            y: 0,
            z: 0

        },


        visibility:
            landmark.visibility
            ??
            landmark.presence
            ??
            1,


        confidence: 0,


        velocity: {

            x: 0,
            y: 0,
            z: 0,

            speed: 0,

            direction: 0

        },


        acceleration: {

            x: 0,
            y: 0,
            z: 0,

            magnitude: 0

        }

    };

}


// ==========================================================
// BODY MODEL
// ==========================================================

export class BodyModel {

    constructor() {

        this.timestamp = 0;

        this.deltaTime = 0;


        this.joints = {};


        this.center = {

            position: {

                x: 0,
                y: 0,
                z: 0

            },

            velocity: {

                x: 0,
                y: 0,
                z: 0,

                speed: 0,

                direction: 0

            }

        };


        this.scale = 1;


        this.angles = {

            leftElbow: null,
            rightElbow: null,

            leftShoulder: null,
            rightShoulder: null,

            leftHip: null,
            rightHip: null,

            leftKnee: null,
            rightKnee: null,

            leftAnkle: null,
            rightAnkle: null,

            torsoInclination: null

        };


        this.segments = {};


        this.confidence = {

            overall: 0,

            upperBody: 0,

            lowerBody: 0,

            leftSide: 0,

            rightSide: 0

        };


        this.previousJoints = {};

        this.previousVelocity = {};


        this.valid = false;

    }


    // ======================================================
    // UPDATE PRINCIPAL
    // ======================================================

    update(
        landmarks,
        worldLandmarks = null,
        timestamp = performance.now()
    ) {

        if (
            !landmarks
            ||
            landmarks.length < 33
        ) {

            this.valid = false;

            return this;

        }


        this.updateTime(
            timestamp
        );


        this.previousJoints =
            this.cloneJointPositions(
                this.joints
            );


        this.previousVelocity =
            this.cloneJointVelocities(
                this.joints
            );


        this.buildJoints(
            landmarks,
            worldLandmarks
        );


        this.calculateBodyCenter();

        this.calculateBodyScale();

        this.normalizeBody();

        this.calculateSegments();

        this.calculateAngles();

        this.calculateVelocities();

        this.calculateAccelerations();

        this.calculateConfidence();


        this.valid =
            this.confidence.overall
            >
            0.35;


        return this;

    }


    // ======================================================
    // TEMPO
    // ======================================================

    updateTime(
        timestamp
    ) {

        if (
            this.timestamp === 0
        ) {

            this.deltaTime = 0;

        }

        else {

            this.deltaTime =
                Math.min(
                    (
                        timestamp
                        -
                        this.timestamp
                    )
                    /
                    1000,
                    0.15
                );

        }


        this.timestamp =
            timestamp;

    }


    // ======================================================
    // CONSTRUÇÃO DO CORPO
    // ======================================================

    buildJoints(
        landmarks,
        worldLandmarks
    ) {

        const joints = {};


        for (
            const [
                name,
                index
            ]
            of
            Object.entries(
                LANDMARK
            )
        ) {

            joints[name] =
                createJoint(

                    name,

                    landmarks[index],

                    worldLandmarks
                        ?
                        worldLandmarks[index]
                        :
                        null

                );

        }


        this.joints =
            joints;

    }


    // ======================================================
    // CENTRO CORPORAL
    // ======================================================

    calculateBodyCenter() {

        const leftHip =
            this.joints.leftHip?.position;

        const rightHip =
            this.joints.rightHip?.position;


        const hipCenter =
            midpoint(
                leftHip,
                rightHip
            );


        if (
            !hipCenter
        ) {

            return;

        }


        const previousCenter =
            this.center.position;


        this.center.position =
            hipCenter;


        if (
            this.deltaTime
            >
            0
        ) {

            const vx =
                (
                    hipCenter.x
                    -
                    previousCenter.x
                )
                /
                this.deltaTime;


            const vy =
                (
                    hipCenter.y
                    -
                    previousCenter.y
                )
                /
                this.deltaTime;


            const vz =
                (
                    hipCenter.z
                    -
                    previousCenter.z
                )
                /
                this.deltaTime;


            this.center.velocity = {

                x:
                    vx,

                y:
                    vy,

                z:
                    vz,

                speed:
                    Math.hypot(
                        vx,
                        vy,
                        vz
                    ),

                direction:
                    vectorAngle({
                        x: vx,
                        y: vy
                    })

            };

        }

    }


    // ======================================================
    // ESCALA CORPORAL
    // ======================================================

    calculateBodyScale() {

        const leftShoulder =
            this.joints.leftShoulder
                ?.position;

        const rightShoulder =
            this.joints.rightShoulder
                ?.position;

        const leftHip =
            this.joints.leftHip
                ?.position;

        const rightHip =
            this.joints.rightHip
                ?.position;


        const shoulderCenter =
            midpoint(
                leftShoulder,
                rightShoulder
            );


        const hipCenter =
            midpoint(
                leftHip,
                rightHip
            );


        const torsoLength =
            distance2D(
                shoulderCenter,
                hipCenter
            );


        const shoulderWidth =
            distance2D(
                leftShoulder,
                rightShoulder
            );


        const scale =
            Math.max(
                torsoLength,
                shoulderWidth
            );


        this.scale =
            scale > 0.0001
                ?
                scale
                :
                1;

    }


    // ======================================================
    // NORMALIZAÇÃO
    // ======================================================

    normalizeBody() {

        const center =
            this.center.position;


        for (
            const joint
            of
            Object.values(
                this.joints
            )
        ) {

            if (
                !joint
            ) {

                continue;

            }


            joint.normalizedPosition = {

                x:
                    (
                        joint.position.x
                        -
                        center.x
                    )
                    /
                    this.scale,

                y:
                    (
                        joint.position.y
                        -
                        center.y
                    )
                    /
                    this.scale,

                z:
                    (
                        joint.position.z
                        -
                        center.z
                    )
                    /
                    this.scale

            };

        }

    }


    // ======================================================
    // SEGMENTOS CORPORAIS
    // ======================================================

    calculateSegments() {

        const j =
            this.joints;


        this.segments = {

            leftUpperArm:
                this.createSegment(
                    j.leftShoulder,
                    j.leftElbow
                ),

            leftForearm:
                this.createSegment(
                    j.leftElbow,
                    j.leftWrist
                ),

            rightUpperArm:
                this.createSegment(
                    j.rightShoulder,
                    j.rightElbow
                ),

            rightForearm:
                this.createSegment(
                    j.rightElbow,
                    j.rightWrist
                ),


            leftThigh:
                this.createSegment(
                    j.leftHip,
                    j.leftKnee
                ),

            leftShin:
                this.createSegment(
                    j.leftKnee,
                    j.leftAnkle
                ),

            rightThigh:
                this.createSegment(
                    j.rightHip,
                    j.rightKnee
                ),

            rightShin:
                this.createSegment(
                    j.rightKnee,
                    j.rightAnkle
                ),


            shoulders:
                this.createSegment(
                    j.leftShoulder,
                    j.rightShoulder
                ),

            hips:
                this.createSegment(
                    j.leftHip,
                    j.rightHip
                )

        };

    }


    createSegment(
        jointA,
        jointB
    ) {

        if (
            !jointA
            ||
            !jointB
        ) {

            return null;

        }


        const a =
            jointA.position;

        const b =
            jointB.position;


        return {

            start:
                jointA.name,

            end:
                jointB.name,

            length2D:
                distance2D(
                    a,
                    b
                ),

            length3D:
                distance3D(
                    a,
                    b
                ),

            normalizedLength:
                distance2D(
                    jointA.normalizedPosition,
                    jointB.normalizedPosition
                ),

            vector: {

                x:
                    b.x
                    -
                    a.x,

                y:
                    b.y
                    -
                    a.y,

                z:
                    b.z
                    -
                    a.z

            }

        };

    }


    // ======================================================
    // ÂNGULOS
    // ======================================================

    calculateAngles() {

        const j =
            this.joints;


        this.angles.leftElbow =
            angle2D(
                j.leftShoulder?.position,
                j.leftElbow?.position,
                j.leftWrist?.position
            );


        this.angles.rightElbow =
            angle2D(
                j.rightShoulder?.position,
                j.rightElbow?.position,
                j.rightWrist?.position
            );


        this.angles.leftShoulder =
            angle2D(
                j.leftElbow?.position,
                j.leftShoulder?.position,
                j.leftHip?.position
            );


        this.angles.rightShoulder =
            angle2D(
                j.rightElbow?.position,
                j.rightShoulder?.position,
                j.rightHip?.position
            );


        this.angles.leftHip =
            angle2D(
                j.leftShoulder?.position,
                j.leftHip?.position,
                j.leftKnee?.position
            );


        this.angles.rightHip =
            angle2D(
                j.rightShoulder?.position,
                j.rightHip?.position,
                j.rightKnee?.position
            );


        this.angles.leftKnee =
            angle2D(
                j.leftHip?.position,
                j.leftKnee?.position,
                j.leftAnkle?.position
            );


        this.angles.rightKnee =
            angle2D(
                j.rightHip?.position,
                j.rightKnee?.position,
                j.rightAnkle?.position
            );


        this.angles.leftAnkle =
            angle2D(
                j.leftKnee?.position,
                j.leftAnkle?.position,
                j.leftFootIndex?.position
            );


        this.angles.rightAnkle =
            angle2D(
                j.rightKnee?.position,
                j.rightAnkle?.position,
                j.rightFootIndex?.position
            );


        this.angles.torsoInclination =
            this.calculateTorsoInclination();

    }


    calculateTorsoInclination() {

        const shoulderCenter =
            midpoint(
                this.joints.leftShoulder
                    ?.position,
                this.joints.rightShoulder
                    ?.position
            );


        const hipCenter =
            midpoint(
                this.joints.leftHip
                    ?.position,
                this.joints.rightHip
                    ?.position
            );


        if (
            !shoulderCenter
            ||
            !hipCenter
        ) {

            return null;

        }


        const dx =
            shoulderCenter.x
            -
            hipCenter.x;


        const dy =
            shoulderCenter.y
            -
            hipCenter.y;


        return (
            Math.atan2(
                Math.abs(
                    dx
                ),
                Math.abs(
                    dy
                )
            )
            *
            180
            /
            Math.PI
        );

    }


    // ======================================================
    // VELOCIDADE
    // ======================================================

    calculateVelocities() {

        if (
            this.deltaTime
            <=
            0
        ) {

            return;

        }


        for (
            const [
                name,
                joint
            ]
            of
            Object.entries(
                this.joints
            )
        ) {

            const previous =
                this.previousJoints[
                    name
                ];


            if (
                !joint
                ||
                !previous
            ) {

                continue;

            }


            const vx =
                (
                    joint.position.x
                    -
                    previous.x
                )
                /
                this.deltaTime;


            const vy =
                (
                    joint.position.y
                    -
                    previous.y
                )
                /
                this.deltaTime;


            const vz =
                (
                    joint.position.z
                    -
                    previous.z
                )
                /
                this.deltaTime;


            joint.velocity = {

                x:
                    vx,

                y:
                    vy,

                z:
                    vz,

                speed:
                    Math.hypot(
                        vx,
                        vy,
                        vz
                    ),

                direction:
                    vectorAngle({
                        x: vx,
                        y: vy
                    })

            };

        }

    }


    // ======================================================
    // ACELERAÇÃO
    // ======================================================

    calculateAccelerations() {

        if (
            this.deltaTime
            <=
            0
        ) {

            return;

        }


        for (
            const [
                name,
                joint
            ]
            of
            Object.entries(
                this.joints
            )
        ) {

            const previous =
                this.previousVelocity[
                    name
                ];


            if (
                !joint
                ||
                !previous
            ) {

                continue;

            }


            const ax =
                (
                    joint.velocity.x
                    -
                    previous.x
                )
                /
                this.deltaTime;


            const ay =
                (
                    joint.velocity.y
                    -
                    previous.y
                )
                /
                this.deltaTime;


            const az =
                (
                    joint.velocity.z
                    -
                    previous.z
                )
                /
                this.deltaTime;


            joint.acceleration = {

                x:
                    ax,

                y:
                    ay,

                z:
                    az,

                magnitude:
                    Math.hypot(
                        ax,
                        ay,
                        az
                    )

            };

        }

    }


    // ======================================================
    // CONFIANÇA
    // ======================================================

    calculateConfidence() {

        const confidenceOf =
            (
                names
            ) => {

                const values =
                    names
                        .map(
                            name =>
                                this.joints[
                                    name
                                ]
                                ?.visibility
                                ??
                                0
                        );


                if (
                    values.length === 0
                ) {

                    return 0;

                }


                return (
                    values.reduce(
                        (
                            total,
                            value
                        ) =>
                            total
                            +
                            value,
                        0
                    )
                    /
                    values.length
                );

            };


        const upperBody = [

            "leftShoulder",
            "rightShoulder",

            "leftElbow",
            "rightElbow",

            "leftWrist",
            "rightWrist"

        ];


        const lowerBody = [

            "leftHip",
            "rightHip",

            "leftKnee",
            "rightKnee",

            "leftAnkle",
            "rightAnkle"

        ];


        const leftSide = [

            "leftShoulder",
            "leftElbow",
            "leftWrist",

            "leftHip",
            "leftKnee",
            "leftAnkle"

        ];


        const rightSide = [

            "rightShoulder",
            "rightElbow",
            "rightWrist",

            "rightHip",
            "rightKnee",
            "rightAnkle"

        ];


        this.confidence.upperBody =
            confidenceOf(
                upperBody
            );


        this.confidence.lowerBody =
            confidenceOf(
                lowerBody
            );


        this.confidence.leftSide =
            confidenceOf(
                leftSide
            );


        this.confidence.rightSide =
            confidenceOf(
                rightSide
            );


        this.confidence.overall =
            (
                this.confidence.upperBody
                +
                this.confidence.lowerBody
            )
            /
            2;


        for (
            const joint
            of
            Object.values(
                this.joints
            )
        ) {

            if (
                joint
            ) {

                joint.confidence =
                    joint.visibility;

            }

        }

    }


    // ======================================================
    // CÓPIAS DO FRAME ANTERIOR
    // ======================================================

    cloneJointPositions(
        joints
    ) {

        const result = {};


        for (
            const [
                name,
                joint
            ]
            of
            Object.entries(
                joints
                ??
                {}
            )
        ) {

            if (
                !joint
            ) {

                continue;

            }


            result[name] = {

                x:
                    joint.position.x,

                y:
                    joint.position.y,

                z:
                    joint.position.z

            };

        }


        return result;

    }


    cloneJointVelocities(
        joints
    ) {

        const result = {};


        for (
            const [
                name,
                joint
            ]
            of
            Object.entries(
                joints
                ??
                {}
            )
        ) {

            if (
                !joint
            ) {

                continue;

            }


            result[name] = {

                x:
                    joint.velocity.x,

                y:
                    joint.velocity.y,

                z:
                    joint.velocity.z

            };

        }


        return result;

    }


    // ======================================================
    // API PÚBLICA
    // ======================================================

    getJoint(
        name
    ) {

        return (
            this.joints[
                name
            ]
            ??
            null
        );

    }


    getAngle(
        name
    ) {

        return (
            this.angles[
                name
            ]
            ??
            null
        );

    }


    getSegment(
        name
    ) {

        return (
            this.segments[
                name
            ]
            ??
            null
        );

    }


    getSnapshot() {

        return {

            timestamp:
                this.timestamp,

            valid:
                this.valid,

            scale:
                this.scale,

            center:
                this.center,

            joints:
                this.joints,

            segments:
                this.segments,

            angles:
                this.angles,

            confidence:
                this.confidence

        };

    }


    reset() {

        this.timestamp = 0;

        this.deltaTime = 0;

        this.joints = {};

        this.previousJoints = {};

        this.previousVelocity = {};

        this.valid = false;

    }

}


// ==========================================================
// INSTÂNCIA PRINCIPAL DO FITAI
// ==========================================================

export const fitaiBody =
    new BodyModel();