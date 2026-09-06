// ==========================================================
// FITAI MOTION PLATFORM
// COACH ENGINE 1.0
//
// Responsabilidade:
// decidir qual orientação merece prioridade.
//
// Ele NÃO:
// - detecta o corpo
// - calcula movimento
// - mede desempenho
// - conhece regras específicas de cada exercício
//
// Ele recebe sinais dos outros módulos e escolhe
// o que vale a pena comunicar agora.
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


function now() {

    return performance.now();

}


// ==========================================================
// COACH ENGINE
// ==========================================================

export class CoachEngine {

    constructor(
        options = {}
    ) {

        this.options = {

            minimumConfidence:
                options.minimumConfidence
                ??
                0.50,

            repeatCooldown:
                options.repeatCooldown
                ??
                2500,

            globalCooldown:
                options.globalCooldown
                ??
                900,

            silenceAfterMessage:
                options.silenceAfterMessage
                ??
                500,

            lowConfidencePriority:
                options.lowConfidencePriority
                ??
                100

        };


        this.lastMessage =
            null;


        this.lastMessageAt =
            0;


        this.lastMessages =
            new Map();


        this.state =
            this.emptyState();

    }


    // ======================================================
    // UPDATE
    // ======================================================

    update(
        context = {}
    ) {

        const timestamp =
            context.timestamp
            ??
            now();


        const candidates =
            this.buildCandidates(
                context
            );


        const selected =
            this.selectCandidate(
                candidates,
                timestamp
            );


        if (
            !selected
        ) {

            this.state = {

                timestamp,

                active: false,

                message: null,

                code: null,

                type: "silence",

                priority: 0,

                source: null,

                candidates

            };


            return this.state;

        }


        this.registerMessage(
            selected,
            timestamp
        );


        this.state = {

            timestamp,

            active: true,

            message:
                selected.message,

            code:
                selected.code,

            type:
                selected.type
                ??
                "guidance",

            priority:
                selected.priority
                ??
                0,

            source:
                selected.source
                ??
                null,

            data:
                selected.data
                ??
                null,

            candidates

        };


        return this.state;

    }


    // ======================================================
    // CANDIDATOS
    // ======================================================

addSessionCandidates(
    candidates,
    context
) {

    const events =
        context.events
        ??
        [];


    if (
        !Array.isArray(
            events
        )
    ) {

        return;

    }


    for (
        const event
        of events
    ) {

        if (
            event.source
            !==
            "session"
        ) {

            continue;

        }


        if (
            event.type
            ===
            "set-complete"
        ) {

            candidates.push({

                code:
                    "session-set-complete",

                message:
                    "Série concluída",

                type:
                    "status",

                priority:
                    70,

                source:
                    "session",

                data:
                    event.data

            });

        }


        if (
            event.type
            ===
            "rest-start"
        ) {

            candidates.push({

                code:
                    "session-rest-start",

                message:
                    "Descanso iniciado",

                type:
                    "status",

                priority:
                    65,

                source:
                    "session",

                data:
                    event.data

            });

        }


        if (
            event.type
            ===
            "rest-complete"
        ) {

            candidates.push({

                code:
                    "session-rest-complete",

                message:
                    "Prepare-se",

                type:
                    "guidance",

                priority:
                    75,

                source:
                    "session",

                data:
                    event.data

            });

        }


        if (
            event.type
            ===
            "exercise-complete"
        ) {

            candidates.push({

                code:
                    "session-exercise-complete",

                message:
                    "Exercício concluído",

                type:
                    "status",

                priority:
                    80,

                source:
                    "session",

                data:
                    event.data

            });

        }


        if (
            event.type
            ===
            "session-complete"
        ) {

            candidates.push({

                code:
                    "session-complete",

                message:
                    "Treino concluído",

                type:
                    "status",

                priority:
                    100,

                source:
                    "session",

                data:
                    event.data

            });

        }

    }

}

 buildCandidates(
    context
) {

    const candidates =
        [];


    this.addSessionCandidates(
        candidates,
        context
    );


    this.addConfidenceCandidate(
        candidates,
        context
    );


    this.addSkillCandidate(
        candidates,
        context
    );


    this.addPerformanceCandidates(
        candidates,
        context
    );


    this.addReferenceCandidates(
        candidates,
        context
    );


    return candidates.sort(
        (
            a,
            b
        ) =>
            (
                b.priority
                ??
                0
            )
            -
            (
                a.priority
                ??
                0
            )
    );

}

    // ======================================================
    // CONFIDENCE
    // ======================================================

    addConfidenceCandidate(
        candidates,
        context
    ) {

        const confidence =
            context.confidence;


        if (
            !confidence
        ) {

            return;

        }


        const score =
            confidence.detectionScore
            ??
            confidence.overall
            ??
            0;


        if (
            confidence.detected
            &&
            score
            >=
            this.options.minimumConfidence
        ) {

            return;

        }


        candidates.push({

            code:
                "body-visibility-low",

            message:
                "Ajuste sua posição para eu acompanhar melhor o movimento.",

            type:
                "framing",

            priority:
                this.options
                    .lowConfidencePriority,

            source:
                "confidence",

            data: {

                score

            }

        });

    }


    // ======================================================
    // SKILL
    // ======================================================

    addSkillCandidate(
        candidates,
        context
    ) {

        const skill =
            context.skill;


        if (
            !skill
            ||
            !skill.message
        ) {

            return;

        }


        candidates.push({

            code:
                skill.code
                ??
                `skill-${skill.phase ?? "guidance"}`,

            message:
                skill.message,

            type:
                "skill",

            priority:
                skill.priority
                ??
                80,

            source:
                "skill",

            data: {

                phase:
                    skill.phase
                    ??
                    null,

                progress:
                    skill.progress
                    ??
                    null

            }

        });

    }


    // ======================================================
    // PERFORMANCE
    // ======================================================

    addPerformanceCandidates(
        candidates,
        context
    ) {

        const performanceState =
            context.performance;


        const performanceGuidance =
            context.skill
                ?.flags
                ?.performanceGuidance
            ??
            null;


        if (
            !performanceState
            ||
            !performanceState.valid
            ||
            !performanceGuidance
        ) {

            return;

        }


        const symmetry =
            performanceState.symmetry;


        if (
            performanceGuidance.symmetry
            ===
            true
            &&
            Number.isFinite(
                symmetry
            )
            &&
            symmetry
            <
            0.45
        ) {

            candidates.push({

                code:
                    "symmetry-low",

                message:
                    "Tente manter os dois lados do corpo mais equilibrados.",

                type:
                    "technique",

                priority:
                    45,

                source:
                    "performance",

                data: {

                    metric:
                        "symmetry",

                    score:
                        symmetry

                }

            });

        }


        const control =
            performanceState.control;


        if (
            performanceGuidance.control
            ===
            true
            &&
            Number.isFinite(
                control
            )
            &&
            control
            <
            0.40
        ) {

            candidates.push({

                code:
                    "control-low",

                message:
                    "Tente controlar melhor a velocidade do movimento.",

                type:
                    "technique",

                priority:
                    40,

                source:
                    "performance",

                data: {

                    metric:
                        "control",

                    score:
                        control

                }

            });

        }


        const stability =
            performanceState.stability;


        if (
            performanceGuidance.stability
            ===
            true
            &&
            Number.isFinite(
                stability
            )
            &&
            stability
            <
            0.35
        ) {

            candidates.push({

                code:
                    "stability-low",

                message:
                    "Busque mais estabilidade antes de continuar.",

                type:
                    "technique",

                priority:
                    42,

                source:
                    "performance",

                data: {

                    metric:
                        "stability",

                    score:
                        stability

                }

            });

        }

    }


    // ======================================================
    // REFERENCE
    // ======================================================

    addReferenceCandidates(
        candidates,
        context
    ) {

        const comparison =
            context.comparison;


        if (
            !comparison
            ||
            !comparison.valid
        ) {

            return;

        }


        const overall =
            comparison.summary
                ?.overallScore;


        if (
            Number.isFinite(
                overall
            )
            &&
            overall
            <
            0.35
        ) {

            candidates.push({

                code:
                    "reference-distance-high",

                message:
                    "Seu movimento está distante da referência neste momento.",

                type:
                    "reference",

                priority:
                    35,

                source:
                    "comparison",

                data: {

                    score:
                        overall

                }

            });

        }

    }


    // ======================================================
    // SELEÇÃO
    // ======================================================

    selectCandidate(
        candidates,
        timestamp
    ) {

        if (
            candidates.length
            ===
            0
        ) {

            return null;

        }


        if (
            timestamp
            -
            this.lastMessageAt
            <
            this.options.globalCooldown
        ) {

            return null;

        }


        for (
            const candidate
            of
            candidates
        ) {

            if (
                this.canSay(
                    candidate,
                    timestamp
                )
            ) {

                return candidate;

            }

        }


        return null;

    }


    // ======================================================
    // ANTI-SPAM
    // ======================================================

    canSay(
        candidate,
        timestamp
    ) {

        if (
            !candidate
            ||
            !candidate.code
            ||
            !candidate.message
        ) {

            return false;

        }


        const previousTime =
            this.lastMessages.get(
                candidate.code
            )
            ??
            -Infinity;


        if (
            timestamp
            -
            previousTime
            <
            this.options.repeatCooldown
        ) {

            return false;

        }


        return true;

    }


    registerMessage(
        candidate,
        timestamp
    ) {

        this.lastMessage =
            candidate;


        this.lastMessageAt =
            timestamp;


        this.lastMessages.set(
            candidate.code,
            timestamp
        );

    }


    // ======================================================
    // PRIORIDADE MANUAL
    //
    // Futuramente Skills poderão criar mensagens mais
    // específicas e enviar prioridade própria.
// ======================================================

    createCandidate(
        options = {}
    ) {

        return {

            code:
                options.code
                ??
                "coach-message",

            message:
                options.message
                ??
                "",

            type:
                options.type
                ??
                "guidance",

            priority:
                clamp(
                    Number(
                        options.priority
                        ??
                        50
                    ),
                    0,
                    100
                ),

            source:
                options.source
                ??
                "external",

            data:
                options.data
                ??
                null

        };

    }


    // ======================================================
    // STATE
    // ======================================================

    getState() {

        return this.state;

    }


    emptyState() {

        return {

            timestamp: 0,

            active: false,

            message: null,

            code: null,

            type: "silence",

            priority: 0,

            source: null,

            candidates: []

        };

    }


    // ======================================================
    // RESET
    // ======================================================

    reset() {

        this.lastMessage =
            null;


        this.lastMessageAt =
            0;


        this.lastMessages.clear();


        this.state =
            this.emptyState();

    }

}