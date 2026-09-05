// ==========================================================
// FITAI — WORKOUT V3
// Interface controller
// Não executa IA.
// Não executa nova inferência.
// Apenas organiza a tela de treino.
// ==========================================================


const workoutScreen =
    document.getElementById(
        "screen-workout"
    );


const workoutTitle =
    document.getElementById(
        "workout-title"
    );


const workoutSeries =
    document.getElementById(
        "workout-series"
    );


const workoutCounter =
    document.getElementById(
        "workout-counter"
    );


const workoutCounterLabel =
    document.getElementById(
        "workout-counter-label"
    );


const movementMessage =
    document.getElementById(
        "movement-message"
    );


const skipSeries =
    document.getElementById(
        "skip-series"
    );


const completeSeries =
    document.getElementById(
        "complete-series"
    );


const skipExercise =
    document.getElementById(
        "skip-exercise"
    );


const manualRep =
    document.getElementById(
        "manual-rep"
    );


function cleanExerciseTitle(
    value
) {

    if (
        !value
    ) {

        return "Exercício";

    }


    return value
        .replace(
            /\s+LIVRE$/i,
            ""
        )
        .replace(
            /\s+INTELIGENTE$/i,
            ""
        )
        .trim();

}


function normalizeSeriesText(
    value
) {

    if (
        !value
    ) {

        return "Série 1 de 1";

    }


    const match =
        value.match(
            /(\d+)\D+(\d+)/
        );


    if (
        !match
    ) {

        return value;

    }


    return (
        `Série ${match[1]} de ${match[2]}`
    );

}


function normalizeCounter(
    value
) {

    if (
        !value
    ) {

        return "0";

    }


    const text =
        value.trim();


    const match =
        text.match(
            /(\d+)\s*\/\s*(\d+)/
        );


    if (
        match
    ) {

        return match[1];

    }


    const number =
        text.match(
            /\d+/
        );


    return (
        number
            ?
            number[0]
            :
            text
    );

}


function classifyFeedback(
    text
) {

    const value =
        (
            text
            ??
            ""
        )
        .toLowerCase();


    if (
        value.includes(
            "bom"
        )
        ||
        value.includes(
            "ótimo"
        )
        ||
        value.includes(
            "correto"
        )
        ||
        value.includes(
            "mantenha"
        )
    ) {

        return "fitai-good";

    }


    if (
        value.includes(
            "ajuste"
        )
        ||
        value.includes(
            "desça"
        )
        ||
        value.includes(
            "suba"
        )
        ||
        value.includes(
            "aproxime"
        )
        ||
        value.includes(
            "afaste"
        )
    ) {

        return "fitai-warning";

    }


    if (
        value.includes(
            "erro"
        )
        ||
        value.includes(
            "pare"
        )
        ||
        value.includes(
            "incorreto"
        )
    ) {

        return "fitai-error";

    }


    return "";

}


function updateFeedbackState() {

    if (
        !movementMessage
    ) {

        return;

    }


    movementMessage
        .classList
        .remove(
            "fitai-good",
            "fitai-warning",
            "fitai-error"
        );


    const state =
        classifyFeedback(
            movementMessage.textContent
        );


    if (
        state
    ) {

        movementMessage
            .classList
            .add(
                state
            );

    }

}


function applyCleanLabels() {

    if (
        workoutTitle
    ) {

        workoutTitle.textContent =
            cleanExerciseTitle(
                workoutTitle.textContent
            );

    }


    if (
        workoutSeries
    ) {

        workoutSeries.textContent =
            normalizeSeriesText(
                workoutSeries.textContent
            );

    }


    if (
        workoutCounter
    ) {

        workoutCounter.textContent =
            normalizeCounter(
                workoutCounter.textContent
            );

    }


    if (
        workoutCounterLabel
    ) {

        workoutCounterLabel.textContent =
            "REPETIÇÕES";

    }


    if (
        skipSeries
    ) {

        skipSeries.textContent =
            "Pular";

    }


    updateFeedbackState();

}


function hideLegacyControls() {

    if (
        completeSeries
    ) {

        completeSeries.style.display =
            "none";

    }


    if (
        skipExercise
    ) {

        skipExercise.style.display =
            "none";

    }


    if (
        manualRep
    ) {

        manualRep.style.display =
            "none";

    }

}


function isLegacyHudText(
    element
) {

    if (
        !element
        ||
        element === movementMessage
        ||
        element === workoutTitle
        ||
        element === workoutSeries
        ||
        element === workoutCounter
        ||
        element === workoutCounterLabel
    ) {

        return false;

    }


    const text =
        (
            element.textContent
            ??
            ""
        )
        .trim()
        .toUpperCase();


    if (
        !text
    ) {

        return false;

    }


    const legacyTexts = [

        "BIOMECÂNICA",
        "BIOMECANICA",

        "TEMPO TOTAL",

        "JOELHO",

        "QUADRIL",

        "TRONCO"

    ];


    return legacyTexts.some(
        (
            item
        ) =>
            text === item
    );

}


function removeLegacyHud() {

    if (
        !workoutScreen
    ) {

        return;

    }


    const elements =
        workoutScreen
            .querySelectorAll(
                "div, span, small, strong, section, aside"
            );


    for (
        const element
        of
        elements
    ) {

        if (
            isLegacyHudText(
                element
            )
        ) {

            const parent =
                element.parentElement;


            if (
                parent
                &&
                parent !== workoutScreen
                &&
                !parent.classList.contains(
                    "workout-header"
                )
                &&
                !parent.classList.contains(
                    "workout-counter-area"
                )
            ) {

                parent.style.display =
                    "none";

            } else {

                element.style.display =
                    "none";

            }

        }

    }

}


function refreshWorkoutUi() {

    applyCleanLabels();

    hideLegacyControls();

    removeLegacyHud();

}


if (
    workoutScreen
) {

    const observer =
        new MutationObserver(
            () => {

                refreshWorkoutUi();

            }
        );


    observer.observe(
        workoutScreen,
        {
            childList:
                true,

            subtree:
                true,

            characterData:
                true
        }
    );

}


refreshWorkoutUi();


// ==========================================================
// API FUTURA
// ==========================================================

window.FitAIWorkoutUI = {

    setFeedback(
        text,
        state = ""
    ) {

        if (
            !movementMessage
        ) {

            return;

        }


        movementMessage.textContent =
            text;


        movementMessage
            .classList
            .remove(
                "fitai-good",
                "fitai-warning",
                "fitai-error"
            );


        if (
            state === "good"
        ) {

            movementMessage
                .classList
                .add(
                    "fitai-good"
                );

        }


        if (
            state === "warning"
        ) {

            movementMessage
                .classList
                .add(
                    "fitai-warning"
                );

        }


        if (
            state === "error"
        ) {

            movementMessage
                .classList
                .add(
                    "fitai-error"
                );

        }

    },


    setCounter(
        value
    ) {

        if (
            workoutCounter
        ) {

            workoutCounter.textContent =
                String(
                    value
                );

        }

    },


    setExercise(
        name
    ) {

        if (
            workoutTitle
        ) {

            workoutTitle.textContent =
                cleanExerciseTitle(
                    name
                );

        }

    },


    setSeries(
        current,
        total
    ) {

        if (
            workoutSeries
        ) {

            workoutSeries.textContent =
                `Série ${current} de ${total}`;

        }

    }

};