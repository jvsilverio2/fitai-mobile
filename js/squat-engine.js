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
// DESCRIÇÕES DOS EXERCÍCIOS
// ==========================================================

const EXERCISE_INFO = {

    "Agachamento livre": {

        description:
            "Fortalece principalmente quadríceps, glúteos e a musculatura estabilizadora do tronco. Inicie em pé, com os pés aproximadamente na largura dos ombros. Flexione quadris e joelhos de forma controlada e retorne à posição inicial.",

        execution:
            "Desça de forma controlada, mantenha os pés apoiados no chão e retorne completamente à posição em pé.",

        observes:
            "Joelho · Quadril · Inclinação do tronco",

        framing:
            "Posicione-se de forma que ombros, quadril, joelhos e pés apareçam na câmera.",

        guide:
            true

    },

    "Pulo": {

        description:
            "Movimento explosivo de corpo inteiro utilizado para trabalhar potência, coordenação e condicionamento.",

        execution:
            "Inicie em posição estável, realize a impulsão e retorne ao solo com controle.",

        observes:
            "Corpo inteiro · Deslocamento · Ritmo",

        framing:
            "Mantenha todo o corpo visível, incluindo cabeça e pés.",

        guide:
            false

    },

    "Postura neutra": {

        description:
            "Posição corporal utilizada como referência para alinhamento e controle do corpo.",

        execution:
            "Permaneça de pé em posição confortável e estável, mantendo o corpo dentro do enquadramento.",

        observes:
            "Ombros · Quadril · Alinhamento corporal",

        framing:
            "Mantenha o corpo inteiro centralizado na câmera.",

        guide:
            false

    },

    "Polichinelo": {

        description:
            "Exercício dinâmico de corpo inteiro que combina abertura das pernas e elevação dos braços.",

        execution:
            "Abra pernas e braços simultaneamente e depois retorne à posição inicial de forma contínua.",

        observes:
            "Braços · Pernas · Cadência",

        framing:
            "Afaste-se o suficiente para que mãos e pés permaneçam visíveis durante todo o movimento.",

        guide:
            false

    }

};


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


// ==========================================================
// GUIA VISUAL FITAI
// ==========================================================

const GUIDE_STORAGE =
    "fitai_squat_slow_guide_seen_v1";


let guideRunning =
    false;


let guideFrame =
    null;


let bypassNextWorkoutClick =
    false;


let detailObserver =
    null;


// ==========================================================
// CSS DO GUIA
// ==========================================================

function injectGuideStyles() {

    if (
        document.getElementById(
            "fitai-guide-style"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "fitai-guide-style";


    style.textContent = `

        .fitai-exercise-description {
            margin: 16px 0 18px;
            display: grid;
            gap: 9px;
        }

        .fitai-description-main {
            padding: 15px;
            border: 1px solid rgba(255,255,255,.07);
            border-radius: 15px;
            background: #111;
        }

        .fitai-description-main small,
        .fitai-info-box small {
            display: block;
            margin-bottom: 6px;
            color: #f3e600;
            font-size: 7px;
            font-weight: 900;
            letter-spacing: 1px;
        }

        .fitai-description-main p,
        .fitai-info-box p {
            margin: 0;
            color: rgba(255,255,255,.74);
            font-size: 11px;
            line-height: 1.55;
        }

        .fitai-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .fitai-info-box {
            min-width: 0;
            padding: 13px;
            border: 1px solid rgba(255,255,255,.06);
            border-radius: 14px;
            background: #0f0f0f;
        }

        .fitai-guide-button {
            width: 100%;
            min-height: 48px;
            margin-top: 2px;
            border: 1px solid rgba(243,230,0,.25);
            border-radius: 13px;
            background: rgba(243,230,0,.055);
            color: #f3e600;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: .7px;
        }

        .fitai-guide-button:active {
            transform: scale(.98);
        }

        .fitai-guide-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            background:
                radial-gradient(
                    circle at 50% 42%,
                    rgba(243,230,0,.055),
                    transparent 36%
                ),
                #070707;
            color: white;
        }

        .fitai-guide-overlay.hidden {
            display: none;
        }

        .fitai-guide-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            padding:
                calc(16px + env(safe-area-inset-top))
                18px
                12px;
        }

        .fitai-guide-header small {
            display: block;
            color: #f3e600;
            font-size: 7px;
            font-weight: 900;
            letter-spacing: 1.4px;
        }

        .fitai-guide-header h2 {
            margin: 4px 0 0;
            font-size: 17px;
        }

        .fitai-guide-close {
            width: 44px;
            height: 44px;
            flex: 0 0 44px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,.1);
            background: rgba(255,255,255,.055);
            color: white;
            font-size: 18px;
        }

        .fitai-guide-stage {
            position: relative;
            flex: 1;
            min-height: 0;
            margin: 0 14px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,.06);
            border-radius: 22px;
            background:
                linear-gradient(
                    rgba(255,255,255,.018) 1px,
                    transparent 1px
                ),
                linear-gradient(
                    90deg,
                    rgba(255,255,255,.018) 1px,
                    transparent 1px
                ),
                #0b0b0b;
            background-size: 34px 34px;
        }

        #fitai-guide-canvas {
            width: 100%;
            height: 100%;
            display: block;
        }

        .fitai-guide-phase {
            position: absolute;
            left: 50%;
            top: 16px;
            transform: translateX(-50%);
            min-width: 142px;
            padding: 9px 14px;
            border: 1px solid rgba(243,230,0,.22);
            border-radius: 100px;
            background: rgba(7,7,7,.74);
            color: #f3e600;
            text-align: center;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: .8px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .fitai-guide-instruction {
            position: absolute;
            left: 50%;
            bottom: 18px;
            width: calc(100% - 30px);
            transform: translateX(-50%);
            padding: 12px;
            border: 1px solid rgba(255,255,255,.07);
            border-radius: 13px;
            background: rgba(7,7,7,.74);
            color: rgba(255,255,255,.78);
            text-align: center;
            font-size: 10px;
            line-height: 1.4;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .fitai-guide-progress {
            height: 3px;
            margin: 13px 18px 0;
            overflow: hidden;
            border-radius: 20px;
            background: rgba(255,255,255,.07);
        }

        .fitai-guide-progress div {
            width: 0%;
            height: 100%;
            border-radius: inherit;
            background: #f3e600;
        }

        .fitai-guide-footer {
            padding:
                13px
                18px
                calc(16px + env(safe-area-inset-bottom));
        }

        .fitai-guide-footer p {
            margin: 0 0 10px;
            color: rgba(255,255,255,.55);
            font-size: 9px;
            text-align: center;
        }

        .fitai-guide-start {
            width: 100%;
            min-height: 52px;
            border: 0;
            border-radius: 14px;
            background: #f3e600;
            color: #050505;
            font-size: 10px;
            font-weight: 950;
            letter-spacing: .7px;
        }

        @media (max-width: 360px) {
            .fitai-info-grid {
                grid-template-columns: 1fr;
            }
        }

    `;


    document.head.appendChild(
        style
    );

}


// ==========================================================
// DESCRIÇÃO NA TELA DO EXERCÍCIO
// ==========================================================

function updateExerciseDescription() {

    const title =
        document.getElementById(
            "detail-title"
        );


    if (
        !title
    ) {

        return;

    }


    const info =
        EXERCISE_INFO[
            title.textContent.trim()
        ];


    if (
        !info
    ) {

        return;

    }


    let panel =
        document.getElementById(
            "fitai-exercise-description"
        );


    if (
        !panel
    ) {

        panel =
            document.createElement(
                "section"
            );


        panel.id =
            "fitai-exercise-description";


        panel.className =
            "fitai-exercise-description";


        const analysis =
            document.querySelector(
                ".analysis-card"
            );


        if (
            analysis
        ) {

            analysis.insertAdjacentElement(
                "afterend",
                panel
            );

        }

        else {

            title.parentElement
                ?.appendChild(
                    panel
                );

        }

    }


    panel.innerHTML = `

        <div class="fitai-description-main">

            <small>
                SOBRE O EXERCÍCIO
            </small>

            <p>
                ${info.description}
            </p>

        </div>

        <div class="fitai-info-grid">

            <div class="fitai-info-box">

                <small>
                    COMO EXECUTAR
                </small>

                <p>
                    ${info.execution}
                </p>

            </div>

            <div class="fitai-info-box">

                <small>
                    O FITAI OBSERVA
                </small>

                <p>
                    ${info.observes}
                </p>

            </div>

        </div>

        <div class="fitai-info-box">

            <small>
                ENQUADRAMENTO
            </small>

            <p>
                ${info.framing}
            </p>

        </div>

        ${
            info.guide
                ?
                `

                <button
                    id="fitai-open-slow-guide"
                    class="fitai-guide-button"
                    type="button"
                >
                    ▶ VER GUIA LENTO
                </button>

                `
                :
                ""
        }

    `;


    const guideButton =
        document.getElementById(
            "fitai-open-slow-guide"
        );


    if (
        guideButton
    ) {

        guideButton.onclick =
            () => {

                openSlowGuide(
                    false
                );

            };

    }

}


// ==========================================================
// OBSERVADOR DA TELA
// ==========================================================

function watchExerciseScreen() {

    const title =
        document.getElementById(
            "detail-title"
        );


    if (
        !title
    ) {

        return;

    }


    if (
        detailObserver
    ) {

        detailObserver.disconnect();

    }


    detailObserver =
        new MutationObserver(
            () => {

                updateExerciseDescription();

            }
        );


    detailObserver.observe(
        title,
        {
            childList:
                true,

            subtree:
                true,

            characterData:
                true
        }
    );


    updateExerciseDescription();

}


// ==========================================================
// KEYFRAMES DO ESQUELETO
// ==========================================================

const SQUAT_POSES = {

    standing: {

        head:
            [0.50, 0.13],

        neck:
            [0.50, 0.19],

        shoulderL:
            [0.44, 0.23],

        shoulderR:
            [0.56, 0.23],

        elbowL:
            [0.42, 0.35],

        elbowR:
            [0.58, 0.35],

        wristL:
            [0.43, 0.46],

        wristR:
            [0.57, 0.46],

        hipL:
            [0.46, 0.47],

        hipR:
            [0.54, 0.47],

        kneeL:
            [0.45, 0.66],

        kneeR:
            [0.55, 0.66],

        ankleL:
            [0.43, 0.86],

        ankleR:
            [0.57, 0.86]

    },


    middle: {

        head:
            [0.55, 0.19],

        neck:
            [0.54, 0.25],

        shoulderL:
            [0.48, 0.29],

        shoulderR:
            [0.60, 0.29],

        elbowL:
            [0.53, 0.33],

        elbowR:
            [0.65, 0.33],

        wristL:
            [0.65, 0.34],

        wristR:
            [0.77, 0.34],

        hipL:
            [0.45, 0.51],

        hipR:
            [0.53, 0.51],

        kneeL:
            [0.52, 0.66],

        kneeR:
            [0.61, 0.66],

        ankleL:
            [0.43, 0.86],

        ankleR:
            [0.57, 0.86]

    },


    bottom: {

        head:
            [0.60, 0.28],

        neck:
            [0.58, 0.34],

        shoulderL:
            [0.51, 0.37],

        shoulderR:
            [0.63, 0.37],

        elbowL:
            [0.59, 0.40],

        elbowR:
            [0.70, 0.40],

        wristL:
            [0.72, 0.40],

        wristR:
            [0.83, 0.40],

        hipL:
            [0.43, 0.58],

        hipR:
            [0.51, 0.58],

        kneeL:
            [0.56, 0.67],

        kneeR:
            [0.65, 0.67],

        ankleL:
            [0.43, 0.86],

        ankleR:
            [0.57, 0.86]

    }

};


// ==========================================================
// INTERPOLAÇÃO
// ==========================================================

function smoothStep(value) {

    const t =
        Math.max(
            0,
            Math.min(
                1,
                value
            )
        );


    return (
        t * t *
        (
            3 -
            2 * t
        )
    );

}


function mix(
    a,
    b,
    t
) {

    return (
        a +
        (
            b - a
        )
        *
        t
    );

}


function interpolatePose(
    poseA,
    poseB,
    t
) {

    const result =
        {};


    const eased =
        smoothStep(
            t
        );


    Object.keys(
        poseA
    )
    .forEach(
        key => {

            result[key] = [

                mix(
                    poseA[key][0],
                    poseB[key][0],
                    eased
                ),

                mix(
                    poseA[key][1],
                    poseB[key][1],
                    eased
                )

            ];

        }
    );


    return result;

}


// ==========================================================
// FASE DO GUIA
// ==========================================================

function getGuidePose(
    elapsed
) {

    /*
        Total aproximado: 12 segundos

        0 - 2s
        parado em pé

        2 - 5s
        descida lenta

        5 - 7s
        pausa no fundo

        7 - 10s
        subida lenta

        10 - 12s
        parado em pé
    */


    if (
        elapsed <
        2000
    ) {

        return {

            pose:
                SQUAT_POSES.standing,

            phase:
                "EM PÉ",

            instruction:
                "Observe a posição inicial e prepare os pés.",

            progress:
                elapsed / 12000

        };

    }


    if (
        elapsed <
        3500
    ) {

        const t =
            (
                elapsed -
                2000
            )
            /
            1500;


        return {

            pose:
                interpolatePose(
                    SQUAT_POSES.standing,
                    SQUAT_POSES.middle,
                    t
                ),

            phase:
                "DESCENDO",

            instruction:
                "Inicie a descida devagar, flexionando quadril e joelhos.",

            progress:
                elapsed / 12000

        };

    }


    if (
        elapsed <
        5000
    ) {

        const t =
            (
                elapsed -
                3500
            )
            /
            1500;


        return {

            pose:
                interpolatePose(
                    SQUAT_POSES.middle,
                    SQUAT_POSES.bottom,
                    t
                ),

            phase:
                "DESCENDO",

            instruction:
                "Continue descendo com controle.",

            progress:
                elapsed / 12000

        };

    }


    if (
        elapsed <
        7000
    ) {

        return {

            pose:
                SQUAT_POSES.bottom,

            phase:
                "FUNDO",

            instruction:
                "Pause nesta posição e observe joelhos, quadril e tronco.",

            progress:
                elapsed / 12000

        };

    }


    if (
        elapsed <
        8500
    ) {

        const t =
            (
                elapsed -
                7000
            )
            /
            1500;


        return {

            pose:
                interpolatePose(
                    SQUAT_POSES.bottom,
                    SQUAT_POSES.middle,
                    t
                ),

            phase:
                "SUBINDO",

            instruction:
                "Comece a subir mantendo o movimento controlado.",

            progress:
                elapsed / 12000

        };

    }


    if (
        elapsed <
        10000
    ) {

        const t =
            (
                elapsed -
                8500
            )
            /
            1500;


        return {

            pose:
                interpolatePose(
                    SQUAT_POSES.middle,
                    SQUAT_POSES.standing,
                    t
                ),

            phase:
                "SUBINDO",

            instruction:
                "Retorne completamente à posição inicial.",

            progress:
                elapsed / 12000

        };

    }


    return {

        pose:
            SQUAT_POSES.standing,

        phase:
            "EM PÉ",

        instruction:
            "Execução concluída. Agora é com você.",

        progress:
            Math.min(
                1,
                elapsed / 12000
            )

    };

}


// ==========================================================
// DESENHO KINECT
// ==========================================================

const GUIDE_CONNECTIONS = [

    ["neck", "head"],

    ["shoulderL", "shoulderR"],

    ["shoulderL", "elbowL"],
    ["elbowL", "wristL"],

    ["shoulderR", "elbowR"],
    ["elbowR", "wristR"],

    ["shoulderL", "hipL"],
    ["shoulderR", "hipR"],

    ["hipL", "hipR"],

    ["hipL", "kneeL"],
    ["kneeL", "ankleL"],

    ["hipR", "kneeR"],
    ["kneeR", "ankleR"]

];


function drawKinectSkeleton(
    context,
    width,
    height,
    pose
) {

    context.clearRect(
        0,
        0,
        width,
        height
    );


    const points =
        {};


    Object.entries(
        pose
    )
    .forEach(
        (
            [
                key,
                value
            ]
        ) => {

            points[key] = {

                x:
                    value[0] *
                    width,

                y:
                    value[1] *
                    height

            };

        }
    );


    context.save();


    context.lineCap =
        "round";


    context.lineJoin =
        "round";


    context.shadowBlur =
        18;


    context.shadowColor =
        "rgba(243,230,0,.20)";


    GUIDE_CONNECTIONS
        .forEach(
            (
                [
                    a,
                    b
                ]
            ) => {

                const start =
                    points[a];


                const end =
                    points[b];


                context.beginPath();


                context.moveTo(
                    start.x,
                    start.y
                );


                context.lineTo(
                    end.x,
                    end.y
                );


                context.strokeStyle =
                    "rgba(243,230,0,.86)";


                context.lineWidth =
                    4;


                context.stroke();

            }
        );


    const joints = [

        "shoulderL",
        "shoulderR",

        "elbowL",
        "elbowR",

        "wristL",
        "wristR",

        "hipL",
        "hipR",

        "kneeL",
        "kneeR",

        "ankleL",
        "ankleR"

    ];


    joints.forEach(
        key => {

            const point =
                points[key];


            context.beginPath();


            context.arc(
                point.x,
                point.y,
                6,
                0,
                Math.PI * 2
            );


            context.fillStyle =
                "#f3e600";


            context.fill();


            context.beginPath();


            context.arc(
                point.x,
                point.y,
                10,
                0,
                Math.PI * 2
            );


            context.strokeStyle =
                "rgba(243,230,0,.22)";


            context.lineWidth =
                2;


            context.stroke();

        }
    );


    const head =
        points.head;


    context.beginPath();


    context.arc(
        head.x,
        head.y,
        Math.min(
            width,
            height
        ) *
        .035,
        0,
        Math.PI * 2
    );


    context.strokeStyle =
        "#f3e600";


    context.lineWidth =
        4;


    context.stroke();


    context.restore();

}


// ==========================================================
// CRIA OVERLAY
// ==========================================================

function ensureGuideOverlay() {

    let overlay =
        document.getElementById(
            "fitai-slow-guide"
        );


    if (
        overlay
    ) {

        return overlay;

    }


    overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "fitai-slow-guide";


    overlay.className =
        "fitai-guide-overlay hidden";


    overlay.innerHTML = `

        <div class="fitai-guide-header">

            <div>

                <small>
                    FITAI · GUIA DE PRIMEIRA EXECUÇÃO
                </small>

                <h2>
                    Agachamento livre
                </h2>

            </div>

            <button
                id="fitai-guide-close"
                class="fitai-guide-close"
                type="button"
                aria-label="Fechar guia"
            >
                ×
            </button>

        </div>


        <div class="fitai-guide-stage">

            <canvas
                id="fitai-guide-canvas"
            ></canvas>

            <div
                id="fitai-guide-phase"
                class="fitai-guide-phase"
            >
                EM PÉ
            </div>

            <div
                id="fitai-guide-instruction"
                class="fitai-guide-instruction"
            >
                Observe a posição inicial.
            </div>

        </div>


        <div class="fitai-guide-progress">

            <div
                id="fitai-guide-progress-bar"
            ></div>

        </div>


        <div class="fitai-guide-footer">

            <p>
                Execute junto com o esqueleto amarelo. Esta repetição é apenas um guia.
            </p>

            <button
                id="fitai-guide-start"
                class="fitai-guide-start"
                type="button"
            >
                PULAR GUIA E COMEÇAR
            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    document
        .getElementById(
            "fitai-guide-close"
        )
        .onclick =
            () => {

                finishSlowGuide(
                    false
                );

            };


    document
        .getElementById(
            "fitai-guide-start"
        )
        .onclick =
            () => {

                finishSlowGuide(
                    true
                );

            };


    return overlay;

}


// ==========================================================
// ABRIR GUIA
// ==========================================================

function openSlowGuide(
    autoStartWorkout = false
) {

    if (
        guideRunning
    ) {

        return;

    }


    const overlay =
        ensureGuideOverlay();


    overlay.classList.remove(
        "hidden"
    );


    guideRunning =
        true;


    document.body.style.overflow =
        "hidden";


    const canvas =
        document.getElementById(
            "fitai-guide-canvas"
        );


    const context =
        canvas.getContext(
            "2d"
        );


    const stage =
        canvas.parentElement;


    const rect =
        stage.getBoundingClientRect();


    const dpr =
        window.devicePixelRatio
        ||
        1;


    canvas.width =
        Math.round(
            rect.width *
            dpr
        );


    canvas.height =
        Math.round(
            rect.height *
            dpr
        );


    canvas.style.width =
        `${rect.width}px`;


    canvas.style.height =
        `${rect.height}px`;


    context.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    const startedAt =
        performance.now();


    const totalDuration =
        12000;


    const animate =
        timestamp => {

            if (
                !guideRunning
            ) {

                return;

            }


            const elapsed =
                timestamp -
                startedAt;


            const guide =
                getGuidePose(
                    elapsed
                );


            drawKinectSkeleton(
                context,
                rect.width,
                rect.height,
                guide.pose
            );


            document
                .getElementById(
                    "fitai-guide-phase"
                )
                .textContent =
                    guide.phase;


            document
                .getElementById(
                    "fitai-guide-instruction"
                )
                .textContent =
                    guide.instruction;


            document
                .getElementById(
                    "fitai-guide-progress-bar"
                )
                .style
                .width =
                    `${
                        Math.min(
                            100,
                            guide.progress *
                            100
                        )
                    }%`;


            if (
                elapsed >=
                totalDuration
            ) {

                localStorage.setItem(
                    GUIDE_STORAGE,
                    "true"
                );


                const button =
                    document.getElementById(
                        "fitai-guide-start"
                    );


                button.textContent =
                    autoStartWorkout
                        ?
                        "COMEÇANDO..."
                        :
                        "COMEÇAR TREINO";


                if (
                    autoStartWorkout
                ) {

                    setTimeout(
                        () => {

                            finishSlowGuide(
                                true
                            );

                        },
                        900
                    );

                }


                return;

            }


            guideFrame =
                requestAnimationFrame(
                    animate
                );

        };


    guideFrame =
        requestAnimationFrame(
            animate
        );

}


// ==========================================================
// FECHAR GUIA
// ==========================================================

function finishSlowGuide(
    startWorkout
) {

    guideRunning =
        false;


    cancelAnimationFrame(
        guideFrame
    );


    document
        .getElementById(
            "fitai-slow-guide"
        )
        ?.classList
        .add(
            "hidden"
        );


    document.body.style.overflow =
        "";


    localStorage.setItem(
        GUIDE_STORAGE,
        "true"
    );


    if (
        startWorkout
    ) {

        bypassNextWorkoutClick =
            true;


        document
            .getElementById(
                "begin-workout"
            )
            ?.click();

    }

}


// ==========================================================
// PRIMEIRA EXECUÇÃO AUTOMÁTICA
// ==========================================================

function setupFirstExecutionGuide() {

    const button =
        document.getElementById(
            "begin-workout"
        );


    if (
        !button
    ) {

        return;

    }


    button.addEventListener(
        "click",
        event => {

            if (
                bypassNextWorkoutClick
            ) {

                bypassNextWorkoutClick =
                    false;


                return;

            }


            const exerciseTitle =
                document
                    .getElementById(
                        "config-title"
                    )
                    ?.textContent
                    ?.trim();


            if (
                exerciseTitle !==
                "Agachamento livre"
            ) {

                return;

            }


            const alreadySeen =
                localStorage.getItem(
                    GUIDE_STORAGE
                )
                ===
                "true";


            if (
                alreadySeen
            ) {

                return;

            }


            event.preventDefault();

            event.stopImmediatePropagation();


            openSlowGuide(
                true
            );

        },
        true
    );

}


// ==========================================================
// INICIALIZAÇÃO DO MÓDULO VISUAL
// ==========================================================

function initializeGuideUI() {

    injectGuideStyles();

    ensureGuideOverlay();

    watchExerciseScreen();

    setupFirstExecutionGuide();

}


// esperamos o app.js terminar de registrar os elementos e eventos

setTimeout(
    initializeGuideUI,
    0
);