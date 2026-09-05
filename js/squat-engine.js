// ==========================================================
// FITAI - SQUAT ENGINE V2
// Agachamento + Guia Kinect + Descrições
// ==========================================================


// ==========================================================
// CONFIGURAÇÃO DO MOTOR
// ==========================================================

const VISIBILITY_MIN = 0.52;

const STANDING_ANGLE = 158;
const DESCENDING_ANGLE = 152;
const BOTTOM_ANGLE = 108;
const LEAVING_BOTTOM_ANGLE = 116;


// ==========================================================
// ESTADO DO AGACHAMENTO
// ==========================================================

let state = null;


export function resetSquatEngine() {

    state = {

        phase:
            "waiting",

        reps:
            0,

        previousKneeAngle:
            null,

        reachedBottom:
            false,

        ready:
            false,

        lastRepAt:
            0,

        lastResult:
            null

    };

}


resetSquatEngine();


// ==========================================================
// UTILIDADES BIOMECÂNICAS
// ==========================================================

function pointVisible(point) {

    if (!point) {

        return false;

    }


    return (
        (point.visibility ?? 1)
        >=
        VISIBILITY_MIN
    );

}


function angleBetweenThreePoints(
    a,
    b,
    c
) {

    if (
        !a ||
        !b ||
        !c
    ) {

        return null;

    }


    const ab = {

        x:
            a.x - b.x,

        y:
            a.y - b.y

    };


    const cb = {

        x:
            c.x - b.x,

        y:
            c.y - b.y

    };


    const dot =
        ab.x * cb.x
        +
        ab.y * cb.y;


    const magnitudeAB =
        Math.sqrt(
            ab.x * ab.x
            +
            ab.y * ab.y
        );


    const magnitudeCB =
        Math.sqrt(
            cb.x * cb.x
            +
            cb.y * cb.y
        );


    if (
        magnitudeAB === 0 ||
        magnitudeCB === 0
    ) {

        return null;

    }


    let cosine =
        dot /
        (
            magnitudeAB *
            magnitudeCB
        );


    cosine =
        Math.max(
            -1,
            Math.min(
                1,
                cosine
            )
        );


    return (
        Math.acos(cosine)
        *
        180
        /
        Math.PI
    );

}


function torsoInclination(
    shoulderCenter,
    hipCenter
) {

    if (
        !shoulderCenter ||
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
            Math.abs(dx),
            Math.abs(dy)
        )
        *
        180
        /
        Math.PI
    );

}


function midpoint(
    a,
    b
) {

    return {

        x:
            (
                a.x +
                b.x
            )
            /
            2,

        y:
            (
                a.y +
                b.y
            )
            /
            2

    };

}


function averageVisibility(
    landmarks,
    indexes
) {

    let total =
        0;


    for (
        const index
        of indexes
    ) {

        total +=
            landmarks[index]
                ?.visibility
            ??
            0;

    }


    return (
        total /
        indexes.length
    );

}


// ==========================================================
// ENQUADRAMENTO
// ==========================================================

function analyzeFraming(
    landmarks
) {

    const required = [

        11,
        12,

        23,
        24,

        25,
        26,

        27,
        28

    ];


    const missing =
        required.filter(
            index =>
                !pointVisible(
                    landmarks[index]
                )
        );


    if (
        missing.length ===
        0
    ) {

        return {

            valid:
                true,

            message:
                "Corpo enquadrado"

        };

    }


    const anklesMissing =
        !pointVisible(
            landmarks[27]
        )
        ||
        !pointVisible(
            landmarks[28]
        );


    const kneesMissing =
        !pointVisible(
            landmarks[25]
        )
        ||
        !pointVisible(
            landmarks[26]
        );


    const shouldersMissing =
        !pointVisible(
            landmarks[11]
        )
        ||
        !pointVisible(
            landmarks[12]
        );


    if (
        anklesMissing
    ) {

        return {

            valid:
                false,

            message:
                "Afaste-se um pouco · mostre os pés"

        };

    }


    if (
        kneesMissing
    ) {

        return {

            valid:
                false,

            message:
                "Afaste-se · precisamos enxergar os joelhos"

        };

    }


    if (
        shouldersMissing
    ) {

        return {

            valid:
                false,

            message:
                "Centralize o tronco no enquadramento"

        };

    }


    return {

        valid:
            false,

        message:
            "Centralize o corpo"

    };

}


// ==========================================================
// ESCOLHA DO LADO
// ==========================================================

function chooseSide(
    landmarks
) {

    const leftVisibility =
        averageVisibility(
            landmarks,
            [
                11,
                23,
                25,
                27
            ]
        );


    const rightVisibility =
        averageVisibility(
            landmarks,
            [
                12,
                24,
                26,
                28
            ]
        );


    return (
        leftVisibility >=
        rightVisibility
    )
        ?
        "left"
        :
        "right";

}


// ==========================================================
// BIOMECÂNICA
// ==========================================================

function calculateBiomechanics(
    landmarks
) {

    const side =
        chooseSide(
            landmarks
        );


    const indexes =
        side ===
        "left"
            ?
            {

                shoulder:
                    11,

                hip:
                    23,

                knee:
                    25,

                ankle:
                    27

            }
            :
            {

                shoulder:
                    12,

                hip:
                    24,

                knee:
                    26,

                ankle:
                    28

            };


    const shoulder =
        landmarks[
            indexes.shoulder
        ];


    const hip =
        landmarks[
            indexes.hip
        ];


    const knee =
        landmarks[
            indexes.knee
        ];


    const ankle =
        landmarks[
            indexes.ankle
        ];


    const kneeAngle =
        angleBetweenThreePoints(
            hip,
            knee,
            ankle
        );


    const hipAngle =
        angleBetweenThreePoints(
            shoulder,
            hip,
            knee
        );


    const shoulderCenter =
        midpoint(
            landmarks[11],
            landmarks[12]
        );


    const hipCenter =
        midpoint(
            landmarks[23],
            landmarks[24]
        );


    const torsoAngle =
        torsoInclination(
            shoulderCenter,
            hipCenter
        );


    return {

        side,
        kneeAngle,
        hipAngle,
        torsoAngle

    };

}


// ==========================================================
// LABEL DAS FASES
// ==========================================================

function phaseLabel(
    phase
) {

    const labels = {

        waiting:
            "POSICIONE-SE",

        standing:
            "EM PÉ",

        descending:
            "DESCENDO",

        bottom:
            "FUNDO",

        ascending:
            "SUBINDO"

    };


    return (
        labels[phase]
        ||
        phase.toUpperCase()
    );

}


// ==========================================================
// FEEDBACK
// ==========================================================

function buildMessage(
    phase,
    kneeAngle,
    torsoAngle,
    repCompleted
) {

    if (
        repCompleted
    ) {

        return (
            "✓ Repetição concluída"
        );

    }


    if (
        phase ===
        "standing"
    ) {

        return (
            "Pronto · inicie o agachamento"
        );

    }


    if (
        phase ===
        "descending"
    ) {

        if (
            kneeAngle >
            120
        ) {

            return (
                "Desça com controle"
            );

        }


        return (
            "Continue descendo"
        );

    }


    if (
        phase ===
        "bottom"
    ) {

        return (
            "Boa profundidade · agora suba"
        );

    }


    if (
        phase ===
        "ascending"
    ) {

        if (
            kneeAngle <
            145
        ) {

            return (
                "Continue subindo"
            );

        }


        return (
            "Estenda até a posição inicial"
        );

    }


    if (
        torsoAngle >
        50
    ) {

        return (
            "Observe a inclinação do tronco"
        );

    }


    return (
        "Movimento detectado"
    );

}


// ==========================================================
// MOTOR PRINCIPAL DO AGACHAMENTO
// ==========================================================

export function analyzeSquat(
    landmarks,
    timestamp = performance.now()
) {

    if (
        !landmarks ||
        landmarks.length <
        29
    ) {

        return {

            valid:
                false,

            framing:
                false,

            phase:
                "waiting",

            phaseLabel:
                "CORPO NÃO DETECTADO",

            reps:
                state.reps,

            message:
                "Posicione o corpo na câmera"

        };

    }


    const framing =
        analyzeFraming(
            landmarks
        );


    if (
        !framing.valid
    ) {

        state.previousKneeAngle =
            null;


        const result = {

            valid:
                false,

            framing:
                false,

            phase:
                state.phase,

            phaseLabel:
                "AJUSTE O ENQUADRAMENTO",

            reps:
                state.reps,

            message:
                framing.message,

            kneeAngle:
                null,

            hipAngle:
                null,

            torsoAngle:
                null,

            repCompleted:
                false

        };


        state.lastResult =
            result;


        return result;

    }


    const biomechanics =
        calculateBiomechanics(
            landmarks
        );


    const kneeAngle =
        biomechanics.kneeAngle;


    const hipAngle =
        biomechanics.hipAngle;


    const torsoAngle =
        biomechanics.torsoAngle;


    if (
        kneeAngle ===
        null
        ||
        hipAngle ===
        null
        ||
        torsoAngle ===
        null
    ) {

        return {

            valid:
                false,

            framing:
                false,

            phase:
                state.phase,

            phaseLabel:
                "ANALISANDO",

            reps:
                state.reps,

            message:
                "Mantenha o corpo visível",

            repCompleted:
                false

        };

    }


    const previous =
        state.previousKneeAngle
        ??
        kneeAngle;


    const kneeVelocity =
        kneeAngle
        -
        previous;


    state.previousKneeAngle =
        kneeAngle;


    let repCompleted =
        false;


    // ======================================================
    // CALIBRAÇÃO INICIAL
    // ======================================================

    if (
        !state.ready
    ) {

        if (
            kneeAngle >=
            STANDING_ANGLE
        ) {

            state.ready =
                true;


            state.phase =
                "standing";

        }

        else {

            state.phase =
                "waiting";

        }

    }


    // ======================================================
    // EM PÉ
    // ======================================================

    else if (
        state.phase ===
        "standing"
    ) {

        if (
            kneeAngle <
            DESCENDING_ANGLE
            &&
            kneeVelocity <
            -.15
        ) {

            state.phase =
                "descending";


            state.reachedBottom =
                false;

        }

    }


    // ======================================================
    // DESCENDO
    // ======================================================

    else if (
        state.phase ===
        "descending"
    ) {

        if (
            kneeAngle <=
            BOTTOM_ANGLE
        ) {

            state.phase =
                "bottom";


            state.reachedBottom =
                true;

        }

        else if (
            kneeAngle >=
            STANDING_ANGLE
            &&
            kneeVelocity >
            0
        ) {

            state.phase =
                "standing";


            state.reachedBottom =
                false;

        }

    }


    // ======================================================
    // FUNDO
    // ======================================================

    else if (
        state.phase ===
        "bottom"
    ) {

        if (
            kneeAngle >
            LEAVING_BOTTOM_ANGLE
            &&
            kneeVelocity >
            .1
        ) {

            state.phase =
                "ascending";

        }

    }


    // ======================================================
    // SUBINDO
    // ======================================================

    else if (
        state.phase ===
        "ascending"
    ) {

        if (
            kneeAngle >=
            STANDING_ANGLE
        ) {

            state.phase =
                "standing";


            if (
                state.reachedBottom
                &&
                timestamp
                -
                state.lastRepAt
                >
                700
            ) {

                state.reps++;


                state.lastRepAt =
                    timestamp;


                repCompleted =
                    true;

            }


            state.reachedBottom =
                false;

        }

        else if (
            kneeAngle <=
            BOTTOM_ANGLE
        ) {

            state.phase =
                "bottom";

        }

    }


    const result = {

        valid:
            true,

        framing:
            true,

        side:
            biomechanics.side,

        phase:
            state.phase,

        phaseLabel:
            phaseLabel(
                state.phase
            ),

        reps:
            state.reps,

        kneeAngle:
            Math.round(
                kneeAngle
            ),

        hipAngle:
            Math.round(
                hipAngle
            ),

        torsoAngle:
            Math.round(
                torsoAngle
            ),

        kneeVelocity,

        repCompleted,

        message:
            buildMessage(
                state.phase,
                kneeAngle,
                torsoAngle,
                repCompleted
            )

    };


    state.lastResult =
        result;


    return result;

}


export function getSquatState() {

    return {
        ...state
    };

}
