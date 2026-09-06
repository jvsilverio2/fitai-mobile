// ==========================================================
// FITAI MOTION PLATFORM
// REFERENCE ENGINE 1.0
//
// Responsabilidade:
// criar, armazenar e reproduzir Motion Signatures.
//
// O Reference Engine é genérico.
// Ele NÃO sabe se o movimento é:
// - agachamento
// - jab
// - salto
// - corrida
// - mobilidade
// - dança
// - qualquer outra habilidade
//
// Ele trabalha apenas com referências de movimento.
// ==========================================================

import {
    MotionSignature
}
from "./motion-signature.js";


// ==========================================================
// HELPERS
// ==========================================================

function createId(
    prefix = "reference"
) {

    const randomPart =
        globalThis.crypto
            ?.randomUUID
            ?.()
        ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;


    return `${prefix}-${randomPart}`;
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


// ==========================================================
// REFERENCE ENGINE
// ==========================================================

export class ReferenceEngine {

    constructor() {

        this.references =
            new Map();


        this.recording =
            false;


        this.currentRecording =
            null;


        this.activeReference =
            null;


        this.playback = {

            active: false,

            startedAt: 0,

            currentTime: 0,

            speed: 1,

            loop: false,

            frameIndex: 0

        };

    }


    // ======================================================
    // CRIAR REFERÊNCIA
    // ======================================================

    createReference(
        options = {}
    ) {

        return new MotionSignature({

            id:
                options.id
                ??
                createId(),

            name:
                options.name
                ??
                "Unnamed Motion",

            category:
                options.category
                ??
                "general",

            version:
                options.version
                ??
                "1.0",

            source:
                options.source
                ??
                "fitai",

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
                null

        });

    }


    // ======================================================
    // GRAVAÇÃO
    // ======================================================

    startRecording(
        options = {}
    ) {

        const signature =
            this.createReference({

                ...options,

                source:
                    options.source
                    ??
                    "recording"

            });


        this.currentRecording =
            signature;


        this.recording =
            true;


        return signature;

    }


    addFrame(
        frameData = {}
    ) {

        if (
            !this.recording
            ||
            !this.currentRecording
        ) {

            return null;

        }


        return this.currentRecording.addFrame(
            frameData
        );

    }


    addMarker(
        name,
        data = {}
    ) {

        if (
            !this.recording
            ||
            !this.currentRecording
        ) {

            return false;

        }


        return this.currentRecording.addMarker(
            name,
            data
        );

    }


    setPhase(
        phase
    ) {

        if (
            !this.recording
            ||
            !this.currentRecording
        ) {

            return false;

        }


        return this.currentRecording.setCurrentPhase(
            phase
        );

    }


    stopRecording(
        options = {}
    ) {

        if (
            !this.recording
            ||
            !this.currentRecording
        ) {

            return null;

        }


        const signature =
            this.currentRecording;


        signature.calculateStatistics();


        this.recording =
            false;


        this.currentRecording =
            null;


        if (
            options.save
            !==
            false
        ) {

            this.saveReference(
                signature
            );

        }


        return signature;

    }


    cancelRecording() {

        const signature =
            this.currentRecording;


        this.recording =
            false;


        this.currentRecording =
            null;


        return signature;

    }


    // ======================================================
    // ARMAZENAMENTO EM MEMÓRIA
    // ======================================================

    saveReference(
        signature
    ) {

        if (
            !(signature instanceof MotionSignature)
        ) {

            return false;

        }


        if (
            !signature.id
        ) {

            signature.id =
                createId();

        }


        this.references.set(
            signature.id,
            signature
        );


        return true;

    }


    removeReference(
        referenceId
    ) {

        if (
            this.activeReference
                ?.id
            ===
            referenceId
        ) {

            this.stopPlayback();


            this.activeReference =
                null;

        }


        return this.references.delete(
            referenceId
        );

    }


    getReference(
        referenceId
    ) {

        return (
            this.references.get(
                referenceId
            )
            ??
            null
        );

    }


    getReferences() {

        return Array.from(
            this.references.values()
        );

    }


    getReferenceSummaries() {

        return this.getReferences()
        .map(
            reference => ({

                id:
                    reference.id,

                name:
                    reference.name,

                category:
                    reference.category,

                version:
                    reference.version,

                source:
                    reference.source,

                duration:
                    reference.duration,

                frameCount:
                    reference.getFrameCount(),

                joints:
                    reference.getJointNames(),

                angles:
                    reference.getAngleNames()

            })
        );

    }


    // ======================================================
    // REFERÊNCIA ATIVA
    // ======================================================

    activateReference(
        referenceId
    ) {

        const reference =
            this.getReference(
                referenceId
            );


        if (
            !reference
        ) {

            return null;

        }


        this.stopPlayback();


        this.activeReference =
            reference;


        return reference;

    }


    deactivateReference() {

        this.stopPlayback();


        const previous =
            this.activeReference;


        this.activeReference =
            null;


        return previous;

    }


    getActiveReference() {

        return this.activeReference;

    }


    // ======================================================
    // PLAYBACK
    // ======================================================

    startPlayback(
        options = {}
    ) {

        if (
            !this.activeReference
        ) {

            return false;

        }


        this.playback.active =
            true;


        this.playback.startedAt =
            performance.now();


        this.playback.currentTime =
            Number(
                options.startTime
                ??
                0
            );


        this.playback.speed =
            Math.max(
                0.05,
                Number(
                    options.speed
                    ??
                    1
                )
            );


        this.playback.loop =
            Boolean(
                options.loop
            );


        this.playback.frameIndex =
            0;


        return true;

    }


    stopPlayback() {

        this.playback.active =
            false;


        this.playback.startedAt =
            0;


        this.playback.currentTime =
            0;


        this.playback.frameIndex =
            0;

    }


    setPlaybackSpeed(
        speed
    ) {

        const numeric =
            Number(
                speed
            );


        if (
            !Number.isFinite(
                numeric
            )
        ) {

            return this.playback.speed;

        }


        this.playback.speed =
            Math.max(
                0.05,
                numeric
            );


        return this.playback.speed;

    }


    updatePlayback(
        timestamp =
            performance.now()
    ) {

        if (
            !this.playback.active
            ||
            !this.activeReference
        ) {

            return null;

        }


        const reference =
            this.activeReference;


        const duration =
            reference.getDuration();


        if (
            duration
            <=
            0
        ) {

            this.stopPlayback();


            return null;

        }


        const elapsed =
            (
                timestamp
                -
                this.playback.startedAt
            )
            *
            this.playback.speed;


        let targetTime =
            this.playback.currentTime
            +
            elapsed;


        if (
            targetTime
            >
            duration
        ) {

            if (
                this.playback.loop
            ) {

                targetTime =
                    targetTime
                    %
                    duration;


                this.playback.startedAt =
                    timestamp;


                this.playback.currentTime =
                    targetTime;

            }

            else {

                targetTime =
                    duration;


                const finalFrame =
                    this.getFrameAtTime(
                        targetTime
                    );


                this.stopPlayback();


                return finalFrame;

            }

        }


        this.playback.startedAt =
            timestamp;


        this.playback.currentTime =
            targetTime;


        const frame =
            this.getFrameAtTime(
                targetTime
            );


        if (
            frame
        ) {

            this.playback.frameIndex =
                frame.index;

        }


        return frame;

    }


    // ======================================================
    // CONSULTAR FRAME POR TEMPO
    // ======================================================

    getFrameAtTime(
        time
    ) {

        if (
            !this.activeReference
        ) {

            return null;

        }


        const frames =
            this.activeReference
                .getFrames();


        if (
            frames.length
            ===
            0
        ) {

            return null;

        }


        const target =
            clamp(
                Number(
                    time
                    ??
                    0
                ),
                0,
                this.activeReference
                    .getDuration()
            );


        let nearest =
            frames[0];


        let nearestDistance =
            Math.abs(
                nearest.time
                -
                target
            );


        for (
            let i = 1;
            i < frames.length;
            i += 1
        ) {

            const frame =
                frames[i];


            const distance =
                Math.abs(
                    frame.time
                    -
                    target
                );


            if (
                distance
                <
                nearestDistance
            ) {

                nearest =
                    frame;


                nearestDistance =
                    distance;

            }


            if (
                frame.time
                >
                target
                &&
                distance
                >
                nearestDistance
            ) {

                break;

            }

        }


        return nearest;

    }


    // ======================================================
    // IMPORT / EXPORT
    // ======================================================

    exportReference(
        referenceId
    ) {

        const reference =
            this.getReference(
                referenceId
            );


        if (
            !reference
        ) {

            return null;

        }


        return reference.toJSON();

    }


    importReference(
        data
    ) {

        const signature =
            MotionSignature.fromJSON(
                data
            );


        this.saveReference(
            signature
        );


        return signature;

    }


    // ======================================================
    // ESTADO
    // ======================================================

    getState() {

        return {

            recording:
                this.recording,

            currentRecording:
                this.currentRecording
                    ?
                    {
                        id:
                            this.currentRecording.id,

                        name:
                            this.currentRecording.name,

                        duration:
                            this.currentRecording.duration,

                        frameCount:
                            this.currentRecording
                                .getFrameCount()
                    }
                    :
                    null,

            activeReference:
                this.activeReference
                    ?
                    {
                        id:
                            this.activeReference.id,

                        name:
                            this.activeReference.name,

                        duration:
                            this.activeReference.duration,

                        frameCount:
                            this.activeReference
                                .getFrameCount()
                    }
                    :
                    null,

            playback: {

                ...this.playback

            },

            referenceCount:
                this.references.size

        };

    }


    // ======================================================
    // RESET
    // ======================================================

    reset() {

        this.recording =
            false;


        this.currentRecording =
            null;


        this.activeReference =
            null;


        this.stopPlayback();


        this.references.clear();

    }

}


// ==========================================================
// INSTÂNCIA PRINCIPAL
// ==========================================================

export const fitaiReferenceEngine =
    new ReferenceEngine();