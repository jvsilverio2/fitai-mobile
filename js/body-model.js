// ==========================================================
// FITAI — BODY MODEL 1.0
// Representacao corporal interna em tempo real
// ==========================================================


export const LANDMARK = {
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
};


const JOINT_NAMES =
    Object.keys(
        LANDMARK
    );


const CORE_JOINTS = [
    "leftShoulder",
    "rightShoulder",

    "leftHip",
    "rightHip",

    "leftKnee",
    "rightKnee",

    "leftAnkle",
    "rightAnkle"
];


const DEFAULT_OPTIONS = {

    minimumVisibility:
        0.45,

    velocitySmoothing:
        0.68,

    maxDeltaTime:
        0.12,

    historySize:
        30

};


// ==========================================================
// HELPERS
// ==========================================================


function clamp(
    value,
    minimum,
    maximum
) {

    return Math.max(
        minimum,
        Math.min(
            maximum,
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


function midpoint(
    a,
    b
) {

    if (
        !a
        ||
        !b
    ) {

        return {
            x: 0,
            y: 0,
            z: 0
        };

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
                (
                    a.z
                    ??
                    0
                )
                +
                (
                    b.z
                    ??
                    0
                )
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


    const abx =
        a.x
        -
        b.x;

    const aby =
        a.y
        -
        b.y;


    const cbx =
        c.x
        -
        b.x;

    const cby =
        c.y
        -
        b.y;


    const dot =
        (
            abx
            *
            cbx
        )
        +
        (
            aby
            *
            cby
        );


    const magnitudeAB =
        Math.hypot(
            abx,
            aby
        );


    const magnitudeCB =
        Math.hypot(
            cbx,
            cby
        );


    if (
        magnitudeAB
        <
        0.000001
        ||
        magnitudeCB
        <
        0.000001
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


function trunkInclination(
    shoulderCenter,
    hipCenter
) {

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


function createJoint(
    name,
    index
) {

    return {

        name,
        index,

        x:
            0,

        y:
            0,

        z:
            0,

        nx:
            0,

        ny:
            0,

        nz:
            0,

        wx:
            null,

        wy:
            null,

        wz:
            null,

        vx:
            0,

        vy:
            0,

        vz:
            0,

        speed:
            0,

        directionX:
            0,

        directionY:
            0,

        directionZ:
            0,

        visibility:
            0,

        reliable:
            false,

        lastSeen:
            0

    };

}


// ==========================================================
// BODY MODEL
// ==========================================================


export class BodyModel {

    constructor(
        options = {}
    ) {

        this.options = {

            ...DEFAULT_OPTIONS,
            ...options

        };


        this.joints = {};


        for (
            const name
            of
            JOINT_NAMES
        ) {

            this.joints[
                name
            ] =
                createJoint(
                    name,
                    LANDMARK[
                        name
                    ]
                );

        }


        this.head =
            this.joints.nose;


        this.leftArm = {

            shoulder:
                this.joints.leftShoulder,

            elbow:
                this.joints.leftElbow,

            wrist:
                this.joints.leftWrist,

            index:
                this.joints.leftIndex,

            pinky:
                this.joints.leftPinky,

            thumb:
                this.joints.leftThumb

        };


        this.rightArm = {

            shoulder:
                this.joints.rightShoulder,

            elbow:
                this.joints.rightElbow,

            wrist:
                this.joints.rightWrist,

            index:
                this.joints.rightIndex,

            pinky:
                this.joints.rightPinky,

            thumb:
                this.joints.rightThumb

        };


        this.leftLeg = {

            hip:
                this.joints.leftHip,

            knee:
                this.joints.leftKnee,

            ankle:
                this.joints.leftAnkle,

            heel:
                this.joints.leftHeel,

            foot:
                this.joints.leftFootIndex

        };


        this.rightLeg = {

            hip:
                this.joints.rightHip,

            knee:
                this.joints.rightKnee,

            ankle:
                this.joints.rightAnkle,

            heel:
                this.joints.rightHeel,

            foot:
                this.joints.rightFootIndex

        };


        this.center = {

            x: 0,
            y: 0,
            z: 0

        };


        this.shoulderCenter = {

            x: 0,
            y: 0,
            z: 0

        };


        this.hipCenter = {

            x: 0,
            y: 0,
            z: 0

        };


        this.scale =
            1;


        this.angles = {

            leftElbow:
                null,

            rightElbow:
                null,

            leftShoulder:
                null,

            rightShoulder:
                null,

            leftHip:
                null,

            rightHip:
                null,

            leftKnee:
                null,

            rightKnee:
                null,

            leftAnkle:
                null,

            rightAnkle:
                null,

            trunk:
                null

        };


        this.motion = {

            centerSpeed:
                0,

            leftHandSpeed:
                0,

            rightHandSpeed:
                0,

            leftFootSpeed:
                0,

            rightFootSpeed:
                0,

            averageSpeed:
                0

        };


        this.confidence =
            0;


        this.timestamp =
            0;


        this.deltaTime =
            0;


        this.frame =
            0;


        this.active =
            false;


        this.history =
            [];

    }


    update(
        landmarks,
        worldLandmarks = null,
        timestamp = performance.now()
    ) {

        if (
            !landmarks
            ||
            landmarks.length
            <
            33
        ) {

            this.active =
                false;

            return this;

        }


        const previousTimestamp =
            this.timestamp;


        this.timestamp =
            timestamp;


        if (
            previousTimestamp
            >
            0
        ) {

            this.deltaTime =
                clamp(
                    (
                        timestamp
                        -
                        previousTimestamp
                    )
                    /
                    1000,
                    0,
                    this.options.maxDeltaTime
                );

        } else {

            this.deltaTime =
                0;

        }


        const previousPositions =
            {};


        for (
            const name
            of
            JOINT_NAMES
        ) {

            const joint =
                this.joints[
                    name
                ];


            previousPositions[
                name
            ] = {

                x:
                    joint.x,

                y:
                    joint.y,

                z:
                    joint.z,

                vx:
                    joint.vx,

                vy:
                    joint.vy,

                vz:
                    joint.vz

            };

        }


        for (
            const name
            of
            JOINT_NAMES
        ) {

            const joint =
                this.joints[
                    name
                ];


            const landmark =
                landmarks[
                    joint.index
                ];


            const worldLandmark =
                worldLandmarks?.[
                    joint.index
                ]
                ??
                null;


            joint.x =
                landmark.x;


            joint.y =
                landmark.y;


            joint.z =
                landmark.z
                ??
                0;


            joint.visibility =
                landmark.visibility
                ??
                1;


            joint.reliable =
                joint.visibility
                >=
                this.options.minimumVisibility;


            if (
                joint.reliable
            ) {

                joint.lastSeen =
                    timestamp;

            }


            if (
                worldLandmark
            ) {

                joint.wx =
                    worldLandmark.x;


                joint.wy =
                    worldLandmark.y;


                joint.wz =
                    worldLandmark.z;

            } else {

                joint.wx =
                    null;


                joint.wy =
                    null;


                joint.wz =
                    null;

            }

        }


        this.shoulderCenter =
            midpoint(
                this.joints.leftShoulder,
                this.joints.rightShoulder
            );


        this.hipCenter =
            midpoint(
                this.joints.leftHip,
                this.joints.rightHip
            );


        this.center = {

            x:
                (
                    this.shoulderCenter.x
                    +
                    this.hipCenter.x
                )
                /
                2,

            y:
                (
                    this.shoulderCenter.y
                    +
                    this.hipCenter.y
                )
                /
                2,

            z:
                (
                    this.shoulderCenter.z
                    +
                    this.hipCenter.z
                )
                /
                2

        };


        const shoulderWidth =
            distance2D(
                this.joints.leftShoulder,
                this.joints.rightShoulder
            );


        const torsoLength =
            distance2D(
                this.shoulderCenter,
                this.hipCenter
            );


        this.scale =
            Math.max(
                shoulderWidth,
                torsoLength,
                0.0001
            );


        for (
            const name
            of
            JOINT_NAMES
        ) {

            const joint =
                this.joints[
                    name
                ];


            joint.nx =
                (
                    joint.x
                    -
                    this.hipCenter.x
                )
                /
                this.scale;


            joint.ny =
                (
                    joint.y
                    -
                    this.hipCenter.y
                )
                /
                this.scale;


            joint.nz =
                (
                    joint.z
                    -
                    this.hipCenter.z
                )
                /
                this.scale;


            if (
                this.deltaTime
                >
                0
                &&
                previousTimestamp
                >
                0
            ) {

                const previous =
                    previousPositions[
                        name
                    ];


                const rawVx =
                    (
                        joint.x
                        -
                        previous.x
                    )
                    /
                    this.deltaTime;


                const rawVy =
                    (
                        joint.y
                        -
                        previous.y
                    )
                    /
                    this.deltaTime;


                const rawVz =
                    (
                        joint.z
                        -
                        previous.z
                    )
                    /
                    this.deltaTime;


                const smoothing =
                    this.options
                        .velocitySmoothing;


                joint.vx =
                    (
                        previous.vx
                        *
                        smoothing
                    )
                    +
                    (
                        rawVx
                        *
                        (
                            1
                            -
                            smoothing
                        )
                    );


                joint.vy =
                    (
                        previous.vy
                        *
                        smoothing
                    )
                    +
                    (
                        rawVy
                        *
                        (
                            1
                            -
                            smoothing
                        )
                    );


                joint.vz =
                    (
                        previous.vz
                        *
                        smoothing
                    )
                    +
                    (
                        rawVz
                        *
                        (
                            1
                            -
                            smoothing
                        )
                    );


                joint.speed =
                    Math.hypot(
                        joint.vx,
                        joint.vy,
                        joint.vz
                    );


                if (
                    joint.speed
                    >
                    0.00001
                ) {

                    joint.directionX =
                        joint.vx
                        /
                        joint.speed;


                    joint.directionY =
                        joint.vy
                        /
                        joint.speed;


                    joint.directionZ =
                        joint.vz
                        /
                        joint.speed;

                } else {

                    joint.directionX =
                        0;


                    joint.directionY =
                        0;


                    joint.directionZ =
                        0;

                }

            }

        }


        this.updateAngles();


        this.updateMotion();


        this.updateConfidence();


        this.updateHistory();


        this.frame +=
            1;


        this.active =
            true;


        return this;

    }


    updateAngles() {

        const j =
            this.joints;


        this.angles.leftElbow =
            angle2D(
                j.leftShoulder,
                j.leftElbow,
                j.leftWrist
            );


        this.angles.rightElbow =
            angle2D(
                j.rightShoulder,
                j.rightElbow,
                j.rightWrist
            );


        this.angles.leftShoulder =
            angle2D(
                j.leftElbow,
                j.leftShoulder,
                j.leftHip
            );


        this.angles.rightShoulder =
            angle2D(
                j.rightElbow,
                j.rightShoulder,
                j.rightHip
            );


        this.angles.leftHip =
            angle2D(
                j.leftShoulder,
                j.leftHip,
                j.leftKnee
            );


        this.angles.rightHip =
            angle2D(
                j.rightShoulder,
                j.rightHip,
                j.rightKnee
            );


        this.angles.leftKnee =
            angle2D(
                j.leftHip,
                j.leftKnee,
                j.leftAnkle
            );


        this.angles.rightKnee =
            angle2D(
                j.rightHip,
                j.rightKnee,
                j.rightAnkle
            );


        this.angles.leftAnkle =
            angle2D(
                j.leftKnee,
                j.leftAnkle,
                j.leftFootIndex
            );


        this.angles.rightAnkle =
            angle2D(
                j.rightKnee,
                j.rightAnkle,
                j.rightFootIndex
            );


        this.angles.trunk =
            trunkInclination(
                this.shoulderCenter,
                this.hipCenter
            );

    }


    updateMotion() {

        const j =
            this.joints;


        this.motion.leftHandSpeed =
            j.leftWrist.speed;


        this.motion.rightHandSpeed =
            j.rightWrist.speed;


        this.motion.leftFootSpeed =
            j.leftAnkle.speed;


        this.motion.rightFootSpeed =
            j.rightAnkle.speed;


        this.motion.centerSpeed =
            (
                j.leftHip.speed
                +
                j.rightHip.speed
                +
                j.leftShoulder.speed
                +
                j.rightShoulder.speed
            )
            /
            4;


        let total =
            0;


        let count =
            0;


        for (
            const name
            of
            CORE_JOINTS
        ) {

            const joint =
                j[
                    name
                ];


            if (
                joint.reliable
            ) {

                total +=
                    joint.speed;


                count +=
                    1;

            }

        }


        this.motion.averageSpeed =
            count
            >
            0
                ?
                total
                /
                count
                :
                0;

    }


    updateConfidence() {

        let total =
            0;


        let count =
            0;


        for (
            const name
            of
            CORE_JOINTS
        ) {

            const joint =
                this.joints[
                    name
                ];


            total +=
                joint.visibility;


            count +=
                1;

        }


        this.confidence =
            count
            >
            0
                ?
                total
                /
                count
                :
                0;

    }


    updateHistory() {

        const frame = {

            timestamp:
                this.timestamp,

            center: {
                x:
                    this.center.x,

                y:
                    this.center.y,

                z:
                    this.center.z
            },

            leftWrist: {
                x:
                    this.joints
                        .leftWrist
                        .nx,

                y:
                    this.joints
                        .leftWrist
                        .ny,

                z:
                    this.joints
                        .leftWrist
                        .nz
            },

            rightWrist: {
                x:
                    this.joints
                        .rightWrist
                        .nx,

                y:
                    this.joints
                        .rightWrist
                        .ny,

                z:
                    this.joints
                        .rightWrist
                        .nz
            },

            leftAnkle: {
                x:
                    this.joints
                        .leftAnkle
                        .nx,

                y:
                    this.joints
                        .leftAnkle
                        .ny,

                z:
                    this.joints
                        .leftAnkle
                        .nz
            },

            rightAnkle: {
                x:
                    this.joints
                        .rightAnkle
                        .nx,

                y:
                    this.joints
                        .rightAnkle
                        .ny,

                z:
                    this.joints
                        .rightAnkle
                        .nz
            },

            angles: {
                leftElbow:
                    this.angles
                        .leftElbow,

                rightElbow:
                    this.angles
                        .rightElbow,

                leftKnee:
                    this.angles
                        .leftKnee,

                rightKnee:
                    this.angles
                        .rightKnee,

                trunk:
                    this.angles
                        .trunk
            }

        };


        this.history.push(
            frame
        );


        while (
            this.history.length
            >
            this.options.historySize
        ) {

            this.history.shift();

        }

    }


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


    getHistory() {

        return this.history;

    }


    reset() {

        this.timestamp =
            0;


        this.deltaTime =
            0;


        this.frame =
            0;


        this.active =
            false;


        this.confidence =
            0;


        this.history.length =
            0;


        for (
            const name
            of
            JOINT_NAMES
        ) {

            const joint =
                this.joints[
                    name
                ];


            joint.vx =
                0;


            joint.vy =
                0;


            joint.vz =
                0;


            joint.speed =
                0;


            joint.directionX =
                0;


            joint.directionY =
                0;


            joint.directionZ =
                0;

        }

    }

}


// Instancia unica usada pelo FitAI.
export const fitaiBody =
    new BodyModel();