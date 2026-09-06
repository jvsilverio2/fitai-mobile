// ==========================================================
// FITAI MOTION PLATFORM
// MOTION HISTORY 1.0
//
// Memória temporal de movimento.
//
// Responsabilidade:
// armazenar uma sequência curta de estados corporais
// para permitir análise de movimento ao longo do tempo.
//
// NÃO:
// - detecta corpo
// - desenha
// - avalia exercício
// - fornece feedback
// ==========================================================


function clonePosition(position) {

    if (!position) {

        return null;

    }


    return {

        x: position.x ?? 0,
        y: position.y ?? 0,
        z: position.z ?? 0

    };

}


function cloneVelocity(velocity) {

    if (!velocity) {

        return {

            x: 0,
            y: 0,
            z: 0,
            speed: 0,
            direction: 0

        };

    }


    return {

        x: velocity.x ?? 0,
        y: velocity.y ?? 0,
        z: velocity.z ?? 0,

        speed:
            velocity.speed ?? 0,

        direction:
            velocity.direction ?? 0

    };

}


// ==========================================================
// MOTION HISTORY
// ==========================================================

export class MotionHistory {

    constructor(options = {}) {

        // Quantos segundos de movimento manter.
        this.duration =
            options.duration
            ??
            4;


        // Limite de segurança.
        this.maxFrames =
            options.maxFrames
            ??
            300;


        this.frames = [];

    }


    // ======================================================
    // ADICIONAR FRAME
    // ======================================================

    push(body) {

        if (
            !body
            ||
            !body.joints
        ) {

            return null;

        }


        const usableJointCount =
            Object.values(
                body.joints
            )
            .filter(
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
            )
            .length;


        if (
            usableJointCount
            <
            3
        ) {

            return null;

        }


        const frame =
            this.createFrame(
                body
            );


        this.frames.push(
            frame
        );


        this.removeExpiredFrames(
            frame.timestamp
        );


        if (
            this.frames.length
            >
            this.maxFrames
        ) {

            this.frames.splice(
                0,
                this.frames.length
                -
                this.maxFrames
            );

        }


        return frame;

    }


    // ======================================================
    // CRIAR SNAPSHOT
    // ======================================================

    createFrame(body) {

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

            if (!joint) {

                continue;

            }


            joints[name] = {

                position:
                    clonePosition(
                        joint.position
                    ),

                normalizedPosition:
                    clonePosition(
                        joint.normalizedPosition
                    ),

                velocity:
                    cloneVelocity(
                        joint.velocity
                    ),

                confidence:
                    joint.confidence
                    ??
                    joint.visibility
                    ??
                    0

            };

        }


        return {

            timestamp:
                body.timestamp,

            center: {

                position:
                    clonePosition(
                        body.center?.position
                    ),

                velocity:
                    cloneVelocity(
                        body.center?.velocity
                    )

            },

            angles: {

                ...body.angles

            },

            confidence: {

                ...body.confidence

            },

            joints

        };

    }


    // ======================================================
    // REMOVER FRAMES ANTIGOS
    // ======================================================

    removeExpiredFrames(
        currentTimestamp
    ) {

        const minimumTimestamp =
            currentTimestamp
            -
            (
                this.duration
                *
                1000
            );


        while (
            this.frames.length
            >
            0
            &&
            this.frames[0].timestamp
            <
            minimumTimestamp
        ) {

            this.frames.shift();

        }

    }


    // ======================================================
    // FRAME ATUAL
    // ======================================================

    latest() {

        if (
            this.frames.length
            ===
            0
        ) {

            return null;

        }


        return this.frames[
            this.frames.length - 1
        ];

    }


    // ======================================================
    // FRAME ANTERIOR
    // ======================================================

    previous() {

        if (
            this.frames.length
            <
            2
        ) {

            return null;

        }


        return this.frames[
            this.frames.length - 2
        ];

    }


    // ======================================================
    // BUSCAR JANELA TEMPORAL
    // ======================================================

    getWindow(
        milliseconds = 1000
    ) {

        const latest =
            this.latest();


        if (!latest) {

            return [];

        }


        const minimumTimestamp =
            latest.timestamp
            -
            milliseconds;


        return this.frames.filter(
            frame =>
                frame.timestamp
                >=
                minimumTimestamp
        );

    }


    // ======================================================
    // HISTÓRICO DE UMA ARTICULAÇÃO
    // ======================================================

    getJointHistory(
        jointName,
        milliseconds = 1000
    ) {

        const frames =
            this.getWindow(
                milliseconds
            );


        return frames
            .map(
                frame => {

                    const joint =
                        frame.joints[
                            jointName
                        ];


                    if (!joint) {

                        return null;

                    }


                    return {

                        timestamp:
                            frame.timestamp,

                        position:
                            clonePosition(
                                joint.position
                            ),

                        normalizedPosition:
                            clonePosition(
                                joint.normalizedPosition
                            ),

                        velocity:
                            cloneVelocity(
                                joint.velocity
                            ),

                        confidence:
                            joint.confidence

                    };

                }
            )
            .filter(Boolean);

    }


    // ======================================================
    // HISTÓRICO DE ÂNGULO
    // ======================================================

    getAngleHistory(
        angleName,
        milliseconds = 1000
    ) {

        const frames =
            this.getWindow(
                milliseconds
            );


        return frames
            .map(
                frame => {

                    const value =
                        frame.angles[
                            angleName
                        ];


                    if (
                        !Number.isFinite(
                            value
                        )
                    ) {

                        return null;

                    }


                    return {

                        timestamp:
                            frame.timestamp,

                        value

                    };

                }
            )
            .filter(Boolean);

    }


    // ======================================================
    // DESLOCAMENTO DE UMA ARTICULAÇÃO
    // ======================================================

    getJointDisplacement(
        jointName,
        milliseconds = 500
    ) {

        const history =
            this.getJointHistory(
                jointName,
                milliseconds
            );


        if (
            history.length
            <
            2
        ) {

            return {

                x: 0,
                y: 0,
                z: 0,
                distance: 0

            };

        }


        const first =
            history[0]
                .normalizedPosition;


        const last =
            history[
                history.length - 1
            ]
                .normalizedPosition;


        if (
            !first
            ||
            !last
        ) {

            return {

                x: 0,
                y: 0,
                z: 0,
                distance: 0

            };

        }


        const x =
            last.x
            -
            first.x;


        const y =
            last.y
            -
            first.y;


        const z =
            last.z
            -
            first.z;


        return {

            x,
            y,
            z,

            distance:
                Math.hypot(
                    x,
                    y,
                    z
                )

        };

    }


    // ======================================================
    // DURAÇÃO REAL DO HISTÓRICO
    // ======================================================

    getDuration() {

        if (
            this.frames.length
            <
            2
        ) {

            return 0;

        }


        return (
            this.frames[
                this.frames.length - 1
            ].timestamp
            -
            this.frames[0].timestamp
        );

    }


    // ======================================================
    // API
    // ======================================================

    getFrames() {

        return this.frames;

    }


    getFrameCount() {

        return this.frames.length;

    }


    isReady(
        minimumMilliseconds = 300
    ) {

        return (
            this.frames.length
            >=
            2
            &&
            this.getDuration()
            >=
            minimumMilliseconds
        );

    }


    reset() {

        this.frames = [];

    }

}


// ==========================================================
// HISTÓRICO PRINCIPAL DO FITAI
// ==========================================================

export const fitaiMotionHistory =
    new MotionHistory({

        duration: 4,

        maxFrames: 300

    });