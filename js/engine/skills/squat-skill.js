// ==========================================================
// FITAI MOTION PLATFORM
// SQUAT SKILL 2.0
//
// Responsabilidade:
// interpretar especificamente o movimento de agachamento.
//
// Usa:
// - Body Model
// - Body Confidence
// - Motion Engine
// - Motion Metrics
//
// Entrega:
// - fase do agachamento
// - progresso do movimento
// - eventos de repetição
// - métricas relevantes
//
// NÃO:
// - desenha
// - fala com usuário
// - controla HUD
// - decide sozinho qual feedback mostrar
// ==========================================================


import {
    Skill
}
from "./skill-engine.js";


// ==========================================================
// CONFIGURAÇÃO
// ==========================================================

const BODY_REQUIREMENTS = {

    required: [
        "hips",
        "knees",
        "ankles",
        "core"
    ],

    optional: [
        "feet",
        "legs"
    ],

    minimumScore: 0.52

};


const CONFIG = {

    minimumConfidence: 0.52,

    standingAngle: 158,

    descendingAngle: 152,

    bottomAngle: 108,

    leavingBottomAngle: 116,

    minimumRepDuration: 450,

    maximumRepDuration: 8000,

    repCooldown: 300

};


// ==========================================================
// HELPERS
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

        return null;

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
// SQUAT SKILL
// ==========================================================

export class SquatSkill extends Skill {

    constructor() {

        super({

            id:
                "squat",

            name:
                "Agachamento",

            category:
                "legs",

            version:
                "2.0"

        });


        this.reps =
            0;


        this.previousKneeAngle =
            null;


        this.reachedBottom =
            false;


        this.repStartedAt =
            0;


        this.lastRepAt =
            0;


        this.lowestKneeAngle =
            null;

    }


    // ======================================================
    // RESET
    // ======================================================

    reset() {

        super.reset();


        this.reps =
            0;


        this.previousKneeAngle =
            null;


        this.reachedBottom =
            false;


        this.repStartedAt =
            0;


        this.lastRepAt =
            0;


        this.lowestKneeAngle =
            null;


        this.state.metrics = {

            reps: 0,

            kneeAngle: null,

            leftKneeAngle: null,

            rightKneeAngle: null,

            hipAngle: null,

            torsoInclination: null,

            lowestKneeAngle: null,

            repDuration: null

        };


        return this.state;

    }


    // ======================================================
    // UPDATE
    // ======================================================

    update(
        context
    ) {

        super.update(
            context
        );


        const body =
            context.body;


        const confidence =
            context.confidence;


        if (
            !body
            ||
            !body.joints
        ) {

            this.handleLostBody();

            return this.state;

        }


        const regions =
            confidence
                ?.regions
            ??
            {};


        const requiredRegions =
            BODY_REQUIREMENTS.required
            .map(
                regionName =>
                    regions[
                        regionName
                    ]
                    ??
                    null
            );


        const missingRequired =
            BODY_REQUIREMENTS.required
            .filter(
                regionName => {

                    const region =
                        regions[
                            regionName
                        ];


                    return !(
                        region
                        &&
                        Number.isFinite(
                            region.score
                        )
                        &&
                        region.score
                        >=
                        BODY_REQUIREMENTS.minimumScore
                        &&
                        (
                            region.coverage
                            ??
                            0
                        )
                        >=
                        0.5
                    );

                }
            );


        const regionalScores =
            requiredRegions
            .map(
                region =>
                    region
                        ?.score
            )
            .filter(
                Number.isFinite
            );


        const bodyConfidence =
            regionalScores.length
                ?
                regionalScores.reduce(
                    (
                        total,
                        value
                    ) =>
                        total + value,
                    0
                )
                /
                regionalScores.length
                :
                0;


        this.setConfidence(
            bodyConfidence
        );


        this.setFlag(
            "missingRequiredRegions",
            missingRequired
        );


        if (
            missingRequired.length
            >
            0
        ) {

            this.setPhase(
                "waiting"
            );


            this.setMessage(
                "body-regions-unavailable"
            );


            return this.state;

        }


        const leftKnee =
            body.getAngle
                ?
                body.getAngle(
                    "leftKnee"
                )
                :
                body.angles
                    ?.leftKnee;


        const rightKnee =
            body.getAngle
                ?
                body.getAngle(
                    "rightKnee"
                )
                :
                body.angles
                    ?.rightKnee;


        const leftHip =
            body.getAngle
                ?
                body.getAngle(
                    "leftHip"
                )
                :
                body.angles
                    ?.leftHip;


        const rightHip =
            body.getAngle
                ?
                body.getAngle(
                    "rightHip"
                )
                :
                body.angles
                    ?.rightHip;


        const torsoInclination =
            body.getAngle
                ?
                body.getAngle(
                    "torsoInclination"
                )
                :
                body.angles
                    ?.torsoInclination;


        const kneeAngle =
            average([
                leftKnee,
                rightKnee
            ]);


        const hipAngle =
            average([
                leftHip,
                rightHip
            ]);


        if (
            !Number.isFinite(
                kneeAngle
            )
        ) {

            this.setPhase(
                "waiting"
            );


            this.setMessage(
                "knee-angle-unavailable"
            );


            return this.state;

        }


        this.updateMetrics({

            kneeAngle,

            leftKnee,

            rightKnee,

            hipAngle,

            torsoInclination

        });


        this.updatePhase(
            kneeAngle
        );


        this.updateProgress(
            kneeAngle
        );


        this.previousKneeAngle =
            kneeAngle;


        return this.state;

    }


    // ======================================================
    // MÉTRICAS
    // ======================================================

    updateMetrics({

        kneeAngle,

        leftKnee,

        rightKnee,

        hipAngle,

        torsoInclination

    }) {

        this.setMetric(
            "reps",
            this.reps
        );


        this.setMetric(
            "kneeAngle",
            kneeAngle
        );


        this.setMetric(
            "leftKneeAngle",
            leftKnee
        );


        this.setMetric(
            "rightKneeAngle",
            rightKnee
        );


        this.setMetric(
            "hipAngle",
            hipAngle
        );


        this.setMetric(
            "torsoInclination",
            torsoInclination
        );


        if (
            this.lowestKneeAngle === null
            ||
            kneeAngle
            <
            this.lowestKneeAngle
        ) {

            this.lowestKneeAngle =
                kneeAngle;


            this.setMetric(
                "lowestKneeAngle",
                kneeAngle
            );

        }

    }


    // ======================================================
    // FASE DO MOVIMENTO
    // ======================================================

    updatePhase(
        kneeAngle
    ) {

        const previous =
            this.previousKneeAngle;


        const descending =
            Number.isFinite(
                previous
            )
            &&
            kneeAngle
            <
            previous;


        const ascending =
            Number.isFinite(
                previous
            )
            &&
            kneeAngle
            >
            previous;


        switch (
            this.state.phase
        ) {

            // ------------------------------------------------
            // AGUARDANDO POSIÇÃO INICIAL
            // ------------------------------------------------

            case "waiting":

                if (
                    kneeAngle
                    >=
                    CONFIG.standingAngle
                ) {

                    this.setPhase(
                        "standing"
                    );


                    this.setMessage(
                        null
                    );

                }

                break;


            // ------------------------------------------------
            // EM PÉ
            // ------------------------------------------------

            case "standing":

                if (
                    descending
                    &&
                    kneeAngle
                    <
                    CONFIG.descendingAngle
                ) {

                    this.beginRep();


                    this.setPhase(
                        "descending"
                    );

                }

                break;


            // ------------------------------------------------
            // DESCENDO
            // ------------------------------------------------

            case "descending":

                if (
                    kneeAngle
                    <=
                    CONFIG.bottomAngle
                ) {

                    this.reachedBottom =
                        true;


                    this.setPhase(
                        "bottom"
                    );

                }

                else if (
                    ascending
                    &&
                    kneeAngle
                    >=
                    CONFIG.standingAngle
                ) {

                    this.cancelRep();


                    this.setPhase(
                        "standing"
                    );

                }

                break;


            // ------------------------------------------------
            // FUNDO
            // ------------------------------------------------

            case "bottom":

                if (
                    ascending
                    &&
                    kneeAngle
                    >
                    CONFIG.leavingBottomAngle
                ) {

                    this.setPhase(
                        "ascending"
                    );

                }

                break;


            // ------------------------------------------------
            // SUBINDO
            // ------------------------------------------------

            case "ascending":

                if (
                    kneeAngle
                    >=
                    CONFIG.standingAngle
                ) {

                    this.completeRep();


                    this.setPhase(
                        "standing"
                    );

                }

                else if (
                    descending
                    &&
                    kneeAngle
                    <=
                    CONFIG.bottomAngle
                ) {

                    this.setPhase(
                        "bottom"
                    );

                }

                break;


            default:

                this.setPhase(
                    "waiting"
                );

        }

    }


    // ======================================================
    // INÍCIO DA REPETIÇÃO
    // ======================================================

    beginRep() {

        this.repStartedAt =
            this.state.timestamp;


        this.reachedBottom =
            false;


        this.lowestKneeAngle =
            null;


        this.emit(
            "rep-start",
            {

                rep:
                    this.reps + 1

            }
        );

    }


    // ======================================================
    // CANCELAR REPETIÇÃO
    // ======================================================

    cancelRep() {

        this.repStartedAt =
            0;


        this.reachedBottom =
            false;


        this.lowestKneeAngle =
            null;


        this.emit(
            "rep-cancel"
        );

    }


    // ======================================================
    // COMPLETAR REPETIÇÃO
    // ======================================================

    completeRep() {

        const now =
            this.state.timestamp;


        if (
            !this.reachedBottom
            ||
            !this.repStartedAt
        ) {

            this.cancelRep();

            return;

        }


        const duration =
            now
            -
            this.repStartedAt;


        if (
            duration
            <
            CONFIG.minimumRepDuration
            ||
            duration
            >
            CONFIG.maximumRepDuration
        ) {

            this.cancelRep();

            return;

        }


        if (
            now
            -
            this.lastRepAt
            <
            CONFIG.repCooldown
        ) {

            return;

        }


        this.reps +=
            1;


        this.lastRepAt =
            now;


        this.setMetric(
            "reps",
            this.reps
        );


        this.setMetric(
            "repDuration",
            duration
        );


        this.emit(
            "rep-complete",
            {

                rep:
                    this.reps,

                duration,

                lowestKneeAngle:
                    this.lowestKneeAngle

            }
        );


        this.repStartedAt =
            0;


        this.reachedBottom =
            false;


        this.lowestKneeAngle =
            null;

    }


    // ======================================================
    // PROGRESSO VISUAL DO MOVIMENTO
    // ======================================================

    updateProgress(
        kneeAngle
    ) {

        const standing =
            CONFIG.standingAngle;


        const bottom =
            CONFIG.bottomAngle;


        const descendingProgress =
            clamp(
                (
                    standing
                    -
                    kneeAngle
                )
                /
                (
                    standing
                    -
                    bottom
                )
            );


        if (
            this.state.phase
            ===
            "ascending"
        ) {

            this.setProgress(
                1
                -
                descendingProgress
            );

            return;

        }


        if (
            this.state.phase
            ===
            "standing"
        ) {

            this.setProgress(
                0
            );

            return;

        }


        this.setProgress(
            descendingProgress
        );

    }


    // ======================================================
    // CORPO PERDIDO
    // ======================================================

    handleLostBody() {

        this.setConfidence(
            0
        );


        this.setPhase(
            "waiting"
        );


        this.setMessage(
            "body-not-detected"
        );


        this.repStartedAt =
            0;


        this.reachedBottom =
            false;


        this.previousKneeAngle =
            null;

    }

}


// ==========================================================
// INSTÂNCIA PRINCIPAL
// ==========================================================

export const fitaiSquatSkill =
    new SquatSkill();