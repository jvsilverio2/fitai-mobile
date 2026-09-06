// ==========================================================
// FITAI MOTION PLATFORM
// REFERENCE PLAYER 1.0
//
// Responsabilidade:
// consultar uma Motion Signature em qualquer ponto temporal.
//
// Permite responder:
// - qual frame corresponde a 30% do movimento?
// - onde estava determinado joint?
// - qual ângulo existia naquele instante?
// - em qual fase o movimento estava?
//
// Ele NÃO:
// - compara usuário com referência
// - avalia técnica
// - controla câmera
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


function lerp(
    a,
    b,
    t
) {

    return (
        a
        +
        (
            b
            -
            a
        )
        *
        t
    );

}


function interpolatePoint(
    a,
    b,
    t
) {

    if (
        !a
        &&
        !b
    ) {

        return null;

    }


    if (
        !a
    ) {

        return {
            ...b
        };

    }


    if (
        !b
    ) {

        return {
            ...a
        };

    }


    return {

        x:
            lerp(
                a.x ?? 0,
                b.x ?? 0,
                t
            ),

        y:
            lerp(
                a.y ?? 0,
                b.y ?? 0,
                t
            ),

        z:
            lerp(
                a.z ?? 0,
                b.z ?? 0,
                t
            )

    };

}


function interpolateJoint(
    a,
    b,
    t
) {

    if (
        !a
        &&
        !b
    ) {

        return null;

    }


    if (
        !a
    ) {

        return {
            ...b
        };

    }


    if (
        !b
    ) {

        return {
            ...a
        };

    }


    return {

        position:
            interpolatePoint(
                a.position,
                b.position,
                t
            ),

        normalizedPosition:
            interpolatePoint(
                a.normalizedPosition,
                b.normalizedPosition,
                t
            ),

        velocity:
            interpolatePoint(
                a.velocity,
                b.velocity,
                t
            ),

        acceleration:
            interpolatePoint(
                a.acceleration,
                b.acceleration,
                t
            ),

        confidence:
            lerp(
                a.confidence ?? 0,
                b.confidence ?? 0,
                t
            )

    };

}


// ==========================================================
// REFERENCE PLAYER
// ==========================================================

export class ReferencePlayer {

    constructor() {

        this.reference =
            null;


        this.lastSample =
            null;

    }


    // ======================================================
    // LOAD
    // ======================================================

    load(
        reference
    ) {

        if (
            !reference
            ||
            typeof reference.getFrames
            !==
            "function"
        ) {

            this.reference =
                null;


            this.lastSample =
                null;


            return false;

        }


        this.reference =
            reference;


        this.lastSample =
            null;


        return true;

    }


    unload() {

        const previous =
            this.reference;


        this.reference =
            null;


        this.lastSample =
            null;


        return previous;

    }


    // ======================================================
    // SAMPLE POR TEMPO
    // ======================================================

    sampleAtTime(
        time
    ) {

        if (
            !this.reference
        ) {

            return null;

        }


        const frames =
            this.reference.getFrames();


        if (
            frames.length
            ===
            0
        ) {

            return null;

        }


        if (
            frames.length
            ===
            1
        ) {

            this.lastSample =
                this.createSampleFromFrame(
                    frames[0]
                );


            return this.lastSample;

        }


        const duration =
            this.reference.getDuration();


        const targetTime =
            clamp(
                Number(
                    time
                    ??
                    0
                ),
                0,
                duration
            );


        let before =
            frames[0];


        let after =
            frames[
                frames.length
                -
                1
            ];


        for (
            let i = 0;
            i < frames.length - 1;
            i += 1
        ) {

            const current =
                frames[i];


            const next =
                frames[i + 1];


            if (
                targetTime
                >=
                current.time
                &&
                targetTime
                <=
                next.time
            ) {

                before =
                    current;


                after =
                    next;


                break;

            }

        }


        const interval =
            after.time
            -
            before.time;


        const interpolation =
            interval > 0
                ?
                clamp(
                    (
                        targetTime
                        -
                        before.time
                    )
                    /
                    interval
                )
                :
                0;


        const sample =
            this.interpolateFrames(

                before,

                after,

                interpolation,

                targetTime

            );


        this.lastSample =
            sample;


        return sample;

    }


    // ======================================================
    // SAMPLE POR PROGRESSO
    //
    // progress:
    // 0.0 = início
    // 0.5 = metade
    // 1.0 = final
    // ======================================================

    sampleAtProgress(
        progress
    ) {

        if (
            !this.reference
        ) {

            return null;

        }


        const normalizedProgress =
            clamp(
                Number(
                    progress
                    ??
                    0
                )
            );


        const duration =
            this.reference.getDuration();


        return this.sampleAtTime(

            duration
            *
            normalizedProgress

        );

    }


    // ======================================================
    // INTERPOLAÇÃO DE FRAMES
    // ======================================================

    interpolateFrames(
        before,
        after,
        t,
        targetTime
    ) {

        const joints =
            {};


        const jointNames =
            new Set([

                ...Object.keys(
                    before.joints
                    ??
                    {}
                ),

                ...Object.keys(
                    after.joints
                    ??
                    {}
                )

            ]);


        for (
            const jointName
            of
            jointNames
        ) {

            joints[
                jointName
            ] =
                interpolateJoint(

                    before.joints
                        ?.[
                            jointName
                        ],

                    after.joints
                        ?.[
                            jointName
                        ],

                    t

                );

        }


        const angles =
            {};


        const angleNames =
            new Set([

                ...Object.keys(
                    before.angles
                    ??
                    {}
                ),

                ...Object.keys(
                    after.angles
                    ??
                    {}
                )

            ]);


        for (
            const angleName
            of
            angleNames
        ) {

            const a =
                before.angles
                    ?.[
                        angleName
                    ];


            const b =
                after.angles
                    ?.[
                        angleName
                    ];


            if (
                Number.isFinite(
                    a
                )
                &&
                Number.isFinite(
                    b
                )
            ) {

                angles[
                    angleName
                ] =
                    lerp(
                        a,
                        b,
                        t
                    );

            }

            else if (
                Number.isFinite(
                    a
                )
            ) {

                angles[
                    angleName
                ] =
                    a;

            }

            else if (
                Number.isFinite(
                    b
                )
            ) {

                angles[
                    angleName
                ] =
                    b;

            }

        }


        const regions =
            {};


        const regionNames =
            new Set([

                ...Object.keys(
                    before.regions
                    ??
                    {}
                ),

                ...Object.keys(
                    after.regions
                    ??
                    {}
                )

            ]);


        for (
            const regionName
            of
            regionNames
        ) {

            const a =
                before.regions
                    ?.[
                        regionName
                    ]
                ??
                {};


            const b =
                after.regions
                    ?.[
                        regionName
                    ]
                ??
                {};


            regions[
                regionName
            ] = {

                score:
                    lerp(
                        a.score ?? 0,
                        b.score ?? 0,
                        t
                    ),

                coverage:
                    lerp(
                        a.coverage ?? 0,
                        b.coverage ?? 0,
                        t
                    ),

                usable:
                    t < 0.5
                        ?
                        Boolean(
                            a.usable
                        )
                        :
                        Boolean(
                            b.usable
                        )

            };

        }


        return {

            time:
                targetTime,

            progress:
                this.reference.getDuration() > 0
                    ?
                    targetTime
                    /
                    this.reference.getDuration()
                    :
                    0,

            sourceFrames: {

                before:
                    before.index,

                after:
                    after.index,

                interpolation:
                    t

            },

            confidence:
                lerp(
                    before.confidence ?? 0,
                    after.confidence ?? 0,
                    t
                ),

            intensity:
                lerp(
                    before.intensity ?? 0,
                    after.intensity ?? 0,
                    t
                ),

            center:
                interpolatePoint(
                    before.center,
                    after.center,
                    t
                ),

            joints,

            angles,

            regions,

            bodyState:
                t < 0.5
                    ?
                    before.bodyState
                    :
                    after.bodyState,

            phase:
                t < 0.5
                    ?
                    before.phase
                    :
                    after.phase

        };

    }


    // ======================================================
    // FRAME SIMPLES
    // ======================================================

    createSampleFromFrame(
        frame
    ) {

        return {

            time:
                frame.time,

            progress: 0,

            sourceFrames: {

                before:
                    frame.index,

                after:
                    frame.index,

                interpolation: 0

            },

            confidence:
                frame.confidence
                ??
                0,

            intensity:
                frame.intensity
                ??
                0,

            center:
                frame.center
                ??
                null,

            joints:
                frame.joints
                ??
                {},

            angles:
                frame.angles
                ??
                {},

            regions:
                frame.regions
                ??
                {},

            bodyState:
                frame.bodyState
                ??
                null,

            phase:
                frame.phase
                ??
                null

        };

    }


    // ======================================================
    // CONSULTAS DIRETAS
    // ======================================================

    getJointAtProgress(
        jointName,
        progress
    ) {

        const sample =
            this.sampleAtProgress(
                progress
            );


        return (
            sample
                ?.joints
                ?.[
                    jointName
                ]
            ??
            null
        );

    }


    getAngleAtProgress(
        angleName,
        progress
    ) {

        const sample =
            this.sampleAtProgress(
                progress
            );


        const value =
            sample
                ?.angles
                ?.[
                    angleName
                ];


        return Number.isFinite(
            value
        )
            ?
            value
            :
            null;

    }


    getPhaseAtProgress(
        progress
    ) {

        return (
            this.sampleAtProgress(
                progress
            )
                ?.phase
            ??
            null
        );

    }


    // ======================================================
    // STATE
    // ======================================================

    getState() {

        return {

            loaded:
                Boolean(
                    this.reference
                ),

            referenceId:
                this.reference
                    ?.id
                ??
                null,

            name:
                this.reference
                    ?.name
                ??
                null,

            duration:
                this.reference
                    ?.getDuration()
                ??
                0,

            frameCount:
                this.reference
                    ?.getFrameCount()
                ??
                0,

            lastSample:
                this.lastSample

        };

    }


    // ======================================================
    // RESET
    // ======================================================

    reset() {

        this.reference =
            null;


        this.lastSample =
            null;

    }

}