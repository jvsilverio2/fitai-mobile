// ==========================================================
// FITAI MOTION PLATFORM
// MOTION ENGINE 1.0
//
// Responsabilidade:
// interpretar movimento corporal ao longo do tempo.
//
// Recebe:
// - Body Model
// - Motion History
//
// Entrega:
// - movimento por articulação
// - velocidade
// - direção
// - deslocamento
// - intensidade corporal
// - estado geral de movimento
//
// NÃO:
// - avalia exercício
// - conta repetições
// - desenha
// - fornece feedback
// ==========================================================


import {
    fitaiMotionHistory
}
from "./motion-history.js";


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


function magnitude2D(
    x,
    y
) {

    return Math.hypot(
        x ?? 0,
        y ?? 0
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

        return 0;

    }


    return (
        valid.reduce(
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
        valid.length
    );

}


// ==========================================================
// DIREÇÃO HUMANA
// ==========================================================

function getDirectionLabel(
    x,
    y,
    threshold = 0.02
) {

    const absX =
        Math.abs(
            x
        );


    const absY =
        Math.abs(
            y
        );


    if (
        absX < threshold
        &&
        absY < threshold
    ) {

        return "still";

    }


    if (
        absX
        >
        absY
        *
        1.35
    ) {

        return (
            x > 0
                ?
                "right"
                :
                "left"
        );

    }


    if (
        absY
        >
        absX
        *
        1.35
    ) {

        return (
            y > 0
                ?
                "down"
                :
                "up"
        );

    }


    if (
        x > 0
        &&
        y < 0
    ) {

        return "up-right";

    }


    if (
        x < 0
        &&
        y < 0
    ) {

        return "up-left";

    }


    if (
        x > 0
        &&
        y > 0
    ) {

        return "down-right";

    }


    return "down-left";

}


// ==========================================================
// MOTION ENGINE
// ==========================================================

export class MotionEngine {

    constructor(
        options = {}
    ) {

        this.history =
            options.history
            ??
            fitaiMotionHistory;


        this.windowMs =
            options.windowMs
            ??
            450;


        this.stillThreshold =
            options.stillThreshold
            ??
            0.03;


        this.activeThreshold =
            options.activeThreshold
            ??
            0.10;


        this.fastThreshold =
            options.fastThreshold
            ??
            0.30;


        this.state = {

            timestamp: 0,

            valid: false,

            bodyState: "still",

            intensity: 0,

            center: null,

            joints: {},

            dominantJoint: null,

            dominantSpeed: 0

        };

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

    this.state =
        this.emptyState();

    return this.state;

}

const usableJointCount =
    Object.values(
        body.joints
    ).filter(
        joint =>
            joint
            &&
            joint.position
            &&
            (
                joint.confidence
                ??
                joint.visibility
                ??
                0
            )
            >=
            0.35
    ).length;


if (
    usableJointCount
    <
    3
) {

    this.state =
        this.emptyState();

    return this.state;

}


        this.history.push(
            body
        );


        const joints = {};


        let dominantJoint =
            null;


        let dominantSpeed =
            0;


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


            const motion =
                this.analyzeJoint(
                    name,
                    joint
                );


            joints[name] =
                motion;


            if (
                motion.speed
                >
                dominantSpeed
            ) {

                dominantSpeed =
                    motion.speed;


                dominantJoint =
                    name;

            }

        }


        const center =
            this.analyzeCenter(
                body
            );


        const intensity =
            this.calculateBodyIntensity(
                joints
            );


        const bodyState =
            this.classifyBodyState(
                intensity
            );


        this.state = {

            timestamp:
                body.timestamp,

            valid: true,

            bodyState,

            intensity,

            center,

            joints,

            dominantJoint,

            dominantSpeed

        };


        return this.state;

    }


    // ======================================================
    // ARTICULAÇÃO
    // ======================================================

    analyzeJoint(
        name,
        joint
    ) {

        const displacement =
            this.history
                .getJointDisplacement(
                    name,
                    this.windowMs
                );


        const history =
            this.history
                .getJointHistory(
                    name,
                    this.windowMs
                );


        const speed =
            this.calculateAverageJointSpeed(
                history
            );


        const direction =
            getDirectionLabel(
                displacement.x,
                displacement.y,
                this.stillThreshold
            );


        return {

            name,

            speed,

            instantSpeed:
                joint.velocity
                    ?.speed
                ??
                0,

            displacement: {

                x:
                    displacement.x,

                y:
                    displacement.y,

                z:
                    displacement.z,

                distance:
                    displacement.distance

            },

            direction,

            moving:
                displacement.distance
                >=
                this.stillThreshold,

            fast:
                speed
                >=
                this.fastThreshold,

            confidence:
                joint.confidence
                ??
                joint.visibility
                ??
                0

        };

    }


    // ======================================================
    // VELOCIDADE MÉDIA
    // ======================================================

    calculateAverageJointSpeed(
        history
    ) {

        if (
            !history
            ||
            history.length === 0
        ) {

            return 0;

        }


        const speeds =
            history.map(
                item =>
                    item.velocity
                        ?.speed
                    ??
                    0
            );


        return average(
            speeds
        );

    }


    // ======================================================
    // CENTRO CORPORAL
    // ======================================================

    analyzeCenter(
        body
    ) {

        const current =
            body.center
                ?.position;


        const velocity =
            body.center
                ?.velocity;


        if (
            !current
        ) {

            return null;

        }


        return {

            position: {

                x:
                    current.x,

                y:
                    current.y,

                z:
                    current.z

            },

            velocity: {

                x:
                    velocity
                        ?.x
                    ??
                    0,

                y:
                    velocity
                        ?.y
                    ??
                    0,

                z:
                    velocity
                        ?.z
                    ??
                    0,

                speed:
                    velocity
                        ?.speed
                    ??
                    0

            },

            direction:
                getDirectionLabel(

                    velocity
                        ?.x
                    ??
                    0,

                    velocity
                        ?.y
                    ??
                    0,

                    0.01

                )

        };

    }


    // ======================================================
    // INTENSIDADE DO CORPO
    // ======================================================

    calculateBodyIntensity(
        joints
    ) {

        const important = [

            "leftWrist",
            "rightWrist",

            "leftElbow",
            "rightElbow",

            "leftShoulder",
            "rightShoulder",

            "leftHip",
            "rightHip",

            "leftKnee",
            "rightKnee",

            "leftAnkle",
            "rightAnkle"

        ];


        const values =
            important
                .map(
                    name =>
                        joints[
                            name
                        ]
                            ?.speed
                        ??
                        0
                );


        const mean =
            average(
                values
            );


        return clamp(
            mean
            /
            this.fastThreshold
        );

    }


    // ======================================================
    // ESTADO GERAL
    // ======================================================

    classifyBodyState(
        intensity
    ) {

        if (
            intensity
            <
            0.12
        ) {

            return "still";

        }


        if (
            intensity
            <
            0.35
        ) {

            return "light";

        }


        if (
            intensity
            <
            0.70
        ) {

            return "active";

        }


        return "fast";

    }


    // ======================================================
    // CONSULTAS
    // ======================================================

    getJoint(
        name
    ) {

        return (
            this.state.joints[
                name
            ]
            ??
            null
        );

    }


    isJointMoving(
        name
    ) {

        return (
            this.getJoint(
                name
            )
                ?.moving
            ??
            false
        );

    }


    getJointDirection(
        name
    ) {

        return (
            this.getJoint(
                name
            )
                ?.direction
            ??
            "still"
        );

    }


    getJointSpeed(
        name
    ) {

        return (
            this.getJoint(
                name
            )
                ?.speed
            ??
            0
        );

    }


    getDominantJoint() {

        return this.state
            .dominantJoint;

    }


    getBodyState() {

        return this.state
            .bodyState;

    }


    getIntensity() {

        return this.state
            .intensity;

    }


    getState() {

        return this.state;

    }


    // ======================================================
    // RESET
    // ======================================================

    emptyState() {

        return {

            timestamp: 0,

            valid: false,

            bodyState: "still",

            intensity: 0,

            center: null,

            joints: {},

            dominantJoint: null,

            dominantSpeed: 0

        };

    }


    reset() {

        this.history.reset();


        this.state =
            this.emptyState();

    }

}


// ==========================================================
// INSTÂNCIA PRINCIPAL
// ==========================================================

export const fitaiMotion =
    new MotionEngine();