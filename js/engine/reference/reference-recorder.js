// ==========================================================
// FITAI MOTION PLATFORM
// REFERENCE RECORDER 1.0
//
// Responsabilidade:
// controlar uma sessão de gravação de movimento.
//
// Ele NÃO:
// - usa câmera diretamente
// - detecta landmarks
// - interpreta exercício
// - salva vídeo ou áudio
//
// Ele grava somente dados estruturados do Body Engine.
// ==========================================================


// ==========================================================
// HELPERS
// ==========================================================

function now() {

    return performance.now();

}


function createSessionId() {

    const random =
        globalThis.crypto
            ?.randomUUID
            ?.()
        ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;


    return `recording-${random}`;

}


// ==========================================================
// REFERENCE RECORDER
// ==========================================================

export class ReferenceRecorder {

    constructor(
        referenceEngine
    ) {

        if (
            !referenceEngine
        ) {

            throw new Error(
                "ReferenceRecorder requires a ReferenceEngine."
            );

        }


        this.referenceEngine =
            referenceEngine;


        this.status =
            "idle";


        this.session =
            null;


        this.lastRecording =
            null;

    }


    // ======================================================
    // START
    // ======================================================

    start(
        options = {}
    ) {

        if (
            this.status
            ===
            "recording"
        ) {

            return this.getState();

        }


        const startedAt =
            now();


        const signature =
            this.referenceEngine
                .startRecording({

                    id:
                        options.referenceId,

                    name:
                        options.name
                        ??
                        "Novo movimento",

                    category:
                        options.category
                        ??
                        "general",

                    description:
                        options.description
                        ??
                        "",

                    author:
                        options.author
                        ??
                        null,

                    tags:
                        options.tags
                        ??
                        [],

                    dominantSide:
                        options.dominantSide
                        ??
                        null,

                    source:
                        options.source
                        ??
                        "body-engine-recording"

                });


        this.session = {

            id:
                createSessionId(),

            referenceId:
                signature.id,

            startedAt,

            endedAt:
                null,

            elapsed:
                0,

            frameCount:
                0,

            markers:
                0,

            phase:
                null

        };


        this.status =
            "recording";


        return this.getState();

    }


    // ======================================================
    // UPDATE
    //
    // Não grava frames diretamente.
    // A FitAIMotionPlatform já envia cada frame para
    // ReferenceEngine enquanto recording === true.
    //
    // Este método acompanha apenas a sessão.
    // ======================================================

    update(
        timestamp =
            now()
    ) {

        if (
            this.status
            !==
            "recording"
            ||
            !this.session
        ) {

            return this.getState();

        }


        const recording =
            this.referenceEngine
                .currentRecording;


        this.session.elapsed =
            Math.max(
                0,
                timestamp
                -
                this.session.startedAt
            );


        this.session.frameCount =
            recording
                ?.getFrameCount()
            ??
            0;


        return this.getState();

    }


    // ======================================================
    // MARKER
    // ======================================================

    addMarker(
        name,
        data = {}
    ) {

        if (
            this.status
            !==
            "recording"
        ) {

            return false;

        }


        const added =
            this.referenceEngine
                .addMarker(
                    name,
                    data
                );


        if (
            added
            &&
            this.session
        ) {

            this.session.markers +=
                1;

        }


        return added;

    }


    // ======================================================
    // PHASE
    // ======================================================

    setPhase(
        phase
    ) {

        if (
            this.status
            !==
            "recording"
        ) {

            return false;

        }


        const changed =
            this.referenceEngine
                .setPhase(
                    phase
                );


        if (
            changed
            &&
            this.session
        ) {

            this.session.phase =
                phase;

        }


        return changed;

    }


    // ======================================================
    // STOP
    // ======================================================

    stop(
        options = {}
    ) {

        if (
            this.status
            !==
            "recording"
            ||
            !this.session
        ) {

            return null;

        }


        this.update();


        const signature =
            this.referenceEngine
                .stopRecording({

                    save:
                        options.save
                        !==
                        false

                });


        const endedAt =
            now();


        this.session.endedAt =
            endedAt;


        this.session.elapsed =
            endedAt
            -
            this.session.startedAt;


        this.session.frameCount =
            signature
                ?.getFrameCount()
            ??
            this.session.frameCount;


        const result = {

            session: {

                ...this.session

            },

            reference:
                signature,

            summary:
                this.createSummary(
                    signature
                )

        };


        this.lastRecording =
            result;


        this.status =
            "completed";


        this.session =
            null;


        return result;

    }


    // ======================================================
    // CANCEL
    // ======================================================

    cancel() {

        if (
            this.status
            !==
            "recording"
        ) {

            return null;

        }


        const signature =
            this.referenceEngine
                .cancelRecording();


        const result = {

            cancelled:
                true,

            referenceId:
                signature
                    ?.id
                ??
                null,

            frameCount:
                signature
                    ?.getFrameCount()
                ??
                0

        };


        this.session =
            null;


        this.status =
            "idle";


        return result;

    }


    // ======================================================
    // SUMMARY
    // ======================================================

    createSummary(
        signature
    ) {

        if (
            !signature
        ) {

            return {

                valid: false,

                duration: 0,

                frameCount: 0,

                jointCount: 0,

                angleCount: 0,

                averageConfidence: 0

            };

        }


        const statistics =
            signature.calculateStatistics();


        return {

            valid:
                signature.getFrameCount()
                >
                0,

            duration:
                signature.getDuration(),

            frameCount:
                signature.getFrameCount(),

            jointCount:
                signature
                    .getJointNames()
                    .length,

            angleCount:
                signature
                    .getAngleNames()
                    .length,

            averageConfidence:
                statistics
                    ?.averageConfidence
                ??
                0,

            averageIntensity:
                statistics
                    ?.averageIntensity
                ??
                0,

            markers:
                signature
                    .getMarkers()
                    .length,

            phases:
                signature
                    .getPhases()
                    .length

        };

    }


    // ======================================================
    // STATE
    // ======================================================

    getState() {

        return {

            status:
                this.status,

            recording:
                this.status
                ===
                "recording",

            session:
                this.session
                    ?
                    {
                        ...this.session
                    }
                    :
                    null,

            lastRecording:
                this.lastRecording
                    ?
                    {
                        session: {
                            ...this.lastRecording.session
                        },

                        summary: {
                            ...this.lastRecording.summary
                        },

                        referenceId:
                            this.lastRecording
                                .reference
                                ?.id
                            ??
                            null
                    }
                    :
                    null

        };

    }


    // ======================================================
    // RESET
    // ======================================================

    reset() {

        if (
            this.status
            ===
            "recording"
        ) {

            this.referenceEngine
                .cancelRecording();

        }


        this.status =
            "idle";


        this.session =
            null;


        this.lastRecording =
            null;

    }

}