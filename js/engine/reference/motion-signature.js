// ==========================================================
// FITAI MOTION PLATFORM
// MOTION SIGNATURE 1.0
//
// Responsabilidade:
// representar um movimento corporal como uma assinatura
// temporal reutilizável.
//
// Serve para:
// - exercícios
// - gestos
// - golpes
// - mobilidade
// - alongamentos
// - movimentos esportivos
// - movimentos criados por usuários
//
// NÃO:
// - avalia se o movimento está correto
// - controla câmera
// - desenha
// - depende de um exercício específico
// ==========================================================


// ==========================================================
// HELPERS
// ==========================================================

function clonePoint(
    point
) {

    if (
        !point
    ) {

        return null;

    }


    return {

        x:
            Number(
                point.x
                ??
                0
            ),

        y:
            Number(
                point.y
                ??
                0
            ),

        z:
            Number(
                point.z
                ??
                0
            )

    };

}


function cloneVector(
    vector
) {

    if (
        !vector
    ) {

        return {

            x: 0,
            y: 0,
            z: 0

        };

    }


    return {

        x:
            Number(
                vector.x
                ??
                0
            ),

        y:
            Number(
                vector.y
                ??
                0
            ),

        z:
            Number(
                vector.z
                ??
                0
            )

    };

}


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


// ==========================================================
// MOTION SIGNATURE
// ==========================================================

export class MotionSignature {

    constructor(
        options = {}
    ) {

        this.id =
            options.id
            ??
            null;


        this.name =
            options.name
            ??
            "Unnamed Motion";


        this.category =
            options.category
            ??
            "general";


        this.version =
            options.version
            ??
            "1.0";


        this.source =
            options.source
            ??
            "unknown";


        this.createdAt =
            options.createdAt
            ??
            Date.now();


        this.metadata = {

            description:
                options.description
                ??
                "",

            author:
                options.author
                ??
                null,

            tags:
                Array.isArray(
                    options.tags
                )
                    ?
                    [
                        ...options.tags
                    ]
                    :
                    [],

            dominantSide:
                options.dominantSide
                ??
                null

        };


        this.frames =
            [];


        this.startTimestamp =
            null;


        this.endTimestamp =
            null;


        this.duration =
            0;


        this.activeJoints =
            new Set();


        this.activeAngles =
            new Set();


        this.statistics =
            this.emptyStatistics();

    }


    // ======================================================
    // FRAME
    // ======================================================

    addFrame(
        source = {}
    ) {

        const timestamp =
            Number(
                source.timestamp
                ??
                performance.now()
            );


        if (
            this.startTimestamp
            ===
            null
        ) {

            this.startTimestamp =
                timestamp;

        }


        const relativeTime =
            Math.max(
                0,
                timestamp
                -
                this.startTimestamp
            );


        const frame = {

            index:
                this.frames.length,

            timestamp,

            time:
                relativeTime,

            confidence:
                Number(
                    source.confidence
                    ??
                    0
                ),

            bodyState:
                source.bodyState
                ??
                null,

            intensity:
                Number(
                    source.intensity
                    ??
                    0
                ),

            center:
                clonePoint(
                    source.center
                ),

            joints: {},

            angles: {},

            regions: {},

            phase:
                source.phase
                ??
                null,

            markers:
                Array.isArray(
                    source.markers
                )
                    ?
                    [
                        ...source.markers
                    ]
                    :
                    []

        };


        // --------------------------------------------------
        // JOINTS
        // --------------------------------------------------

        if (
            source.joints
            &&
            typeof source.joints
            ===
            "object"
        ) {

            for (
                const [
                    name,
                    joint
                ]
                of
                Object.entries(
                    source.joints
                )
            ) {

                if (
                    !joint
                ) {

                    continue;

                }


                frame.joints[
                    name
                ] = {

                    position:
                        clonePoint(
                            joint.position
                            ??
                            joint.normalizedPosition
                        ),

                    normalizedPosition:
                        clonePoint(
                            joint.normalizedPosition
                            ??
                            joint.position
                        ),

                    velocity:
                        cloneVector(
                            joint.velocity
                        ),

                    acceleration:
                        cloneVector(
                            joint.acceleration
                        ),

                    confidence:
                        clamp(
                            Number(
                                joint.confidence
                                ??
                                joint.visibility
                                ??
                                0
                            )
                        )

                };


                this.activeJoints.add(
                    name
                );

            }

        }


        // --------------------------------------------------
        // ANGLES
        // --------------------------------------------------

        if (
            source.angles
            &&
            typeof source.angles
            ===
            "object"
        ) {

            for (
                const [
                    name,
                    value
                ]
                of
                Object.entries(
                    source.angles
                )
            ) {

                if (
                    Number.isFinite(
                        value
                    )
                ) {

                    frame.angles[
                        name
                    ] =
                        value;


                    this.activeAngles.add(
                        name
                    );

                }

            }

        }


        // --------------------------------------------------
        // REGIONS
        // --------------------------------------------------

        if (
            source.regions
            &&
            typeof source.regions
            ===
            "object"
        ) {

            for (
                const [
                    name,
                    region
                ]
                of
                Object.entries(
                    source.regions
                )
            ) {

                frame.regions[
                    name
                ] = {

                    score:
                        Number(
                            region
                                ?.score
                            ??
                            0
                        ),

                    coverage:
                        Number(
                            region
                                ?.coverage
                            ??
                            0
                        ),

                    usable:
                        Boolean(
                            region
                                ?.usable
                        )

                };

            }

        }


        this.frames.push(
            frame
        );


        this.endTimestamp =
            timestamp;


        this.duration =
            relativeTime;


        return frame;

    }


    // ======================================================
    // MARKERS
    // ======================================================

    addMarker(
        name,
        data = {}
    ) {

        if (
            this.frames.length
            ===
            0
        ) {

            return false;

        }


        const frame =
            this.frames[
                this.frames.length
                -
                1
            ];


        frame.markers.push({

            name,

            data,

            time:
                frame.time

        });


        return true;

    }


    // ======================================================
    // PHASE
    // ======================================================

    setCurrentPhase(
        phase
    ) {

        if (
            this.frames.length
            ===
            0
        ) {

            return false;

        }


        this.frames[
            this.frames.length
            -
            1
        ].phase =
            phase;


        return true;

    }


    // ======================================================
    // STATISTICS
    // ======================================================

    calculateStatistics() {

        if (
            this.frames.length
            ===
            0
        ) {

            this.statistics =
                this.emptyStatistics();


            return this.statistics;

        }


        const jointStats =
            {};


        for (
            const jointName
            of
            this.activeJoints
        ) {

            const confidences = [];

            const speeds = [];

            const positions = [];


            for (
                const frame
                of
                this.frames
            ) {

                const joint =
                    frame.joints[
                        jointName
                    ];


                if (
                    !joint
                ) {

                    continue;

                }


                confidences.push(
                    joint.confidence
                );


                const velocity =
                    joint.velocity;


                const speed =
                    Math.hypot(

                        velocity.x,

                        velocity.y,

                        velocity.z

                    );


                speeds.push(
                    speed
                );


                if (
                    joint.normalizedPosition
                ) {

                    positions.push(
                        joint.normalizedPosition
                    );

                }

            }


            jointStats[
                jointName
            ] = {

                confidence:
                    average(
                        confidences
                    ),

                averageSpeed:
                    average(
                        speeds
                    ),

                maxSpeed:
                    speeds.length > 0
                        ?
                        Math.max(
                            ...speeds
                        )
                        :
                        0,

                samples:
                    positions.length

            };

        }


        const angleStats =
            {};


        for (
            const angleName
            of
            this.activeAngles
        ) {

            const values = [];


            for (
                const frame
                of
                this.frames
            ) {

                const value =
                    frame.angles[
                        angleName
                    ];


                if (
                    Number.isFinite(
                        value
                    )
                ) {

                    values.push(
                        value
                    );

                }

            }


            angleStats[
                angleName
            ] = {

                min:
                    values.length > 0
                        ?
                        Math.min(
                            ...values
                        )
                        :
                        null,

                max:
                    values.length > 0
                        ?
                        Math.max(
                            ...values
                        )
                        :
                        null,

                average:
                    average(
                        values
                    ),

                range:
                    values.length > 0
                        ?
                        Math.max(
                            ...values
                        )
                        -
                        Math.min(
                            ...values
                        )
                        :
                        0

            };

        }


        const confidence =
            average(

                this.frames.map(
                    frame =>
                        frame.confidence
                )

            );


        const intensity =
            average(

                this.frames.map(
                    frame =>
                        frame.intensity
                )

            );


        this.statistics = {

            frameCount:
                this.frames.length,

            duration:
                this.duration,

            averageConfidence:
                confidence,

            averageIntensity:
                intensity,

            joints:
                jointStats,

            angles:
                angleStats

        };


        return this.statistics;

    }


    // ======================================================
    // CONSULTAS
    // ======================================================

    getFrame(
        index
    ) {

        return (
            this.frames[
                index
            ]
            ??
            null
        );

    }


    getFrames() {

        return this.frames;

    }


    getDuration() {

        return this.duration;

    }


    getFrameCount() {

        return this.frames.length;

    }


    getJointNames() {

        return Array.from(
            this.activeJoints
        );

    }


    getAngleNames() {

        return Array.from(
            this.activeAngles
        );

    }


    getMarkers() {

        const markers = [];


        for (
            const frame
            of
            this.frames
        ) {

            for (
                const marker
                of
                frame.markers
            ) {

                markers.push({

                    frame:
                        frame.index,

                    ...marker

                });

            }

        }


        return markers;

    }


    getPhases() {

        const phases = [];

        let previous =
            null;


        for (
            const frame
            of
            this.frames
        ) {

            if (
                !frame.phase
                ||
                frame.phase
                ===
                previous
            ) {

                continue;

            }


            phases.push({

                phase:
                    frame.phase,

                frame:
                    frame.index,

                time:
                    frame.time

            });


            previous =
                frame.phase;

        }


        return phases;

    }


    // ======================================================
    // SERIALIZAÇÃO
    // ======================================================

    toJSON() {

        this.calculateStatistics();


        return {

            format:
                "fitai-motion-signature",

            formatVersion:
                1,

            id:
                this.id,

            name:
                this.name,

            category:
                this.category,

            version:
                this.version,

            source:
                this.source,

            createdAt:
                this.createdAt,

            metadata: {

                ...this.metadata,

                tags: [
                    ...this.metadata.tags
                ]

            },

            duration:
                this.duration,

            joints:
                this.getJointNames(),

            angles:
                this.getAngleNames(),

            frames:
                this.frames,

            statistics:
                this.statistics

        };

    }


    static fromJSON(
        data
    ) {

        if (
            !data
            ||
            data.format
            !==
            "fitai-motion-signature"
        ) {

            throw new Error(
                "Invalid FitAI Motion Signature"
            );

        }


        const signature =
            new MotionSignature({

                id:
                    data.id,

                name:
                    data.name,

                category:
                    data.category,

                version:
                    data.version,

                source:
                    data.source,

                createdAt:
                    data.createdAt,

                description:
                    data.metadata
                        ?.description,

                author:
                    data.metadata
                        ?.author,

                tags:
                    data.metadata
                        ?.tags,

                dominantSide:
                    data.metadata
                        ?.dominantSide

            });


        signature.frames =
            Array.isArray(
                data.frames
            )
                ?
                data.frames
                :
                [];


        signature.duration =
            Number(
                data.duration
                ??
                0
            );


        signature.activeJoints =
            new Set(
                data.joints
                ??
                []
            );


        signature.activeAngles =
            new Set(
                data.angles
                ??
                []
            );


        signature.statistics =
            data.statistics
            ??
            signature.emptyStatistics();


        if (
            signature.frames.length > 0
        ) {

            signature.startTimestamp =
                signature.frames[
                    0
                ].timestamp
                ??
                0;


            signature.endTimestamp =
                signature.frames[
                    signature.frames.length
                    -
                    1
                ].timestamp
                ??
                signature.startTimestamp;

        }


        return signature;

    }


    // ======================================================
    // RESET
    // ======================================================

    emptyStatistics() {

        return {

            frameCount: 0,

            duration: 0,

            averageConfidence: 0,

            averageIntensity: 0,

            joints: {},

            angles: {}

        };

    }


    reset() {

        this.frames =
            [];


        this.startTimestamp =
            null;


        this.endTimestamp =
            null;


        this.duration =
            0;


        this.activeJoints =
            new Set();


        this.activeAngles =
            new Set();


        this.statistics =
            this.emptyStatistics();

    }

}