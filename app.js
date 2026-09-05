import {
    FilesetResolver,
    PoseLandmarker
}
from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm";


import {
    STORAGE,
    loadJSON,
    saveJSON
}
from "./js/storage.js";


import {
    loadRoutines,
    saveRoutines as persistRoutines,
    createRoutine,
    createGroup,
    createRoutineExercise,
    estimateGroupSeconds,
    formatEstimatedTime,
    formatRoutineExercise
}
from "./js/routines.js";


import {
    resetSquatEngine,
    analyzeSquat
}
from "./js/squat-engine.js";


// ==========================================================
// FITAI
// POLISH + SMART SQUAT + CONTROLLED TIMER + VISUAL PREVIEW
// ==========================================================


// ==========================================================
// CSS DE POLIMENTO
// ==========================================================

function loadPolishStyles() {

    if (
        document.getElementById(
            "fitai-polish-css"
        )
    ) {

        return;

    }


    const link =
        document.createElement(
            "link"
        );


    link.id =
        "fitai-polish-css";


    link.rel =
        "stylesheet";


    link.href =
        "./js/polish.css";


    document.head.appendChild(
        link
    );

}


loadPolishStyles();


// ==========================================================
// EXERCÍCIOS
// ==========================================================

const officialExercises = {

    agachamento: {

        id:
            "agachamento",

        name:
            "Agachamento livre",

        muscles:
            "Pernas · Glúteos",

        badge:
            "FITAI BIOMECHANICS",

        symbol:
            "◇",

        motion:
            "squat",

        intelligent:
            true,

        popularity:
            87000,

        createdAt:
            10

    },


    pulo: {

        id:
            "pulo",

        name:
            "Pulo",

        muscles:
            "Corpo inteiro · Cardio",

        badge:
            "FITAI MOTION",

        symbol:
            "↑",

        motion:
            "jump",

        intelligent:
            false,

        popularity:
            32000,

        createdAt:
            4

    },


    postura: {

        id:
            "postura",

        name:
            "Postura neutra",

        muscles:
            "Corpo inteiro",

        badge:
            "OFICIAL FITAI",

        symbol:
            "◇",

        motion:
            "static",

        intelligent:
            false,

        popularity:
            19000,

        createdAt:
            2

    },


    polichinelo: {

        id:
            "polichinelo",

        name:
            "Polichinelo",

        muscles:
            "Corpo inteiro · Cardio",

        badge:
            "OFICIAL FITAI",

        symbol:
            "◇",

        motion:
            "static",

        intelligent:
            false,

        popularity:
            54000,

        createdAt:
            3

    }

};


// ==========================================================
// ESTADO
// ==========================================================

let account =
    loadJSON(
        STORAGE.account,
        null
    );


let favorites =
    loadJSON(
        STORAGE.favorites,
        []
    );


let createdExercises =
    loadJSON(
        STORAGE.createdExercises,
        []
    );


let routines =
    loadRoutines();


let settings =
    loadJSON(
        STORAGE.settings,
        {

            sound:
                true,

            vibration:
                true,

            countdown:
                true,

            skeleton:
                true,

            reference:
                true,

            mirror:
                true,

            history:
                true,

            community:
                false,

            hudCounter:
                true,

            hudSeries:
                true,

            hudMessage:
                true,

            hudTime:
                true,

            hudPositions: {

                counter: {
                    x: 50,
                    y: 19
                },

                series: {
                    x: 50,
                    y: 11
                },

                message: {
                    x: 50,
                    y: 72
                },

                time: {
                    x: 84,
                    y: 19
                }

            }

        }
    );


if (
    !settings.hudPositions
) {

    settings.hudPositions = {

        counter: {
            x: 50,
            y: 19
        },

        series: {
            x: 50,
            y: 11
        },

        message: {
            x: 50,
            y: 72
        },

        time: {
            x: 84,
            y: 19
        }

    };

}


let selectedExercise =
    officialExercises.agachamento;


let currentExploreFilter =
    "foryou";


let screenHistory =
    [];


// ==========================================================
// UTIL
// ==========================================================

function escapeHtml(value) {

    return String(
        value
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function getAllExercises() {

    return [

        ...Object.values(
            officialExercises
        ),

        ...createdExercises

    ];

}


function getExerciseById(id) {

    return getAllExercises()
        .find(
            exercise =>
                exercise.id ===
                id
        );

}


function generateAnonymousName() {

    return (
        "FitUser"
        +
        Math.floor(
            1000
            +
            Math.random()
            *
            9000
        )
    );

}


// ==========================================================
// ENTRADA
// ==========================================================

const entryScreen =
    document.getElementById(
        "entry-screen"
    );


const loginScreen =
    document.getElementById(
        "login-screen"
    );


const registerScreen =
    document.getElementById(
        "register-screen"
    );


const mainApp =
    document.getElementById(
        "main-app"
    );


function hideEntryScreens() {

    entryScreen.classList.add(
        "hidden"
    );


    loginScreen.classList.add(
        "hidden"
    );


    registerScreen.classList.add(
        "hidden"
    );

}


function enterApp() {

    hideEntryScreens();


    mainApp.classList.remove(
        "hidden"
    );


    localStorage.setItem(
        STORAGE.entered,
        "true"
    );


    refreshAccountUI();

    renderExplore();

    renderRoutines();

    loadSettingsToUI();

    applyProductPolish();


    showScreen(
        "home",
        false
    );

}


document
    .getElementById(
        "continue-guest"
    )
    .addEventListener(
        "click",
        enterApp
    );


document
    .getElementById(
        "open-login"
    )
    .addEventListener(
        "click",
        () => {

            entryScreen.classList.add(
                "hidden"
            );


            loginScreen.classList.remove(
                "hidden"
            );

        }
    );


document
    .getElementById(
        "open-register"
    )
    .addEventListener(
        "click",
        () => {

            entryScreen.classList.add(
                "hidden"
            );


            registerScreen.classList.remove(
                "hidden"
            );

        }
    );


document
    .getElementById(
        "login-back"
    )
    .addEventListener(
        "click",
        () => {

            loginScreen.classList.add(
                "hidden"
            );


            entryScreen.classList.remove(
                "hidden"
            );

        }
    );


document
    .getElementById(
        "register-back"
    )
    .addEventListener(
        "click",
        () => {

            registerScreen.classList.add(
                "hidden"
            );


            entryScreen.classList.remove(
                "hidden"
            );

        }
    );


document
    .getElementById(
        "login-button"
    )
    .addEventListener(
        "click",
        () => {

            if (
                !account
            ) {

                alert(
                    "Nenhuma conta local foi criada."
                );


                return;

            }


            enterApp();

        }
    );


document
    .getElementById(
        "register-button"
    )
    .addEventListener(
        "click",
        () => {

            const name =
                document
                    .getElementById(
                        "register-name"
                    )
                    .value
                    .trim();


            const username =
                document
                    .getElementById(
                        "register-username"
                    )
                    .value
                    .trim();


            const anonymous =
                document
                    .getElementById(
                        "register-anonymous"
                    )
                    .checked;


            const isPublic =
                document
                    .getElementById(
                        "register-public"
                    )
                    .checked;


            if (
                !anonymous
                &&
                !name
            ) {

                alert(
                    "Digite um nome ou selecione o modo anônimo."
                );


                return;

            }


            const publicName =
                anonymous
                    ?
                    generateAnonymousName()
                    :
                    name;


            account = {

                name:
                    publicName,

                username:
                    username
                    ||
                    `@${
                        publicName
                            .toLowerCase()
                            .replaceAll(
                                " ",
                                ""
                            )
                    }`,

                anonymous,

                public:
                    isPublic

            };


            saveJSON(
                STORAGE.account,
                account
            );


            settings.community =
                isPublic;


            saveSettings();

            enterApp();

        }
    );


// ==========================================================
// TELAS
// ==========================================================

const screens = {

    home:
        document.getElementById(
            "screen-home"
        ),

    library:
        document.getElementById(
            "screen-library"
        ),

    train:
        document.getElementById(
            "screen-train"
        ),

    routines:
        document.getElementById(
            "screen-routines"
        ),

    createRoutine:
        document.getElementById(
            "screen-create-routine"
        ),

    routineDetail:
        document.getElementById(
            "screen-routine-detail"
        ),

    routineExerciseConfig:
        document.getElementById(
            "screen-routine-exercise-config"
        ),

    community:
        document.getElementById(
            "screen-community"
        ),

    profile:
        document.getElementById(
            "screen-profile"
        ),

    settings:
        document.getElementById(
            "screen-settings"
        ),

    hudEditor:
        document.getElementById(
            "screen-hud-editor"
        ),

    createExercise:
        document.getElementById(
            "screen-create-exercise"
        ),

    recordPrep:
        document.getElementById(
            "screen-record-prep"
        ),

    exercise:
        document.getElementById(
            "screen-exercise"
        ),

    config:
        document.getElementById(
            "screen-config"
        ),

    result:
        document.getElementById(
            "screen-result"
        )

};


const appHeader =
    document.getElementById(
        "app-header"
    );


const bottomNav =
    document.getElementById(
        "bottom-nav"
    );


const headerBack =
    document.getElementById(
        "header-back"
    );


const secondaryScreens = [

    "createRoutine",
    "routineDetail",
    "routineExerciseConfig",
    "settings",
    "hudEditor",
    "createExercise",
    "recordPrep",
    "exercise",
    "config",
    "result"

];


function getActiveScreenName() {

    for (
        const [
            name,
            screen
        ]
        of Object.entries(
            screens
        )
    ) {

        if (
            screen.classList.contains(
                "active"
            )
        ) {

            return name;

        }

    }


    return null;

}


function showScreen(
    name,
    pushHistory = true
) {

    const current =
        getActiveScreenName();


    if (
        pushHistory
        &&
        current
        &&
        current !==
        name
    ) {

        screenHistory.push(
            current
        );

    }


    Object
        .values(
            screens
        )
        .forEach(
            screen => {

                screen.classList.remove(
                    "active"
                );

            }
        );


    screens[
        name
    ]
        .classList
        .add(
            "active"
        );


    const secondary =
        secondaryScreens.includes(
            name
        );


    headerBack.classList.toggle(
        "hidden",
        !secondary
    );


    bottomNav.classList.toggle(
        "hidden",
        secondary
    );


    updateNav(
        name
    );


    if (
        name ===
        "library"
    ) {

        renderExplore();

    }


    if (
        name ===
        "routines"
        ||
        name ===
        "train"
    ) {

        renderRoutines();

    }


    if (
        name ===
        "profile"
    ) {

        refreshAccountUI();

    }


    window.scrollTo(
        0,
        0
    );

}


function updateNav(name) {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.nav ===
                    name
                );

            }
        );

}


function goBack() {

    const previous =
        screenHistory.pop();


    showScreen(
        previous
        ||
        "home",
        false
    );

}


headerBack.addEventListener(
    "click",
    goBack
);


document
    .getElementById(
        "brand-button"
    )
    .addEventListener(
        "click",
        () => {

            screenHistory =
                [];


            showScreen(
                "home",
                false
            );

        }
    );


document
    .querySelectorAll(
        "[data-nav]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    screenHistory =
                        [];


                    showScreen(
                        button.dataset.nav,
                        false
                    );

                }
            );

        }
    );


document
    .querySelectorAll(
        "[data-go]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showScreen(
                        button.dataset.go
                    );

                }
            );

        }
    );


document
    .getElementById(
        "header-profile"
    )
    .addEventListener(
        "click",
        () => {

            showScreen(
                "profile"
            );

        }
    );


// ==========================================================
// POLIMENTO DO PRODUTO
// ==========================================================

function applyProductPolish() {

    const title =
        document.getElementById(
            "home-routine-title"
        );


    const description =
        document.getElementById(
            "home-routine-description"
        );


    const action =
        document.getElementById(
            "home-main-action"
        );


    if (
        title
    ) {

        title.textContent =
            "Agachamento inteligente";

    }


    if (
        description
    ) {

        description.textContent =
            "Contagem automática, fases do movimento e biomecânica em tempo real.";

    }


    if (
        action
    ) {

        action.textContent =
            "TESTAR AGACHAMENTO";

    }


    const heroLabel =
        document.querySelector(
            ".hero-top span"
        );


    if (
        heroLabel
    ) {

        heroLabel.textContent =
            "EXERCÍCIO INTELIGENTE";

    }


    ensureSmartFeatureRow();

    ensureExerciseDemoCanvas();

}


// ==========================================================
// PREVIEW VISUAL DO EXERCÍCIO
// ==========================================================

let exerciseDemoAnimationFrame =
    null;


function ensureExerciseDemoCanvas() {

    const visual =
        document.querySelector(
            ".exercise-detail-visual"
        );


    if (
        !visual
    ) {

        return;

    }


    let canvasDemo =
        document.getElementById(
            "exercise-demo-canvas"
        );


    if (
        canvasDemo
    ) {

        return canvasDemo;

    }


    const oldPreview =
        document.getElementById(
            "detail-animation-preview"
        );


    if (
        oldPreview
    ) {

        oldPreview.classList.add(
            "hidden"
        );

    }


    canvasDemo =
        document.createElement(
            "canvas"
        );


    canvasDemo.id =
        "exercise-demo-canvas";


    canvasDemo.style.width =
        "100%";


    canvasDemo.style.height =
        "100%";


    canvasDemo.style.display =
        "block";


    visual.appendChild(
        canvasDemo
    );


    return canvasDemo;

}


function resizeExerciseDemoCanvas() {

    const canvasDemo =
        ensureExerciseDemoCanvas();


    if (
        !canvasDemo
    ) {

        return null;

    }


    const rect =
        canvasDemo.getBoundingClientRect();


    const dpr =
        window.devicePixelRatio
        ||
        1;


    canvasDemo.width =
        Math.max(
            1,
            Math.round(
                rect.width
                *
                dpr
            )
        );


    canvasDemo.height =
        Math.max(
            1,
            Math.round(
                rect.height
                *
                dpr
            )
        );


    const context =
        canvasDemo.getContext(
            "2d"
        );


    context.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    return {

        canvas:
            canvasDemo,

        context,

        width:
            rect.width,

        height:
            rect.height

    };

}


function drawDemoLine(
    context,
    a,
    b,
    width = 4
) {

    context.beginPath();


    context.moveTo(
        a.x,
        a.y
    );


    context.lineTo(
        b.x,
        b.y
    );


    context.strokeStyle =
        "rgba(243,230,0,.92)";


    context.lineWidth =
        width;


    context.lineCap =
        "round";


    context.stroke();

}


function drawDemoJoint(
    context,
    point,
    radius = 4.5
) {

    context.beginPath();


    context.arc(
        point.x,
        point.y,
        radius,
        0,
        Math.PI
        *
        2
    );


    context.fillStyle =
        "#f3e600";


    context.fill();

}


function drawSquatDemo(
    context,
    width,
    height,
    timestamp
) {

    context.clearRect(
        0,
        0,
        width,
        height
    );


    const cycleMs =
        3600;


    const progress =
        (
            timestamp
            %
            cycleMs
        )
        /
        cycleMs;


    let squatProgress;


    if (
        progress <
        .18
    ) {

        squatProgress =
            0;

    }

    else if (
        progress <
        .44
    ) {

        squatProgress =
            (
                progress
                -
                .18
            )
            /
            .26;

    }

    else if (
        progress <
        .58
    ) {

        squatProgress =
            1;

    }

    else if (
        progress <
        .84
    ) {

        squatProgress =
            1
            -
            (
                (
                    progress
                    -
                    .58
                )
                /
                .26
            );

    }

    else {

        squatProgress =
            0;

    }


    squatProgress =
        (
            1
            -
            Math.cos(
                squatProgress
                *
                Math.PI
            )
        )
        /
        2;


    const centerX =
        width
        *
        .5;


    const baseY =
        height
        *
        .84;


    const scale =
        Math.min(
            width
            /
            360,
            height
            /
            300
        );


    const hipDrop =
        66
        *
        scale
        *
        squatProgress;


    const torsoLean =
        30
        *
        scale
        *
        squatProgress;


    const kneeForward =
        35
        *
        scale
        *
        squatProgress;


    const stance =
        42
        *
        scale;


    const ankleL = {

        x:
            centerX
            -
            stance,

        y:
            baseY

    };


    const ankleR = {

        x:
            centerX
            +
            stance,

        y:
            baseY

    };


    const kneeL = {

        x:
            centerX
            -
            stance
            +
            kneeForward,

        y:
            baseY
            -
            (
                72
                *
                scale
            )
            +
            (
                hipDrop
                *
                .45
            )

    };


    const kneeR = {

        x:
            centerX
            +
            stance
            -
            kneeForward,

        y:
            baseY
            -
            (
                72
                *
                scale
            )
            +
            (
                hipDrop
                *
                .45
            )

    };


    const hipL = {

        x:
            centerX
            -
            (
                19
                *
                scale
            ),

        y:
            baseY
            -
            (
                146
                *
                scale
            )
            +
            hipDrop

    };


    const hipR = {

        x:
            centerX
            +
            (
                19
                *
                scale
            ),

        y:
            baseY
            -
            (
                146
                *
                scale
            )
            +
            hipDrop

    };


    const shoulderL = {

        x:
            centerX
            -
            (
                31
                *
                scale
            )
            +
            torsoLean,

        y:
            hipL.y
            -
            (
                82
                *
                scale
            )

    };


    const shoulderR = {

        x:
            centerX
            +
            (
                31
                *
                scale
            )
            +
            torsoLean,

        y:
            hipR.y
            -
            (
                82
                *
                scale
            )

    };


    const neck = {

        x:
            (
                shoulderL.x
                +
                shoulderR.x
            )
            /
            2,

        y:
            (
                shoulderL.y
                +
                shoulderR.y
            )
            /
            2
            -
            (
                10
                *
                scale
            )

    };


    const head = {

        x:
            neck.x,

        y:
            neck.y
            -
            (
                32
                *
                scale
            )

    };


    const elbowL = {

        x:
            shoulderL.x
            -
            (
                34
                *
                scale
            )
            +
            (
                12
                *
                scale
                *
                squatProgress
            ),

        y:
            shoulderL.y
            +
            (
                36
                *
                scale
            )

    };


    const elbowR = {

        x:
            shoulderR.x
            +
            (
                34
                *
                scale
            )
            -
            (
                12
                *
                scale
                *
                squatProgress
            ),

        y:
            shoulderR.y
            +
            (
                36
                *
                scale
            )

    };


    const wristL = {

        x:
            elbowL.x
            +
            (
                30
                *
                scale
            )
            +
            (
                22
                *
                scale
                *
                squatProgress
            ),

        y:
            elbowL.y
            +
            (
                20
                *
                scale
            )
            -
            (
                36
                *
                scale
                *
                squatProgress
            )

    };


    const wristR = {

        x:
            elbowR.x
            -
            (
                30
                *
                scale
            )
            -
            (
                22
                *
                scale
                *
                squatProgress
            ),

        y:
            elbowR.y
            +
            (
                20
                *
                scale
            )
            -
            (
                36
                *
                scale
                *
                squatProgress
            )

    };


    context.save();


    context.shadowBlur =
        15;


    context.shadowColor =
        "rgba(243,230,0,.18)";


    drawDemoLine(
        context,
        shoulderL,
        shoulderR
    );


    drawDemoLine(
        context,
        hipL,
        hipR
    );


    drawDemoLine(
        context,
        shoulderL,
        hipL
    );


    drawDemoLine(
        context,
        shoulderR,
        hipR
    );


    drawDemoLine(
        context,
        hipL,
        kneeL
    );


    drawDemoLine(
        context,
        kneeL,
        ankleL
    );


    drawDemoLine(
        context,
        hipR,
        kneeR
    );


    drawDemoLine(
        context,
        kneeR,
        ankleR
    );


    drawDemoLine(
        context,
        shoulderL,
        elbowL
    );


    drawDemoLine(
        context,
        elbowL,
        wristL
    );


    drawDemoLine(
        context,
        shoulderR,
        elbowR
    );


    drawDemoLine(
        context,
        elbowR,
        wristR
    );


    drawDemoLine(
        context,
        neck,
        head,
        3
    );


    [
        shoulderL,
        shoulderR,
        hipL,
        hipR,
        kneeL,
        kneeR,
        ankleL,
        ankleR,
        elbowL,
        elbowR,
        wristL,
        wristR
    ]
        .forEach(
            point => {

                drawDemoJoint(
                    context,
                    point
                );

            }
        );


    context.beginPath();


    context.arc(
        head.x,
        head.y
        -
        (
            6
            *
            scale
        ),
        15
        *
        scale,
        0,
        Math.PI
        *
        2
    );


    context.strokeStyle =
        "#f3e600";


    context.lineWidth =
        3;


    context.stroke();


    context.restore();


    const phase =
        progress <
        .18
            ?
            "EM PÉ"
            :
            progress <
            .44
                ?
                "DESCENDO"
                :
                progress <
                .58
                    ?
                    "FUNDO"
                    :
                    progress <
                    .84
                        ?
                        "SUBINDO"
                        :
                        "EM PÉ";


    context.save();


    context.textAlign =
        "center";


    context.fillStyle =
        "rgba(255,255,255,.92)";


    context.font =
        "800 11px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";


    context.fillText(
        phase,
        centerX,
        height
        -
        18
    );


    context.fillStyle =
        "rgba(243,230,0,.7)";


    context.font =
        "700 7px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";


    context.fillText(
        "EXEMPLO DE EXECUÇÃO",
        centerX,
        20
    );


    context.restore();

}


function drawGenericDemo(
    context,
    width,
    height,
    timestamp
) {

    context.clearRect(
        0,
        0,
        width,
        height
    );


    const centerX =
        width
        *
        .5;


    const centerY =
        height
        *
        .48;


    const movement =
        Math.sin(
            timestamp
            /
            500
        )
        *
        8;


    context.save();


    context.strokeStyle =
        "#f3e600";


    context.lineWidth =
        4;


    context.lineCap =
        "round";


    context.beginPath();


    context.arc(
        centerX,
        centerY
        -
        75
        +
        movement,
        15,
        0,
        Math.PI
        *
        2
    );


    context.stroke();


    context.beginPath();


    context.moveTo(
        centerX,
        centerY
        -
        58
        +
        movement
    );


    context.lineTo(
        centerX,
        centerY
        +
        25
        +
        movement
    );


    context.stroke();


    context.beginPath();


    context.moveTo(
        centerX,
        centerY
        -
        30
        +
        movement
    );


    context.lineTo(
        centerX
        -
        42,
        centerY
        +
        movement
    );


    context.moveTo(
        centerX,
        centerY
        -
        30
        +
        movement
    );


    context.lineTo(
        centerX
        +
        42,
        centerY
        +
        movement
    );


    context.stroke();


    context.beginPath();


    context.moveTo(
        centerX,
        centerY
        +
        25
        +
        movement
    );


    context.lineTo(
        centerX
        -
        32,
        centerY
        +
        90
        +
        movement
    );


    context.moveTo(
        centerX,
        centerY
        +
        25
        +
        movement
    );


    context.lineTo(
        centerX
        +
        32,
        centerY
        +
        90
        +
        movement
    );


    context.stroke();


    context.restore();

}


function startExerciseDemo() {

    cancelAnimationFrame(
        exerciseDemoAnimationFrame
    );


    const setup =
        resizeExerciseDemoCanvas();


    if (
        !setup
    ) {

        return;

    }


    const {
        context,
        width,
        height
    } =
        setup;


    const animate =
        timestamp => {

            if (
                getActiveScreenName()
                !==
                "exercise"
            ) {

                return;

            }


            if (
                selectedExercise.id ===
                "agachamento"
            ) {

                drawSquatDemo(
                    context,
                    width,
                    height,
                    timestamp
                );

            }

            else {

                drawGenericDemo(
                    context,
                    width,
                    height,
                    timestamp
                );

            }


            exerciseDemoAnimationFrame =
                requestAnimationFrame(
                    animate
                );

        };


    exerciseDemoAnimationFrame =
        requestAnimationFrame(
            animate
        );

}


// ==========================================================
// SMART FEATURES
// ==========================================================

function ensureSmartFeatureRow() {

    if (
        document.getElementById(
            "smart-features"
        )
    ) {

        return;

    }


    const analysis =
        document.querySelector(
            ".analysis-card"
        );


    if (
        !analysis
    ) {

        return;

    }


    const row =
        document.createElement(
            "div"
        );


    row.id =
        "smart-features";


    row.className =
        "smart-features hidden";


    row.innerHTML = `

        <div
            class="smart-feature"
        >

            <strong>
                AUTO
            </strong>

            <small>
                REPETIÇÕES
            </small>

        </div>

        <div
            class="smart-feature"
        >

            <strong>
                3
            </strong>

            <small>
                ÂNGULOS AO VIVO
            </small>

        </div>

        <div
            class="smart-feature"
        >

            <strong>
                LIVE
            </strong>

            <small>
                FASE DO MOVIMENTO
            </small>

        </div>

    `;


    analysis.insertAdjacentElement(
        "afterend",
        row
    );

}


// ==========================================================
// PERFIL
// ==========================================================

function getInitials(value) {

    if (
        !value
    ) {

        return "G";

    }


    return value
        .trim()
        .split(
            /\s+/
        )
        .slice(
            0,
            2
        )
        .map(
            word =>
                word[0]
                    ?.toUpperCase()
        )
        .join("");

}


function refreshAccountUI() {

    const avatarSmall =
        document.getElementById(
            "header-profile"
        );


    const avatarLarge =
        document.getElementById(
            "profile-avatar-large"
        );


    const profileName =
        document.getElementById(
            "profile-name"
        );


    const profileUsername =
        document.getElementById(
            "profile-username"
        );


    const greeting =
        document.getElementById(
            "home-greeting"
        );


    const status =
        document.getElementById(
            "home-account-status"
        );


    const createAccount =
        document.getElementById(
            "profile-create-account"
        );


    if (
        account
    ) {

        const initials =
            getInitials(
                account.name
            );


        avatarSmall.textContent =
            initials;


        avatarLarge.textContent =
            initials;


        profileName.textContent =
            account.name;


        profileUsername.textContent =
            account.username;


        greeting.textContent =
            `Bom treino, ${
                account.name.split(
                    " "
                )[0]
            }.`;


        status.textContent =
            account.public
                ?
                "Seu perfil está conectado à comunidade."
                :
                "Seu perfil está em modo privado.";


        createAccount.classList.add(
            "hidden"
        );

    }

    else {

        avatarSmall.textContent =
            "G";


        avatarLarge.textContent =
            "G";


        profileName.textContent =
            "Convidado";


        profileUsername.textContent =
            "Dados salvos somente neste aparelho";


        greeting.textContent =
            "Bom treino.";


        status.textContent =
            "Você está usando o FitAI como convidado.";


        createAccount.classList.remove(
            "hidden"
        );

    }


    document
        .getElementById(
            "profile-routines-count"
        )
        .textContent =
            routines.length;


    document
        .getElementById(
            "profile-favorites-count"
        )
        .textContent =
            favorites.length;


    const stats =
        document.querySelectorAll(
            ".profile-stats strong"
        );


    if (
        stats.length >=
        3
    ) {

        stats[2].textContent =
            createdExercises.length;

    }

}


document
    .getElementById(
        "profile-create-account"
    )
    .addEventListener(
        "click",
        () => {

            mainApp.classList.add(
                "hidden"
            );


            registerScreen.classList.remove(
                "hidden"
            );

        }
    );


// ==========================================================
// EXPLORAR
// ==========================================================

const exploreList =
    document.getElementById(
        "explore-list"
    );


const exerciseSearch =
    document.getElementById(
        "exercise-search"
    );


function isFavorite(id) {

    return favorites.includes(
        id
    );

}


function toggleFavorite(id) {

    if (
        isFavorite(
            id
        )
    ) {

        favorites =
            favorites.filter(
                item =>
                    item !==
                    id
            );

    }

    else {

        favorites.push(
            id
        );

    }


    saveJSON(
        STORAGE.favorites,
        favorites
    );


    renderExplore();

    updateFavoriteButton();

    refreshAccountUI();

}


function formatPopularity(value) {

    if (
        value >=
        1000
    ) {

        return (
            `${
                Math.round(
                    value
                    /
                    1000
                )
            } mil`
        );

    }


    return String(
        value
    );

}


function getExploreExercises() {

    let result =
        getAllExercises();


    if (
        currentExploreFilter ===
        "foryou"
    ) {

        result.sort(
            (
                a,
                b
            ) => {

                if (
                    a.id ===
                    "agachamento"
                ) {

                    return -1;

                }


                if (
                    b.id ===
                    "agachamento"
                ) {

                    return 1;

                }


                return (
                    (
                        b.popularity
                        ||
                        0
                    )
                    -
                    (
                        a.popularity
                        ||
                        0
                    )
                );

            }
        );

    }


    if (
        currentExploreFilter ===
        "popular"
    ) {

        result.sort(
            (
                a,
                b
            ) =>
                (
                    b.popularity
                    ||
                    0
                )
                -
                (
                    a.popularity
                    ||
                    0
                )
        );

    }


    if (
        currentExploreFilter ===
        "new"
    ) {

        result.sort(
            (
                a,
                b
            ) =>
                (
                    b.createdAt
                    ||
                    0
                )
                -
                (
                    a.createdAt
                    ||
                    0
                )
        );

    }


    if (
        currentExploreFilter ===
        "favorites"
    ) {

        result =
            result.filter(
                exercise =>
                    isFavorite(
                        exercise.id
                    )
            );

    }


    const query =
        exerciseSearch
            .value
            .trim()
            .toLowerCase();


    if (
        query
    ) {

        result =
            result.filter(
                exercise =>
                    exercise.name
                        .toLowerCase()
                        .includes(
                            query
                        )
                    ||
                    exercise.muscles
                        .toLowerCase()
                        .includes(
                            query
                        )
            );

    }


    return result;

}


function renderExplore() {

    const list =
        getExploreExercises();


    exploreList.innerHTML =
        "";


    if (
        !list.length
    ) {

        exploreList.innerHTML = `

            <div
                class="empty-state"
            >

                <span>
                    ♡
                </span>

                <h2>
                    Nada por aqui
                </h2>

                <p>
                    Seus exercícios aparecerão aqui.
                </p>

            </div>

        `;


        return;

    }


    list.forEach(
        exercise => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "explore-card";


            if (
                exercise.id ===
                "agachamento"
            ) {

                card.classList.add(
                    "smart-exercise"
                );

            }


            let badgeClass =
                "official-badge";


            if (
                exercise.motion ===
                "recorded"
            ) {

                badgeClass =
                    "created-badge";

            }

            else if (
                exercise.id ===
                "agachamento"
                ||
                exercise.motion ===
                "jump"
            ) {

                badgeClass =
                    "motion-badge";

            }


            card.innerHTML = `

                <button
                    class="explore-image"
                    type="button"
                >

                    ${
                        exercise.symbol
                        ||
                        "◎"
                    }

                </button>

                <button
                    class="explore-info"
                    type="button"
                >

                    <span
                        class="${badgeClass}"
                    >

                        ${
                            escapeHtml(
                                exercise.badge
                            )
                        }

                    </span>

                    <h2>

                        ${
                            escapeHtml(
                                exercise.name
                            )
                        }

                    </h2>

                    <p>

                        ${
                            escapeHtml(
                                exercise.muscles
                            )
                        }

                    </p>

                    ${
                        exercise.id ===
                        "agachamento"
                            ?
                            `

                            <span
                                class="smart-label"
                            >

                                ●
                                ANÁLISE INTELIGENTE

                            </span>

                            `
                            :
                            `

                            <small>

                                ${
                                    exercise.motion ===
                                    "recorded"
                                        ?
                                        `${
                                            (
                                                exercise.durationMs
                                                /
                                                1000
                                            )
                                            .toFixed(
                                                1
                                            )
                                        }s · movimento gravado`
                                        :
                                        `${
                                            formatPopularity(
                                                exercise.popularity
                                                ||
                                                0
                                            )
                                        } execuções`
                                }

                            </small>

                            `
                    }

                </button>

                <button
                    class="
                        card-favorite
                        ${
                            isFavorite(
                                exercise.id
                            )
                                ?
                                "active"
                                :
                                ""
                        }
                    "
                    type="button"
                >

                    ${
                        isFavorite(
                            exercise.id
                        )
                            ?
                            "♥"
                            :
                            "♡"
                    }

                </button>

            `;


            const open =
                () => {

                    openExercise(
                        exercise.id
                    );

                };


            card
                .querySelector(
                    ".explore-image"
                )
                .addEventListener(
                    "click",
                    open
                );


            card
                .querySelector(
                    ".explore-info"
                )
                .addEventListener(
                    "click",
                    open
                );


            card
                .querySelector(
                    ".card-favorite"
                )
                .addEventListener(
                    "click",
                    () => {

                        toggleFavorite(
                            exercise.id
                        );

                    }
                );


            exploreList.appendChild(
                card
            );

        }
    );

}


document
    .querySelectorAll(
        "[data-filter]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    currentExploreFilter =
                        button.dataset.filter;


                    document
                        .querySelectorAll(
                            "[data-filter]"
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                    button.classList.add(
                        "active"
                    );


                    renderExplore();

                }
            );

        }
    );


exerciseSearch.addEventListener(
    "input",
    renderExplore
);


document
    .getElementById(
        "profile-favorites"
    )
    .addEventListener(
        "click",
        () => {

            currentExploreFilter =
                "favorites";


            document
                .querySelectorAll(
                    "[data-filter]"
                )
                .forEach(
                    item => {

                        item.classList.toggle(
                            "active",
                            item.dataset.filter ===
                            "favorites"
                        );

                    }
                );


            showScreen(
                "library"
            );

        }
    );


// ==========================================================
// DETALHE EXERCÍCIO
// ==========================================================

function openExercise(id) {

    selectedExercise =
        getExerciseById(
            id
        );


    if (
        !selectedExercise
    ) {

        return;

    }


    document
        .getElementById(
            "detail-title"
        )
        .textContent =
            selectedExercise.name;


    document
        .getElementById(
            "detail-muscles"
        )
        .textContent =
            selectedExercise.muscles;


    document
        .getElementById(
            "detail-badge"
        )
        .textContent =
            selectedExercise.badge;


    document
        .getElementById(
            "detail-popularity"
        )
        .textContent =
            selectedExercise.motion ===
            "recorded"
                ?
                "Seu"
                :
                formatPopularity(
                    selectedExercise.popularity
                    ||
                    0
                );


    const analysisText =
        document.querySelector(
            ".analysis-card p"
        );


    const features =
        document.getElementById(
            "smart-features"
        );


    if (
        selectedExercise.id ===
        "agachamento"
    ) {

        analysisText.textContent =
            "O FitAI acompanha o movimento em tempo real, mede joelho, quadril e tronco e identifica as fases do agachamento.";


        features
            ?.classList
            .remove(
                "hidden"
            );

    }

    else {

        analysisText.textContent =
            "A câmera acompanha as articulações necessárias.";


        features
            ?.classList
            .add(
                "hidden"
            );

    }


    updateFavoriteButton();


    showScreen(
        "exercise"
    );


    requestAnimationFrame(
        startExerciseDemo
    );

}


document
    .querySelectorAll(
        "[data-exercise]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    openExercise(
                        button.dataset.exercise
                    );

                }
            );

        }
    );


function updateFavoriteButton() {

    const button =
        document.getElementById(
            "favorite-button"
        );


    if (
        !selectedExercise
    ) {

        return;

    }


    const active =
        isFavorite(
            selectedExercise.id
        );


    button.classList.toggle(
        "active",
        active
    );


    button.textContent =
        active
            ?
            "♥"
            :
            "♡";

}


document
    .getElementById(
        "favorite-button"
    )
    .addEventListener(
        "click",
        () => {

            toggleFavorite(
                selectedExercise.id
            );

        }
    );


document
    .getElementById(
        "start-now-button"
    )
    .addEventListener(
        "click",
        () => {

            cancelAnimationFrame(
                exerciseDemoAnimationFrame
            );


            routineSession =
                null;


            document
                .getElementById(
                    "config-title"
                )
                .textContent =
                    selectedExercise.name;


            showScreen(
                "config"
            );

        }
    );


document
    .getElementById(
        "home-main-action"
    )
    .addEventListener(
        "click",
        () => {

            openExercise(
                "agachamento"
            );

        }
    );


// ==========================================================
// ROTINAS
// ==========================================================

let routineDuration =
    8;


let routineDraftGroups =
    [];


let selectedRoutineId =
    null;


let routineConfigContext =
    null;


function saveRoutines() {

    persistRoutines(
        routines
    );


    renderRoutines();

    refreshAccountUI();

}


function getRoutineProgress(
    routine
) {

    const start =
        new Date(
            routine.startDate
        );


    const elapsed =
        Math.max(
            0,
            Date.now()
            -
            start.getTime()
        );


    const elapsedWeeks =
        Math.floor(
            elapsed
            /
            (
                1000
                *
                60
                *
                60
                *
                24
                *
                7
            )
        );


    return {

        currentWeek:
            Math.min(
                routine.duration,
                elapsedWeeks
                +
                1
            ),

        percent:
            Math.min(
                100,
                (
                    elapsedWeeks
                    /
                    routine.duration
                )
                *
                100
            )

    };

}


function buildRoutineCard(
    routine
) {

    const progress =
        getRoutineProgress(
            routine
        );


    const card =
        document.createElement(
            "button"
        );


    card.className =
        "routine-card";


    card.type =
        "button";


    const totalExercises =
        routine.groups.reduce(
            (
                total,
                group
            ) =>
                total
                +
                group.exercises.length,
            0
        );


    card.innerHTML = `

        <h2>

            ${
                escapeHtml(
                    routine.name
                )
            }

        </h2>

        <p>

            ${
                routine.groups.length
            }
            grupos

            ·

            ${totalExercises}
            exercícios

            ·

            ${
                routine.duration
            }
            semanas

        </p>

        <div
            class="routine-card-progress"
        >

            <div
                style="
                    width:
                    ${
                        progress.percent
                    }%;
                "
            >
            </div>

        </div>

        <div
            class="routine-meta"
        >

            <span>

                Semana
                ${
                    progress.currentWeek
                }

            </span>

            <span>

                ${
                    Math.round(
                        progress.percent
                    )
                }%

            </span>

        </div>

    `;


    card.addEventListener(
        "click",
        () => {

            openRoutineDetail(
                routine.id
            );

        }
    );


    return card;

}


function renderRoutines() {

    const list =
        document.getElementById(
            "routines-list"
        );


    const compact =
        document.getElementById(
            "train-routines-list"
        );


    const empty =
        document.getElementById(
            "empty-routines"
        );


    list.innerHTML =
        "";


    compact.innerHTML =
        "";


    empty.classList.toggle(
        "hidden",
        routines.length >
        0
    );


    routines.forEach(
        routine => {

            list.appendChild(
                buildRoutineCard(
                    routine
                )
            );


            compact.appendChild(
                buildRoutineCard(
                    routine
                )
            );

        }
    );

}


function openRoutineCreator() {

    routineDuration =
        8;


    routineDraftGroups =
        [
            createGroup(
                "Segunda-feira"
            )
        ];


    document
        .getElementById(
            "routine-name"
        )
        .value =
            "";


    updateRoutineDuration();

    renderRoutineEditor();


    showScreen(
        "createRoutine"
    );

}


document
    .getElementById(
        "create-routine-button"
    )
    .addEventListener(
        "click",
        openRoutineCreator
    );


document
    .getElementById(
        "train-create-routine"
    )
    .addEventListener(
        "click",
        openRoutineCreator
    );


function updateRoutineDuration() {

    document
        .getElementById(
            "routine-duration"
        )
        .textContent =
            `${
                routineDuration
            } ${
                routineDuration ===
                1
                    ?
                    "semana"
                    :
                    "semanas"
            }`;

}


document
    .getElementById(
        "routine-duration-minus"
    )
    .addEventListener(
        "click",
        () => {

            routineDuration =
                Math.max(
                    1,
                    routineDuration
                    -
                    1
                );


            updateRoutineDuration();

        }
    );


document
    .getElementById(
        "routine-duration-plus"
    )
    .addEventListener(
        "click",
        () => {

            routineDuration =
                Math.min(
                    52,
                    routineDuration
                    +
                    1
                );


            updateRoutineDuration();

        }
    );


document
    .getElementById(
        "add-routine-group"
    )
    .addEventListener(
        "click",
        () => {

            routineDraftGroups.push(
                createGroup(
                    `Treino ${
                        routineDraftGroups.length
                        +
                        1
                    }`
                )
            );


            renderRoutineEditor();

        }
    );


function renderRoutineEditor() {

    const container =
        document.getElementById(
            "routine-groups-editor"
        );


    container.innerHTML =
        "";


    routineDraftGroups.forEach(
        group => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "routine-group-editor";


            wrapper.innerHTML = `

                <input
                    type="text"
                    value="${
                        escapeHtml(
                            group.name
                        )
                    }"
                    placeholder="Nome do grupo"
                >

                <div
                    class="exercise-chip-list"
                >
                </div>

                <button
                    class="remove-group"
                    type="button"
                >
                    REMOVER GRUPO
                </button>

            `;


            const nameInput =
                wrapper.querySelector(
                    "input"
                );


            nameInput.addEventListener(
                "input",
                () => {

                    group.name =
                        nameInput.value;

                }
            );


            const chipList =
                wrapper.querySelector(
                    ".exercise-chip-list"
                );


            getAllExercises()
                .forEach(
                    exercise => {

                        const selected =
                            group.exercises.some(
                                item =>
                                    item.exerciseId ===
                                    exercise.id
                            );


                        const chip =
                            document.createElement(
                                "button"
                            );


                        chip.type =
                            "button";


                        chip.className =
                            "exercise-chip";


                        chip.textContent =
                            exercise.name;


                        chip.classList.toggle(
                            "active",
                            selected
                        );


                        chip.addEventListener(
                            "click",
                            () => {

                                const index =
                                    group.exercises
                                        .findIndex(
                                            item =>
                                                item.exerciseId ===
                                                exercise.id
                                        );


                                if (
                                    index >=
                                    0
                                ) {

                                    group.exercises.splice(
                                        index,
                                        1
                                    );

                                }

                                else {

                                    group.exercises.push(
                                        createRoutineExercise(
                                            exercise.id
                                        )
                                    );

                                }


                                renderRoutineEditor();

                            }
                        );


                        chipList.appendChild(
                            chip
                        );

                    }
                );


            wrapper
                .querySelector(
                    ".remove-group"
                )
                .addEventListener(
                    "click",
                    () => {

                        routineDraftGroups =
                            routineDraftGroups
                                .filter(
                                    item =>
                                        item.id !==
                                        group.id
                                );


                        renderRoutineEditor();

                    }
                );


            container.appendChild(
                wrapper
            );

        }
    );

}


document
    .getElementById(
        "save-routine"
    )
    .addEventListener(
        "click",
        () => {

            const name =
                document
                    .getElementById(
                        "routine-name"
                    )
                    .value
                    .trim();


            if (
                !name
            ) {

                alert(
                    "Informe o nome da rotina."
                );


                return;

            }


            if (
                !routineDraftGroups.length
            ) {

                alert(
                    "Crie pelo menos um grupo."
                );


                return;

            }


            const routine =
                createRoutine({

                    name,

                    duration:
                        routineDuration

                });


            routine.groups =
                routineDraftGroups;


            routines.unshift(
                routine
            );


            saveRoutines();


            selectedRoutineId =
                routine.id;


            screenHistory =
                [];


            openRoutineDetail(
                routine.id,
                false
            );

        }
    );


// ==========================================================
// DETALHE ROTINA
// ==========================================================

function openRoutineDetail(
    routineId,
    pushHistory = true
) {

    const routine =
        routines.find(
            item =>
                item.id ===
                routineId
        );


    if (
        !routine
    ) {

        return;

    }


    selectedRoutineId =
        routine.id;


    const progress =
        getRoutineProgress(
            routine
        );


    document
        .getElementById(
            "routine-detail-title"
        )
        .textContent =
            routine.name;


    document
        .getElementById(
            "routine-detail-status"
        )
        .textContent =
            `Semana ${
                progress.currentWeek
            } de ${
                routine.duration
            }`;


    document
        .getElementById(
            "routine-progress-bar"
        )
        .style
        .width =
            `${
                progress.percent
            }%`;


    const container =
        document.getElementById(
            "routine-detail-groups"
        );


    container.innerHTML =
        "";


    routine.groups.forEach(
        (
            group,
            groupIndex
        ) => {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "routine-detail-group";


            const estimated =
                formatEstimatedTime(
                    estimateGroupSeconds(
                        group
                    )
                );


            article.innerHTML = `

                <header
                    class="routine-group-header"
                >

                    <div
                        class="routine-group-top"
                    >

                        <div>

                            <small>

                                GRUPO
                                ${
                                    groupIndex
                                    +
                                    1
                                }

                            </small>

                            <h2>

                                ${
                                    escapeHtml(
                                        group.name
                                    )
                                }

                            </h2>

                            <p
                                class="routine-group-summary"
                            >

                                ${
                                    group.exercises.length
                                }
                                exercícios

                                ·

                                ${estimated}

                            </p>

                        </div>

                        <button
                            class="start-group-button"
                            type="button"
                        >

                            ▶ INICIAR

                        </button>

                    </div>

                </header>

                <div
                    class="routine-group-exercises"
                >
                </div>

            `;


            article
                .querySelector(
                    ".start-group-button"
                )
                .addEventListener(
                    "click",
                    () => {

                        startRoutineGroup(
                            routine.id,
                            group.id
                        );

                    }
                );


            const rows =
                article.querySelector(
                    ".routine-group-exercises"
                );


            group.exercises.forEach(
                (
                    item,
                    exerciseIndex
                ) => {

                    const exercise =
                        getExerciseById(
                            item.exerciseId
                        );


                    if (
                        !exercise
                    ) {

                        return;

                    }


                    const row =
                        document.createElement(
                            "button"
                        );


                    row.type =
                        "button";


                    row.className =
                        "routine-exercise-row";


                    row.innerHTML = `

                        <span
                            class="routine-exercise-number"
                        >

                            ${
                                exerciseIndex
                                +
                                1
                            }

                        </span>

                        <div
                            class="routine-exercise-info"
                        >

                            <strong>

                                ${
                                    escapeHtml(
                                        exercise.name
                                    )
                                }

                            </strong>

                            <span>

                                ${
                                    escapeHtml(
                                        formatRoutineExercise(
                                            item
                                        )
                                    )
                                }

                            </span>

                        </div>

                        <span
                            class="routine-exercise-arrow"
                        >
                            ›
                        </span>

                    `;


                    row.addEventListener(
                        "click",
                        () => {

                            openRoutineExerciseConfig(
                                routine.id,
                                group.id,
                                item.id
                            );

                        }
                    );


                    rows.appendChild(
                        row
                    );

                }
            );


            container.appendChild(
                article
            );

        }
    );


    showScreen(
        "routineDetail",
        pushHistory
    );

}


document
    .getElementById(
        "delete-routine"
    )
    .addEventListener(
        "click",
        () => {

            if (
                !selectedRoutineId
            ) {

                return;

            }


            if (
                !confirm(
                    "Excluir esta rotina?"
                )
            ) {

                return;

            }


            routines =
                routines.filter(
                    routine =>
                        routine.id !==
                        selectedRoutineId
                );


            saveRoutines();


            selectedRoutineId =
                null;


            screenHistory =
                [];


            showScreen(
                "routines",
                false
            );

        }
    );


// ==========================================================
// CONFIG EXERCÍCIO DA ROTINA
// ==========================================================

let routineEditMode =
    "reps";


let routineEditReps =
    12;


let routineEditSeconds =
    30;


let routineEditSets =
    3;


let routineEditRest =
    60;


let routineEditSupervision =
    true;


function getRoutineExerciseFromContext() {

    if (
        !routineConfigContext
    ) {

        return null;

    }


    const routine =
        routines.find(
            item =>
                item.id ===
                routineConfigContext.routineId
        );


    const group =
        routine?.groups
            .find(
                item =>
                    item.id ===
                    routineConfigContext.groupId
            );


    const item =
        group?.exercises
            .find(
                exercise =>
                    exercise.id ===
                    routineConfigContext.itemId
            );


    return {

        routine,
        group,
        item

    };

}


function openRoutineExerciseConfig(
    routineId,
    groupId,
    itemId
) {

    routineConfigContext = {

        routineId,
        groupId,
        itemId

    };


    const result =
        getRoutineExerciseFromContext();


    const item =
        result?.item;


    if (
        !item
    ) {

        return;

    }


    const exercise =
        getExerciseById(
            item.exerciseId
        );


    routineEditMode =
        item.mode;


    routineEditReps =
        item.reps;


    routineEditSeconds =
        item.seconds;


    routineEditSets =
        item.sets;


    routineEditRest =
        item.restSeconds;


    routineEditSupervision =
        item.supervision;


    document
        .getElementById(
            "routine-exercise-config-title"
        )
        .textContent =
            exercise?.name
            ||
            "Exercício";


    updateRoutineExerciseConfigUI();


    showScreen(
        "routineExerciseConfig"
    );

}


function updateRoutineExerciseConfigUI() {

    document
        .getElementById(
            "routine-mode-reps"
        )
        .classList
        .toggle(
            "active",
            routineEditMode ===
            "reps"
        );


    document
        .getElementById(
            "routine-mode-time"
        )
        .classList
        .toggle(
            "active",
            routineEditMode ===
            "time"
        );


    document
        .getElementById(
            "routine-reps-setting"
        )
        .classList
        .toggle(
            "hidden",
            routineEditMode !==
            "reps"
        );


    document
        .getElementById(
            "routine-time-setting"
        )
        .classList
        .toggle(
            "hidden",
            routineEditMode !==
            "time"
        );


    document
        .getElementById(
            "routine-reps-value"
        )
        .textContent =
            routineEditReps;


    document
        .getElementById(
            "routine-time-value"
        )
        .textContent =
            `${
                routineEditSeconds
            }s`;


    document
        .getElementById(
            "routine-sets-value"
        )
        .textContent =
            routineEditSets;


    document
        .getElementById(
            "routine-rest-value"
        )
        .textContent =
            `${
                routineEditRest
            }s`;


    document
        .getElementById(
            "routine-supervision"
        )
        .checked =
            routineEditSupervision;

}


document
    .getElementById(
        "routine-mode-reps"
    )
    .onclick =
        () => {

            routineEditMode =
                "reps";


            updateRoutineExerciseConfigUI();

        };


document
    .getElementById(
        "routine-mode-time"
    )
    .onclick =
        () => {

            routineEditMode =
                "time";


            updateRoutineExerciseConfigUI();

        };


document
    .getElementById(
        "routine-reps-minus"
    )
    .onclick =
        () => {

            routineEditReps =
                Math.max(
                    1,
                    routineEditReps
                    -
                    1
                );


            updateRoutineExerciseConfigUI();

        };


document
    .getElementById(
        "routine-reps-plus"
    )
    .onclick =
        () => {

            routineEditReps =
                Math.min(
                    100,
                    routineEditReps
                    +
                    1
                );


            updateRoutineExerciseConfigUI();

        };


document
    .getElementById(
        "routine-time-minus"
    )
    .onclick =
        () => {

            routineEditSeconds =
                Math.max(
                    5,
                    routineEditSeconds
                    -
                    5
                );


            updateRoutineExerciseConfigUI();

        };


document
    .getElementById(
        "routine-time-plus"
    )
    .onclick =
        () => {

            routineEditSeconds =
                Math.min(
                    600,
                    routineEditSeconds
                    +
                    5
                );


            updateRoutineExerciseConfigUI();

        };


document
    .getElementById(
        "routine-sets-minus"
    )
    .onclick =
        () => {

            routineEditSets =
                Math.max(
                    1,
                    routineEditSets
                    -
                    1
                );


            updateRoutineExerciseConfigUI();

        };


document
    .getElementById(
        "routine-sets-plus"
    )
    .onclick =
        () => {

            routineEditSets =
                Math.min(
                    20,
                    routineEditSets
                    +
                    1
                );


            updateRoutineExerciseConfigUI();

        };


document
    .getElementById(
        "routine-rest-minus"
    )
    .onclick =
        () => {

            routineEditRest =
                Math.max(
                    0,
                    routineEditRest
                    -
                    15
                );


            updateRoutineExerciseConfigUI();

        };


document
    .getElementById(
        "routine-rest-plus"
    )
    .onclick =
        () => {

            routineEditRest =
                Math.min(
                    600,
                    routineEditRest
                    +
                    15
                );


            updateRoutineExerciseConfigUI();

        };


document
    .getElementById(
        "routine-supervision"
    )
    .addEventListener(
        "change",
        event => {

            routineEditSupervision =
                event.target.checked;

        }
    );


document
    .getElementById(
        "save-routine-exercise-config"
    )
    .addEventListener(
        "click",
        () => {

            const result =
                getRoutineExerciseFromContext();


            const routine =
                result?.routine;


            const item =
                result?.item;


            if (
                !routine
                ||
                !item
            ) {

                return;

            }


            item.mode =
                routineEditMode;


            item.reps =
                routineEditReps;


            item.seconds =
                routineEditSeconds;


            item.sets =
                routineEditSets;


            item.restSeconds =
                routineEditRest;


            item.supervision =
                routineEditSupervision;


            saveRoutines();


            const routineId =
                routine.id;


            screenHistory.pop();


            openRoutineDetail(
                routineId,
                false
            );

        }
    );


// ==========================================================
// ADICIONAR À ROTINA
// ==========================================================

document
    .getElementById(
        "add-to-routine-button"
    )
    .addEventListener(
        "click",
        () => {

            if (
                !routines.length
            ) {

                alert(
                    "Crie uma rotina primeiro."
                );


                openRoutineCreator();


                return;

            }


            const routine =
                routines[0];


            const group =
                routine.groups[0];


            if (
                !group
            ) {

                alert(
                    "A rotina ainda não possui grupos."
                );


                return;

            }


            const exists =
                group.exercises.some(
                    item =>
                        item.exerciseId ===
                        selectedExercise.id
                );


            if (
                !exists
            ) {

                group.exercises.push(
                    createRoutineExercise(
                        selectedExercise.id
                    )
                );


                saveRoutines();

            }


            alert(
                `${
                    selectedExercise.name
                } foi adicionado a ${
                    routine.name
                }.`
            );

        }
    );


// ==========================================================
// SETTINGS
// ==========================================================

function saveSettings() {

    saveJSON(
        STORAGE.settings,
        settings
    );

}


function loadSettingsToUI() {

    const mapping = {

        "setting-sound":
            "sound",

        "setting-vibration":
            "vibration",

        "setting-countdown":
            "countdown",

        "setting-skeleton":
            "skeleton",

        "setting-reference":
            "reference",

        "setting-mirror":
            "mirror",

        "setting-history":
            "history",

        "setting-community":
            "community",

        "hud-show-counter":
            "hudCounter",

        "hud-show-series":
            "hudSeries",

        "hud-show-message":
            "hudMessage",

        "hud-show-time":
            "hudTime"

    };


    for (
        const [
            id,
            key
        ]
        of Object.entries(
            mapping
        )
    ) {

        const element =
            document.getElementById(
                id
            );


        if (
            !element
        ) {

            continue;

        }


        element.checked =
            Boolean(
                settings[
                    key
                ]
            );


        element.onchange =
            () => {

                settings[
                    key
                ] =
                    element.checked;


                saveSettings();

                updateHudPreview();

                applyLiveHudSettings();

            };

    }


    setupHudEditor();

}


document
    .getElementById(
        "open-hud-editor"
    )
    .onclick =
        () => {

            showScreen(
                "hudEditor"
            );


            setTimeout(
                updateHudPreview,
                50
            );

        };


// ==========================================================
// HUD EDITOR
// ==========================================================

const hudClassToKey = {

    "hud-reps":
        "counter",

    "hud-series":
        "series",

    "hud-message":
        "message",

    "hud-time":
        "time"

};


function positionHudBox(
    element,
    position
) {

    element.style.left =
        `${
            position.x
        }%`;


    element.style.top =
        `${
            position.y
        }%`;

}


function setupHudEditor() {

    const area =
        document.querySelector(
            ".hud-preview-camera"
        );


    if (
        !area
    ) {

        return;

    }


    Object.entries(
        hudClassToKey
    )
        .forEach(
            (
                [
                    className,
                    key
                ]
            ) => {

                const box =
                    area.querySelector(
                        `.${className}`
                    );


                if (
                    !box
                ) {

                    return;

                }


                box.dataset.hudKey =
                    key;


                box.onpointerdown =
                    event => {

                        startHudDrag(
                            event,
                            box,
                            area
                        );

                    };

            }
        );


    updateHudPreview();

}


function startHudDrag(
    event,
    box,
    area
) {

    event.preventDefault();


    box.setPointerCapture(
        event.pointerId
    );


    box.classList.add(
        "dragging"
    );


    const move =
        moveEvent => {

            const rect =
                area.getBoundingClientRect();


            let x =
                (
                    (
                        moveEvent.clientX
                        -
                        rect.left
                    )
                    /
                    rect.width
                )
                *
                100;


            let y =
                (
                    (
                        moveEvent.clientY
                        -
                        rect.top
                    )
                    /
                    rect.height
                )
                *
                100;


            x =
                Math.max(
                    6,
                    Math.min(
                        94,
                        x
                    )
                );


            y =
                Math.max(
                    5,
                    Math.min(
                        95,
                        y
                    )
                );


            settings
                .hudPositions[
                    box.dataset.hudKey
                ] =
                {

                    x,
                    y

                };


            positionHudBox(
                box,
                {
                    x,
                    y
                }
            );

        };


    const end =
        () => {

            box.classList.remove(
                "dragging"
            );


            box.removeEventListener(
                "pointermove",
                move
            );


            box.removeEventListener(
                "pointerup",
                end
            );


            box.removeEventListener(
                "pointercancel",
                end
            );


            saveSettings();

            applyLiveHudSettings();

        };


    box.addEventListener(
        "pointermove",
        move
    );


    box.addEventListener(
        "pointerup",
        end
    );


    box.addEventListener(
        "pointercancel",
        end
    );

}


function updateHudPreview() {

    const area =
        document.querySelector(
            ".hud-preview-camera"
        );


    if (
        !area
    ) {

        return;

    }


    const visibility = {

        counter:
            settings.hudCounter,

        series:
            settings.hudSeries,

        message:
            settings.hudMessage,

        time:
            settings.hudTime

    };


    Object.entries(
        hudClassToKey
    )
        .forEach(
            (
                [
                    className,
                    key
                ]
            ) => {

                const box =
                    area.querySelector(
                        `.${className}`
                    );


                if (
                    !box
                ) {

                    return;

                }


                positionHudBox(
                    box,
                    settings.hudPositions[
                        key
                    ]
                );


                box.classList.toggle(
                    "hidden",
                    !visibility[
                        key
                    ]
                );

            }
        );

}


// ==========================================================
// CONFIG EXERCÍCIO AVULSO
// ==========================================================

let workoutMode =
    "reps";


let targetReps =
    5;


let targetSeconds =
    30;


let totalSets =
    3;


let supervisionEnabled =
    true;


let currentRestSeconds =
    60;


function updateConfigNumbers() {

    document
        .getElementById(
            "reps-value"
        )
        .textContent =
            targetReps;


    document
        .getElementById(
            "time-value"
        )
        .textContent =
            `${
                targetSeconds
            }s`;


    document
        .getElementById(
            "sets-value"
        )
        .textContent =
            totalSets;

}


document
    .getElementById(
        "mode-reps"
    )
    .onclick =
        () => {

            workoutMode =
                "reps";


            document
                .getElementById(
                    "mode-reps"
                )
                .classList.add(
                    "active"
                );


            document
                .getElementById(
                    "mode-time"
                )
                .classList.remove(
                    "active"
                );


            document
                .getElementById(
                    "reps-setting"
                )
                .classList.remove(
                    "hidden"
                );


            document
                .getElementById(
                    "time-setting"
                )
                .classList.add(
                    "hidden"
                );

        };


document
    .getElementById(
        "mode-time"
    )
    .onclick =
        () => {

            workoutMode =
                "time";


            document
                .getElementById(
                    "mode-time"
                )
                .classList.add(
                    "active"
                );


            document
                .getElementById(
                    "mode-reps"
                )
                .classList.remove(
                    "active"
                );


            document
                .getElementById(
                    "time-setting"
                )
                .classList.remove(
                    "hidden"
                );


            document
                .getElementById(
                    "reps-setting"
                )
                .classList.add(
                    "hidden"
                );

        };


document
    .getElementById(
        "reps-minus"
    )
    .onclick =
        () => {

            targetReps =
                Math.max(
                    1,
                    targetReps
                    -
                    1
                );


            updateConfigNumbers();

        };


document
    .getElementById(
        "reps-plus"
    )
    .onclick =
        () => {

            targetReps =
                Math.min(
                    100,
                    targetReps
                    +
                    1
                );


            updateConfigNumbers();

        };


document
    .getElementById(
        "time-minus"
    )
    .onclick =
        () => {

            targetSeconds =
                Math.max(
                    5,
                    targetSeconds
                    -
                    5
                );


            updateConfigNumbers();

        };


document
    .getElementById(
        "time-plus"
    )
    .onclick =
        () => {

            targetSeconds =
                Math.min(
                    600,
                    targetSeconds
                    +
                    5
                );


            updateConfigNumbers();

        };


document
    .getElementById(
        "sets-minus"
    )
    .onclick =
        () => {

            totalSets =
                Math.max(
                    1,
                    totalSets
                    -
                    1
                );


            updateConfigNumbers();

        };


document
    .getElementById(
        "sets-plus"
    )
    .onclick =
        () => {

            totalSets =
                Math.min(
                    20,
                    totalSets
                    +
                    1
                );


            updateConfigNumbers();

        };


document
    .getElementById(
        "supervision-on"
    )
    .onclick =
        () => {

            supervisionEnabled =
                true;


            document
                .getElementById(
                    "supervision-on"
                )
                .classList.add(
                    "active"
                );


            document
                .getElementById(
                    "supervision-off"
                )
                .classList.remove(
                    "active"
                );

        };


document
    .getElementById(
        "supervision-off"
    )
    .onclick =
        () => {

            supervisionEnabled =
                false;


            document
                .getElementById(
                    "supervision-off"
                )
                .classList.add(
                    "active"
                );


            document
                .getElementById(
                    "supervision-on"
                )
                .classList.remove(
                    "active"
                );

        };


// ==========================================================
// BODY ENGINE
// ==========================================================

const video =
    document.getElementById(
        "camera"
    );


const canvas =
    document.getElementById(
        "overlay"
    );


const ctx =
    canvas.getContext(
        "2d"
    );


const targetCanvas =
    document.getElementById(
        "target-overlay"
    );


const targetCtx =
    targetCanvas.getContext(
        "2d"
    );


const workoutScreen =
    document.getElementById(
        "screen-workout"
    );


let poseLandmarker =
    null;


let stream =
    null;


let running =
    false;


let processing =
    false;


let facingMode =
    "user";


let lastVideoTime =
    -1;


let targetAnimationFrame =
    null;


const previousPoints =
    new Map();


const MODEL_URL =
    "https://storage.googleapis.com/"
    +
    "mediapipe-models/"
    +
    "pose_landmarker/"
    +
    "pose_landmarker_lite/"
    +
    "float16/1/"
    +
    "pose_landmarker_lite.task";


const BODY_COLOR = {

    r:
        245,

    g:
        245,

    b:
        245

};


const YELLOW = {

    r:
        243,

    g:
        230,

    b:
        0

};


const BODY_CONNECTIONS = [

    [11, 13],
    [13, 15],

    [12, 14],
    [14, 16],

    [23, 25],
    [25, 27],

    [24, 26],
    [26, 28],

    [27, 29],
    [29, 31],

    [28, 30],
    [30, 32]

];


function rgba(
    color,
    alpha
) {

    return (
        `rgba(`
        +
        `${color.r},`
        +
        `${color.g},`
        +
        `${color.b},`
        +
        `${alpha})`
    );

}


function midpoint(
    a,
    b
) {

    return {

        x:
            (
                a.x
                +
                b.x
            )
            /
            2,

        y:
            (
                a.y
                +
                b.y
            )
            /
            2

    };

}


function distance(
    a,
    b
) {

    const dx =
        b.x
        -
        a.x;


    const dy =
        b.y
        -
        a.y;


    return Math.sqrt(
        dx
        *
        dx
        +
        dy
        *
        dy
    );

}


async function initializePoseLandmarker() {

    if (
        poseLandmarker
    ) {

        return;

    }


    const vision =
        await FilesetResolver
            .forVisionTasks(

                "https://cdn.jsdelivr.net/npm/"
                +
                "@mediapipe/tasks-vision@latest/wasm"

            );


    poseLandmarker =
        await PoseLandmarker
            .createFromOptions(

                vision,

                {

                    baseOptions: {

                        modelAssetPath:
                            MODEL_URL

                    },

                    runningMode:
                        "VIDEO",

                    numPoses:
                        1,

                    minPoseDetectionConfidence:
                        .55,

                    minPosePresenceConfidence:
                        .55,

                    minTrackingConfidence:
                        .55,

                    outputSegmentationMasks:
                        false

                }

            );

}


async function startCamera() {

    stopCamera();


    stream =
        await navigator
            .mediaDevices
            .getUserMedia(
                {

                    audio:
                        false,

                    video: {

                        facingMode: {

                            ideal:
                                facingMode

                        },

                        width: {

                            ideal:
                                960

                        },

                        height: {

                            ideal:
                                540

                        },

                        frameRate: {

                            ideal:
                                60,

                            min:
                                30

                        }

                    }

                }
            );


    video.srcObject =
        stream;


    await video.play();


    updateMirror();


    previousPoints.clear();


    lastVideoTime =
        -1;


    running =
        true;


    resizeCanvases();

    startVideoLoop();

}


function stopCamera() {

    running =
        false;


    if (
        stream
    ) {

        stream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

    }


    stream =
        null;

}


function updateMirror() {

    const mirror =
        facingMode ===
        "user"
        &&
        settings.mirror;


    video.style.transform =
        mirror
            ?
            "scaleX(-1)"
            :
            "scaleX(1)";

}


function resizeCanvases() {

    const width =
        window.innerWidth;


    const height =
        window.innerHeight;


    const dpr =
        window.devicePixelRatio
        ||
        1;


    [
        [
            canvas,
            ctx
        ],

        [
            targetCanvas,
            targetCtx
        ]

    ]
        .forEach(
            (
                [
                    element,
                    context
                ]
            ) => {

                element.width =
                    Math.round(
                        width
                        *
                        dpr
                    );


                element.height =
                    Math.round(
                        height
                        *
                        dpr
                    );


                element.style.width =
                    `${width}px`;


                element.style.height =
                    `${height}px`;


                context.setTransform(
                    dpr,
                    0,
                    0,
                    dpr,
                    0,
                    0
                );

            }
        );

}


function landmarkToScreen(
    landmark
) {

    const videoWidth =
        video.videoWidth;


    const videoHeight =
        video.videoHeight;


    const screenWidth =
        video.clientWidth;


    const screenHeight =
        video.clientHeight;


    if (
        !videoWidth
        ||
        !videoHeight
    ) {

        return {

            x:
                0,

            y:
                0

        };

    }


    const videoRatio =
        videoWidth
        /
        videoHeight;


    const screenRatio =
        screenWidth
        /
        screenHeight;


    let renderedWidth;

    let renderedHeight;

    let offsetX;

    let offsetY;


    if (
        videoRatio >
        screenRatio
    ) {

        renderedHeight =
            screenHeight;


        renderedWidth =
            renderedHeight
            *
            videoRatio;


        offsetX =
            (
                screenWidth
                -
                renderedWidth
            )
            /
            2;


        offsetY =
            0;

    }

    else {

        renderedWidth =
            screenWidth;


        renderedHeight =
            renderedWidth
            /
            videoRatio;


        offsetX =
            0;


        offsetY =
            (
                screenHeight
                -
                renderedHeight
            )
            /
            2;

    }


    let x =
        landmark.x
        *
        renderedWidth
        +
        offsetX;


    const y =
        landmark.y
        *
        renderedHeight
        +
        offsetY;


    if (
        facingMode ===
        "user"
        &&
        settings.mirror
    ) {

        x =
            screenWidth
            -
            x;

    }


    return {

        x,
        y

    };

}


function smoothPoint(
    index,
    point
) {

    const previous =
        previousPoints.get(
            index
        );


    if (
        !previous
    ) {

        previousPoints.set(
            index,
            point
        );


        return point;

    }


    const movement =
        distance(
            previous,
            point
        );


    let alpha;


    if (
        movement <
        1
    ) {

        alpha =
            .38;

    }

    else if (
        movement <
        3
    ) {

        alpha =
            .58;

    }

    else if (
        movement <
        8
    ) {

        alpha =
            .78;

    }

    else if (
        movement <
        18
    ) {

        alpha =
            .91;

    }

    else {

        alpha =
            .985;

    }


    const result = {

        x:
            previous.x
            +
            (
                point.x
                -
                previous.x
            )
            *
            alpha,

        y:
            previous.y
            +
            (
                point.y
                -
                previous.y
            )
            *
            alpha

    };


    previousPoints.set(
        index,
        result
    );


    return result;

}


function drawBodySegment(
    a,
    b
) {

    if (
        !a
        ||
        !b
        ||
        !settings.skeleton
    ) {

        return;

    }


    ctx.save();


    ctx.lineCap =
        "round";


    ctx.beginPath();


    ctx.moveTo(
        a.x,
        a.y
    );


    ctx.lineTo(
        b.x,
        b.y
    );


    ctx.strokeStyle =
        rgba(
            BODY_COLOR,
            .95
        );


    ctx.lineWidth =
        3;


    ctx.shadowBlur =
        7;


    ctx.shadowColor =
        rgba(
            BODY_COLOR,
            .24
        );


    ctx.stroke();

    ctx.restore();

}


function drawBodyJoint(
    point
) {

    if (
        !point
        ||
        !settings.skeleton
    ) {

        return;

    }


    ctx.beginPath();


    ctx.arc(
        point.x,
        point.y,
        5,
        0,
        Math.PI
        *
        2
    );


    ctx.strokeStyle =
        rgba(
            BODY_COLOR,
            .95
        );


    ctx.lineWidth =
        1.6;


    ctx.stroke();

}


function calculateHandEndpoint(
    points,
    side
) {

    const wrist =
        points[
            side ===
            "left"
                ?
                15
                :
                16
        ];


    const ids =
        side ===
        "left"
            ?
            [
                17,
                19,
                21
            ]
            :
            [
                18,
                20,
                22
            ];


    if (
        !wrist
        ||
        !points[
            ids[0]
        ]
        ||
        !points[
            ids[1]
        ]
        ||
        !points[
            ids[2]
        ]
    ) {

        return null;

    }


    const center = {

        x:
            (
                points[
                    ids[0]
                ].x
                +
                points[
                    ids[1]
                ].x
                +
                points[
                    ids[2]
                ].x
            )
            /
            3,

        y:
            (
                points[
                    ids[0]
                ].y
                +
                points[
                    ids[1]
                ].y
                +
                points[
                    ids[2]
                ].y
            )
            /
            3

    };


    return {

        x:
            wrist.x
            +
            (
                center.x
                -
                wrist.x
            )
            *
            1.22,

        y:
            wrist.y
            +
            (
                center.y
                -
                wrist.y
            )
            *
            1.22

    };

}


function drawPose(
    landmarks
) {

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );


    const points =
        [];


    for (
        let index =
            0;
        index <
        landmarks.length;
        index++
    ) {

        points[
            index
        ] =
            smoothPoint(
                index,
                landmarkToScreen(
                    landmarks[
                        index
                    ]
                )
            );

    }


    BODY_CONNECTIONS
        .forEach(
            (
                [
                    a,
                    b
                ]
            ) => {

                drawBodySegment(
                    points[a],
                    points[b]
                );

            }
        );


    drawBodySegment(
        points[11],
        points[12]
    );


    drawBodySegment(
        points[23],
        points[24]
    );


    drawBodySegment(
        points[11],
        points[23]
    );


    drawBodySegment(
        points[12],
        points[24]
    );


    const shoulderCenter =
        midpoint(
            points[11],
            points[12]
        );


    const hipCenter =
        midpoint(
            points[23],
            points[24]
        );


    drawBodySegment(
        shoulderCenter,
        hipCenter
    );


    drawBodySegment(
        points[15],
        calculateHandEndpoint(
            points,
            "left"
        )
    );


    drawBodySegment(
        points[16],
        calculateHandEndpoint(
            points,
            "right"
        )
    );


    [
        11,
        12,
        13,
        14,
        15,
        16,
        23,
        24,
        25,
        26,
        27,
        28
    ]
        .forEach(
            index => {

                drawBodyJoint(
                    points[
                        index
                    ]
                );

            }
        );

}


// ==========================================================
// MOTION RECORDER
// ==========================================================

const RECORD_MAX_MS =
    8000;


const RECORD_SAMPLE_MS =
    66;


let recorderMode =
    false;


let isRecordingMotion =
    false;


let recordedFrames =
    [];


let recordingStartedAt =
    0;


let lastRecordedSample =
    -Infinity;


let recordingTimer =
    null;


let pendingExerciseName =
    "";


let pendingExerciseCategory =
    "";


let currentPoseDetected =
    false;


let reviewAnimationFrame =
    null;


function captureMotionFrame(
    landmarks,
    timestamp
) {

    if (
        !recorderMode
        ||
        !isRecordingMotion
    ) {

        return;

    }


    const elapsed =
        timestamp
        -
        recordingStartedAt;


    if (
        elapsed
        -
        lastRecordedSample
        <
        RECORD_SAMPLE_MS
    ) {

        return;

    }


    lastRecordedSample =
        elapsed;


    recordedFrames.push(
        {

            t:
                Math.round(
                    elapsed
                ),

            landmarks:
                landmarks.map(
                    landmark => ({

                        x:
                            Number(
                                landmark.x
                                    .toFixed(
                                        5
                                    )
                            ),

                        y:
                            Number(
                                landmark.y
                                    .toFixed(
                                        5
                                    )
                            ),

                        z:
                            Number(
                                (
                                    landmark.z
                                    ||
                                    0
                                )
                                .toFixed(
                                    5
                                )
                            ),

                        visibility:
                            Number(
                                (
                                    landmark.visibility
                                    ??
                                    1
                                )
                                .toFixed(
                                    3
                                )
                            )

                    })
                )

        }
    );


    if (
        elapsed >=
        RECORD_MAX_MS
    ) {

        stopMotionRecording();

    }

}


function ensureRecorderHud() {

    let hud =
        document.getElementById(
            "recorder-hud"
        );


    if (
        hud
    ) {

        return hud;

    }


    hud =
        document.createElement(
            "div"
        );


    hud.id =
        "recorder-hud";


    hud.className =
        "recorder-hud hidden";


    hud.innerHTML = `

        <div
            class="recorder-top"
        >

            <div
                id="recorder-status"
                class="recorder-status"
            >
                PROCURANDO CORPO
            </div>

            <button
                id="recorder-close"
                class="recorder-close"
                type="button"
            >
                ×
            </button>

        </div>

        <div
            class="recorder-center"
        >

            <strong
                id="recorder-time"
            >
                00:00.0
            </strong>

            <span>
                MÁXIMO 8 SEGUNDOS
            </span>

        </div>

        <div
            class="recorder-privacy"
        >

            <strong>
                BODY ENGINE ONLY
            </strong>

            <span>
                Vídeo não salvo · Áudio não salvo · Landmarks gravados
            </span>

        </div>

        <button
            id="recorder-action"
            class="recorder-action"
            type="button"
        >
            ● INICIAR GRAVAÇÃO
        </button>

    `;


    workoutScreen.appendChild(
        hud
    );


    hud
        .querySelector(
            "#recorder-close"
        )
        .onclick =
            () => {

                exitRecorder();

            };


    hud
        .querySelector(
            "#recorder-action"
        )
        .onclick =
            () => {

                if (
                    isRecordingMotion
                ) {

                    stopMotionRecording();

                }

                else {

                    startMotionRecording();

                }

            };


    return hud;

}


function updateRecorderDetection(
    detected
) {

    currentPoseDetected =
        detected;


    const status =
        document.getElementById(
            "recorder-status"
        );


    if (
        !status
    ) {

        return;

    }


    if (
        isRecordingMotion
    ) {

        status.textContent =
            detected
                ?
                "● GRAVANDO ESQUELETO"
                :
                "● CORPO PERDIDO";


        status.classList.add(
            "recording"
        );


        return;

    }


    status.classList.remove(
        "recording"
    );


    status.textContent =
        detected
            ?
            "CORPO DETECTADO"
            :
            "PROCURANDO CORPO";

}


function startMotionRecording() {

    if (
        !currentPoseDetected
    ) {

        alert(
            "Posicione o corpo no enquadramento."
        );


        return;

    }


    recordedFrames =
        [];


    isRecordingMotion =
        true;


    recordingStartedAt =
        performance.now();


    lastRecordedSample =
        -Infinity;


    const button =
        document.getElementById(
            "recorder-action"
        );


    button.textContent =
        "■ PARAR GRAVAÇÃO";


    button.classList.add(
        "recording"
    );


    clearInterval(
        recordingTimer
    );


    recordingTimer =
        setInterval(
            () => {

                const elapsed =
                    Math.min(
                        performance.now()
                        -
                        recordingStartedAt,
                        RECORD_MAX_MS
                    );


                document
                    .getElementById(
                        "recorder-time"
                    )
                    .textContent =
                        `00:${
                            (
                                elapsed
                                /
                                1000
                            )
                            .toFixed(
                                1
                            )
                            .padStart(
                                4,
                                "0"
                            )
                        }`;


                if (
                    elapsed >=
                    RECORD_MAX_MS
                ) {

                    stopMotionRecording();

                }

            },
            50
        );

}


function stopMotionRecording() {

    if (
        !isRecordingMotion
    ) {

        return;

    }


    isRecordingMotion =
        false;


    clearInterval(
        recordingTimer
    );


    const button =
        document.getElementById(
            "recorder-action"
        );


    if (
        button
    ) {

        button.textContent =
            "● INICIAR GRAVAÇÃO";


        button.classList.remove(
            "recording"
        );

    }


    if (
        recordedFrames.length <
        10
    ) {

        alert(
            "Poucos dados foram capturados. Grave novamente."
        );


        return;

    }


    stopCamera();

    showMotionReview();

}


function showMotionReview() {

    document
        .getElementById(
            "recorder-hud"
        )
        ?.classList
        .add(
            "hidden"
        );


    video.classList.add(
        "hidden"
    );


    canvas.classList.add(
        "hidden"
    );


    targetCanvas.classList.add(
        "hidden"
    );


    document
        .getElementById(
            "motion-review"
        )
        ?.remove();


    const duration =
        recordedFrames[
            recordedFrames.length
            -
            1
        ].t;


    const review =
        document.createElement(
            "div"
        );


    review.id =
        "motion-review";


    review.className =
        "motion-review";


    review.innerHTML = `

        <p
            class="eyebrow"
        >
            MOVIMENTO CAPTURADO
        </p>

        <h2>

            ${
                escapeHtml(
                    pendingExerciseName
                )
            }

        </h2>

        <p>
            Prévia criada apenas com os landmarks gravados.
        </p>

        <canvas
            id="motion-review-canvas"
            class="motion-review-canvas"
        >
        </canvas>

        <div
            class="motion-review-stats"
        >

            <div>

                <strong>
                    ${
                        recordedFrames.length
                    }
                </strong>

                <span>
                    FRAMES CORPORAIS
                </span>

            </div>

            <div>

                <strong>
                    ${
                        (
                            duration
                            /
                            1000
                        )
                        .toFixed(
                            1
                        )
                    }s
                </strong>

                <span>
                    DURAÇÃO
                </span>

            </div>

        </div>

        <div
            class="motion-review-buttons"
        >

            <button
                id="review-record-again"
                class="outline-button"
                type="button"
            >
                GRAVAR NOVAMENTE
            </button>

            <button
                id="review-discard"
                class="outline-button"
                type="button"
            >
                DESCARTAR
            </button>

            <button
                id="review-save"
                class="yellow-button"
                type="button"
            >
                SALVAR EXERCÍCIO
            </button>

        </div>

    `;


    workoutScreen.appendChild(
        review
    );


    document
        .getElementById(
            "review-record-again"
        )
        .onclick =
            restartMotionRecorder;


    document
        .getElementById(
            "review-discard"
        )
        .onclick =
            () => {

                exitRecorder();

            };


    document
        .getElementById(
            "review-save"
        )
        .onclick =
            saveRecordedExercise;


    startReviewPlayback();

}


function getRecordedFrameAt(
    frames,
    time
) {

    let selected =
        frames[0];


    for (
        let index =
            1;
        index <
        frames.length;
        index++
    ) {

        if (
            frames[
                index
            ].t >
            time
        ) {

            break;

        }


        selected =
            frames[
                index
            ];

    }


    return selected;

}


function drawMotionFrameOnCanvas(
    context,
    landmarks,
    width,
    height,
    mirror
) {

    context.clearRect(
        0,
        0,
        width,
        height
    );


    if (
        !landmarks
    ) {

        return;

    }


    const points =
        landmarks.map(
            landmark => {

                let x =
                    landmark.x
                    *
                    width;


                if (
                    mirror
                ) {

                    x =
                        width
                        -
                        x;

                }


                return {

                    x,

                    y:
                        landmark.y
                        *
                        height

                };

            }
        );


    const connections = [

        ...BODY_CONNECTIONS,

        [11, 12],

        [23, 24],

        [11, 23],

        [12, 24]

    ];


    context.save();


    context.lineCap =
        "round";


    context.strokeStyle =
        rgba(
            YELLOW,
            .72
        );


    context.lineWidth =
        3;


    connections.forEach(
        (
            [
                a,
                b
            ]
        ) => {

            if (
                !points[a]
                ||
                !points[b]
            ) {

                return;

            }


            context.beginPath();


            context.moveTo(
                points[a].x,
                points[a].y
            );


            context.lineTo(
                points[b].x,
                points[b].y
            );


            context.stroke();

        }
    );


    context.restore();

}


function startReviewPlayback() {

    cancelAnimationFrame(
        reviewAnimationFrame
    );


    const reviewCanvas =
        document.getElementById(
            "motion-review-canvas"
        );


    if (
        !reviewCanvas
    ) {

        return;

    }


    const reviewCtx =
        reviewCanvas.getContext(
            "2d"
        );


    const rect =
        reviewCanvas.getBoundingClientRect();


    const dpr =
        window.devicePixelRatio
        ||
        1;


    reviewCanvas.width =
        rect.width
        *
        dpr;


    reviewCanvas.height =
        rect.height
        *
        dpr;


    reviewCtx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    const duration =
        Math.max(
            300,
            recordedFrames[
                recordedFrames.length
                -
                1
            ].t
        );


    const start =
        performance.now();


    const animate =
        timestamp => {

            if (
                !document.getElementById(
                    "motion-review"
                )
            ) {

                return;

            }


            const elapsed =
                (
                    timestamp
                    -
                    start
                )
                %
                duration;


            const frame =
                getRecordedFrameAt(
                    recordedFrames,
                    elapsed
                );


            drawMotionFrameOnCanvas(
                reviewCtx,
                frame.landmarks,
                rect.width,
                rect.height,
                true
            );


            reviewAnimationFrame =
                requestAnimationFrame(
                    animate
                );

        };


    reviewAnimationFrame =
        requestAnimationFrame(
            animate
        );

}


function restartMotionRecorder() {

    cancelAnimationFrame(
        reviewAnimationFrame
    );


    document
        .getElementById(
            "motion-review"
        )
        ?.remove();


    video.classList.remove(
        "hidden"
    );


    canvas.classList.remove(
        "hidden"
    );


    ensureRecorderHud()
        .classList
        .remove(
            "hidden"
        );


    recordedFrames =
        [];


    initializePoseLandmarker()
        .then(
            startCamera
        );

}


function saveRecordedExercise() {

    const duration =
        recordedFrames[
            recordedFrames.length
            -
            1
        ].t;


    const exercise = {

        id:
            `custom-${
                Date.now()
            }`,

        name:
            pendingExerciseName,

        muscles:
            pendingExerciseCategory,

        badge:
            "CRIADO POR VOCÊ",

        symbol:
            "◎",

        motion:
            "recorded",

        popularity:
            0,

        createdAt:
            Date.now(),

        durationMs:
            duration,

        frames:
            recordedFrames

    };


    createdExercises.unshift(
        exercise
    );


    try {

        saveJSON(
            STORAGE.createdExercises,
            createdExercises
        );

    }

    catch {

        createdExercises.shift();


        alert(
            "O movimento ficou grande demais para o armazenamento local."
        );


        return;

    }


    exitRecorder(
        false
    );


    currentExploreFilter =
        "new";


    renderExplore();

    refreshAccountUI();


    showScreen(
        "library",
        false
    );

}


document
    .getElementById(
        "prepare-recording"
    )
    .onclick =
        () => {

            const name =
                document
                    .getElementById(
                        "creator-exercise-name"
                    )
                    .value
                    .trim();


            if (
                !name
            ) {

                alert(
                    "Digite o nome do exercício."
                );


                return;

            }


            pendingExerciseName =
                name;


            pendingExerciseCategory =
                document
                    .getElementById(
                        "creator-category"
                    )
                    .value;


            showScreen(
                "recordPrep"
            );

        };


document
    .getElementById(
        "record-demo-button"
    )
    .onclick =
        async () => {

            try {

                await beginMotionRecorder();

            }

            catch (
                error
            ) {

                console.error(
                    error
                );


                alert(
                    "Não foi possível iniciar o Motion Recorder."
                );

            }

        };


async function beginMotionRecorder() {

    recorderMode =
        true;


    isRecordingMotion =
        false;


    recordedFrames =
        [];


    Object
        .values(
            screens
        )
        .forEach(
            screen => {

                screen.classList.remove(
                    "active"
                );

            }
        );


    appHeader.classList.add(
        "hidden"
    );


    bottomNav.classList.add(
        "hidden"
    );


    workoutScreen.classList.remove(
        "hidden"
    );


    document
        .querySelector(
            ".workout-header"
        )
        .classList
        .add(
            "hidden"
        );


    document
        .querySelector(
            ".workout-footer"
        )
        .classList
        .add(
            "hidden"
        );


    ensureLiveHud()
        .classList
        .add(
            "hidden"
        );


    targetCanvas.classList.add(
        "hidden"
    );


    video.classList.remove(
        "hidden"
    );


    canvas.classList.remove(
        "hidden"
    );


    ensureRecorderHud()
        .classList
        .remove(
            "hidden"
        );


    await initializePoseLandmarker();

    await startCamera();

}


function exitRecorder(
    returnToCreator = true
) {

    recorderMode =
        false;


    isRecordingMotion =
        false;


    clearInterval(
        recordingTimer
    );


    cancelAnimationFrame(
        reviewAnimationFrame
    );


    stopCamera();


    recordedFrames =
        [];


    document
        .getElementById(
            "motion-review"
        )
        ?.remove();


    document
        .getElementById(
            "recorder-hud"
        )
        ?.classList
        .add(
            "hidden"
        );


    workoutScreen.classList.add(
        "hidden"
    );


    document
        .querySelector(
            ".workout-header"
        )
        .classList
        .remove(
            "hidden"
        );


    document
        .querySelector(
            ".workout-footer"
        )
        .classList
        .remove(
            "hidden"
        );


    appHeader.classList.remove(
        "hidden"
    );


    if (
        returnToCreator
    ) {

        showScreen(
            "createExercise",
            false
        );

    }

}


// ==========================================================
// HUD DE AGACHAMENTO
// ==========================================================

let squatAutoAdvanceLocked =
    false;


let squatStandingSince =
    null;


function ensureSquatHud() {

    const layer =
        ensureLiveHud();


    let biomech =
        document.getElementById(
            "squat-biomech"
        );


    if (
        !biomech
    ) {

        biomech =
            document.createElement(
                "div"
            );


        biomech.id =
            "squat-biomech";


        biomech.className =
            "live-hud-box";


        biomech.style.left =
            "20%";


        biomech.style.top =
            "47%";


        biomech.style.minWidth =
            "126px";


        biomech.style.padding =
            "11px 12px";


        biomech.style.textAlign =
            "left";


        biomech.innerHTML = `

            <small
                style="
                    color:#f3e600;
                    font-size:7px;
                    font-weight:900;
                    letter-spacing:1px;
                "
            >
                BIOMECÂNICA
            </small>

            <div
                style="
                    margin-top:8px;
                    display:grid;
                    gap:5px;
                    font-size:9px;
                "
            >

                <span>

                    JOELHO

                    <strong
                        id="squat-knee"
                        style="
                            display:inline;
                            float:right;
                            font-size:10px;
                        "
                    >
                        --°
                    </strong>

                </span>

                <span>

                    QUADRIL

                    <strong
                        id="squat-hip"
                        style="
                            display:inline;
                            float:right;
                            font-size:10px;
                        "
                    >
                        --°
                    </strong>

                </span>

                <span>

                    TRONCO

                    <strong
                        id="squat-torso"
                        style="
                            display:inline;
                            float:right;
                            font-size:10px;
                        "
                    >
                        --°
                    </strong>

                </span>

            </div>

        `;


        layer.appendChild(
            biomech
        );

    }


    let phase =
        document.getElementById(
            "squat-phase"
        );


    if (
        !phase
    ) {

        phase =
            document.createElement(
                "div"
            );


        phase.id =
            "squat-phase";


        phase.className =
            "live-hud-box";


        phase.style.left =
            "50%";


        phase.style.top =
            "61%";


        phase.style.minWidth =
            "130px";


        phase.style.color =
            "#f3e600";


        phase.style.fontWeight =
            "900";


        phase.textContent =
            "POSICIONE-SE";


        layer.appendChild(
            phase
        );

    }


    return {

        biomech,
        phase

    };

}


function setSquatHudVisible(
    visible
) {

    const hud =
        ensureSquatHud();


    hud.biomech.classList.toggle(
        "hidden",
        !visible
    );


    hud.phase.classList.toggle(
        "hidden",
        !visible
    );

}


function ensureSquatReadyIndicator() {

    let indicator =
        document.getElementById(
            "squat-ready-indicator"
        );


    if (
        indicator
    ) {

        return indicator;

    }


    indicator =
        document.createElement(
            "div"
        );


    indicator.id =
        "squat-ready-indicator";


    indicator.className =
        "squat-ready-indicator hidden";


    indicator.innerHTML = `

        <strong>
            AGUARDANDO POSIÇÃO INICIAL
        </strong>

        <span>
            Fique em pé e enquadre o corpo inteiro
        </span>

    `;


    workoutScreen.appendChild(
        indicator
    );


    return indicator;

}


function showSquatReadyIndicator(
    visible
) {

    ensureSquatReadyIndicator()
        .classList
        .toggle(
            "hidden",
            !visible
        );

}


function updateSquatHud(
    result
) {

    if (
        selectedExercise.id !==
        "agachamento"
        ||
        !supervisionEnabled
    ) {

        setSquatHudVisible(
            false
        );


        return;

    }


    setSquatHudVisible(
        true
    );


    const phase =
        document.getElementById(
            "squat-phase"
        );


    const message =
        document.getElementById(
            "live-hud-message"
        );


    if (
        !result.framing
    ) {

        phase.textContent =
            "AJUSTE A CÂMERA";


        phase.style.color =
            "#ff5656";


        phase.style.borderColor =
            "rgba(255,86,86,.45)";


        message.textContent =
            result.message;


        message.style.color =
            "#ff7777";


        document
            .getElementById(
                "squat-knee"
            )
            .textContent =
                "--°";


        document
            .getElementById(
                "squat-hip"
            )
            .textContent =
                "--°";


        document
            .getElementById(
                "squat-torso"
            )
            .textContent =
                "--°";


        return;

    }


    phase.textContent =
        result.phaseLabel;


    phase.style.borderColor =
        result.phase ===
        "bottom"
            ?
            "rgba(86,229,138,.55)"
            :
            "rgba(243,230,0,.35)";


    phase.style.color =
        result.phase ===
        "bottom"
            ?
            "#56e58a"
            :
            "#f3e600";


    document
        .getElementById(
            "squat-knee"
        )
        .textContent =
            `${
                result.kneeAngle
            }°`;


    document
        .getElementById(
            "squat-hip"
        )
        .textContent =
            `${
                result.hipAngle
            }°`;


    document
        .getElementById(
            "squat-torso"
        )
        .textContent =
            `${
                result.torsoAngle
            }°`;


    if (
        workoutMode ===
        "time"
    ) {

        if (
            timedSeriesState ===
            "waiting"
        ) {

            message.style.color =
                "#f3e600";


            if (
                result.phase ===
                "standing"
            ) {

                message.textContent =
                    "Posição inicial reconhecida · mantenha-se em pé";

            }

            else {

                message.textContent =
                    "Fique em pé para iniciar automaticamente";

            }


            return;

        }


        if (
            timedSeriesState ===
            "paused"
        ) {

            message.style.color =
                "#ffffff";


            message.textContent =
                "Cronômetro pausado · toque em PLAY";


            return;

        }

    }


    message.style.color =
        result.repCompleted
            ?
            "#56e58a"
            :
            "#ffffff";


    message.textContent =
        result.message;

}


// ==========================================================
// TIMER PLAY / PAUSE
// ==========================================================

let timedSeriesState =
    "idle";


let timedSeriesAutoFinishLocked =
    false;


function ensureTimeControlButton() {

    let button =
        document.getElementById(
            "time-control-button"
        );


    if (
        button
    ) {

        return button;

    }


    const footer =
        document.querySelector(
            ".workout-footer"
        );


    button =
        document.createElement(
            "button"
        );


    button.id =
        "time-control-button";


    button.type =
        "button";


    button.className =
        "time-control-button hidden";


    button.innerHTML = `

        <span
            id="time-control-icon"
            class="time-control-icon"
        >
            ▶
        </span>

        <div
            class="time-control-center"
        >

            <small>
                CRONÔMETRO DA SÉRIE
            </small>

            <strong
                id="time-control-status"
            >
                PLAY
            </strong>

        </div>

        <span
            id="time-control-clock"
            class="time-control-clock"
        >
            00:30
        </span>

    `;


    footer.prepend(
        button
    );


    button.addEventListener(
        "click",
        toggleTimedSeries
    );


    return button;

}


function formatClock(
    seconds
) {

    const safe =
        Math.max(
            0,
            Math.round(
                seconds
            )
        );


    const minutes =
        Math.floor(
            safe
            /
            60
        );


    const secs =
        safe
        %
        60;


    return (
        `${
            String(
                minutes
            )
            .padStart(
                2,
                "0"
            )
        }:${
            String(
                secs
            )
            .padStart(
                2,
                "0"
            )
        }`
    );

}


function setTimedSeriesState(
    state
) {

    timedSeriesState =
        state;


    const button =
        ensureTimeControlButton();


    const icon =
        document.getElementById(
            "time-control-icon"
        );


    const status =
        document.getElementById(
            "time-control-status"
        );


    button.classList.remove(
        "waiting",
        "running",
        "paused",
        "complete"
    );


    button.classList.add(
        state
    );


    if (
        state ===
        "waiting"
    ) {

        icon.textContent =
            "▶";


        status.textContent =
            "AGUARDANDO POSIÇÃO";

    }

    else if (
        state ===
        "running"
    ) {

        icon.textContent =
            "Ⅱ";


        status.textContent =
            "PAUSAR";

    }

    else if (
        state ===
        "paused"
    ) {

        icon.textContent =
            "▶";


        status.textContent =
            "CONTINUAR";

    }

    else if (
        state ===
        "complete"
    ) {

        icon.textContent =
            "✓";


        status.textContent =
            "CONCLUÍDO";

    }

    else {

        icon.textContent =
            "▶";


        status.textContent =
            "PLAY";

    }


    updateTimeControlClock();

}


function updateTimeControlClock() {

    const clock =
        document.getElementById(
            "time-control-clock"
        );


    if (
        clock
    ) {

        clock.textContent =
            formatClock(
                remainingSeconds
            );

    }

}


function prepareTimedSeries() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    timedSeriesAutoFinishLocked =
        false;


    squatStandingSince =
        null;


    remainingSeconds =
        targetSeconds;


    updateTimeControlClock();


    const button =
        ensureTimeControlButton();


    if (
        workoutMode !==
        "time"
    ) {

        button.classList.add(
            "hidden"
        );


        showSquatReadyIndicator(
            false
        );


        timedSeriesState =
            "idle";


        return;

    }


    button.classList.remove(
        "hidden"
    );


    if (
        selectedExercise.id ===
        "agachamento"
        &&
        supervisionEnabled
    ) {

        setTimedSeriesState(
            "waiting"
        );


        showSquatReadyIndicator(
            true
        );

    }

    else {

        setTimedSeriesState(
            "paused"
        );


        showSquatReadyIndicator(
            false
        );

    }


    updateWorkoutHud();

}


function startWorkoutTimer() {

    if (
        workoutMode !==
        "time"
        ||
        timedSeriesState ===
        "running"
    ) {

        return;

    }


    if (
        remainingSeconds <=
        0
    ) {

        remainingSeconds =
            targetSeconds;

    }


    clearInterval(
        timerInterval
    );


    setTimedSeriesState(
        "running"
    );


    showSquatReadyIndicator(
        false
    );


    updateWorkoutHud();


    timerInterval =
        setInterval(
            () => {

                remainingSeconds--;


                if (
                    remainingSeconds <=
                    0
                ) {

                    remainingSeconds =
                        0;


                    clearInterval(
                        timerInterval
                    );


                    timerInterval =
                        null;


                    setTimedSeriesState(
                        "complete"
                    );


                    updateWorkoutHud();


                    if (
                        !timedSeriesAutoFinishLocked
                    ) {

                        timedSeriesAutoFinishLocked =
                            true;


                        setTimeout(
                            () => {

                                timedSeriesAutoFinishLocked =
                                    false;


                                if (
                                    !workoutScreen
                                        .classList
                                        .contains(
                                            "hidden"
                                        )
                                ) {

                                    completeCurrentSeries();

                                }

                            },
                            650
                        );

                    }


                    return;

                }


                updateTimeControlClock();

                updateWorkoutHud();

            },
            1000
        );

}


function pauseWorkoutTimer() {

    if (
        timedSeriesState !==
        "running"
    ) {

        return;

    }


    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    setTimedSeriesState(
        "paused"
    );


    updateWorkoutHud();

}


function toggleTimedSeries() {

    if (
        workoutMode !==
        "time"
    ) {

        return;

    }


    if (
        timedSeriesState ===
        "running"
    ) {

        pauseWorkoutTimer();


        return;

    }


    if (
        timedSeriesState ===
        "complete"
    ) {

        return;

    }


    startWorkoutTimer();

}


function handleSquatTimedAutoStart(
    squat,
    timestamp
) {

    if (
        workoutMode !==
        "time"
        ||
        selectedExercise.id !==
        "agachamento"
        ||
        !supervisionEnabled
        ||
        timedSeriesState !==
        "waiting"
    ) {

        squatStandingSince =
            null;


        return;

    }


    const indicator =
        ensureSquatReadyIndicator();


    if (
        squat.framing
        &&
        squat.phase ===
        "standing"
    ) {

        if (
            squatStandingSince ===
            null
        ) {

            squatStandingSince =
                timestamp;

        }


        const stableFor =
            timestamp
            -
            squatStandingSince;


        indicator.classList.add(
            "ready"
        );


        indicator
            .querySelector(
                "strong"
            )
            .textContent =
                "POSIÇÃO RECONHECIDA";


        indicator
            .querySelector(
                "span"
            )
            .textContent =
                stableFor >=
                350
                    ?
                    "Preparando cronômetro..."
                    :
                    "Mantenha-se em pé";


        if (
            stableFor >=
            700
        ) {

            squatStandingSince =
                null;


            startWorkoutTimer();

        }

    }

    else {

        squatStandingSince =
            null;


        indicator.classList.remove(
            "ready"
        );


        indicator
            .querySelector(
                "strong"
            )
            .textContent =
                "AGUARDANDO POSIÇÃO INICIAL";


        indicator
            .querySelector(
                "span"
            )
            .textContent =
                squat.framing
                    ?
                    "Fique em pé para iniciar automaticamente"
                    :
                    "Enquadre o corpo inteiro";

    }

}


// ==========================================================
// CAMERA PROCESSING
// ==========================================================

function processFrame() {

    if (
        !running
        ||
        processing
        ||
        !poseLandmarker
        ||
        video.readyState <
        2
    ) {

        return;

    }


    if (
        video.currentTime ===
        lastVideoTime
    ) {

        return;

    }


    processing =
        true;


    lastVideoTime =
        video.currentTime;


    try {

        const timestamp =
            performance.now();


        const result =
            poseLandmarker
                .detectForVideo(
                    video,
                    timestamp
                );


        if (
            result.landmarks
            &&
            result.landmarks.length
        ) {

            const landmarks =
                result.landmarks[0];


            updateRecorderDetection(
                true
            );


            captureMotionFrame(
                landmarks,
                timestamp
            );


            drawPose(
                landmarks
            );


            if (
                !recorderMode
                &&
                supervisionEnabled
                &&
                selectedExercise.id ===
                "agachamento"
            ) {

                const squat =
                    analyzeSquat(
                        landmarks,
                        timestamp
                    );


                handleSquatTimedAutoStart(
                    squat,
                    timestamp
                );


                updateSquatHud(
                    squat
                );


                if (
                    workoutMode ===
                    "reps"
                ) {

                    currentReps =
                        Math.min(
                            targetReps,
                            squat.reps
                        );


                    updateWorkoutHud();


                    if (
                        currentReps >=
                        targetReps
                        &&
                        !squatAutoAdvanceLocked
                    ) {

                        squatAutoAdvanceLocked =
                            true;


                        document
                            .getElementById(
                                "live-hud-message"
                            )
                            .textContent =
                                "✓ Série concluída";


                        setTimeout(
                            () => {

                                if (
                                    !workoutScreen
                                        .classList
                                        .contains(
                                            "hidden"
                                        )
                                ) {

                                    completeCurrentSeries();

                                }


                                squatAutoAdvanceLocked =
                                    false;

                            },
                            1000
                        );

                    }

                }

            }

        }

        else {

            updateRecorderDetection(
                false
            );


            ctx.clearRect(
                0,
                0,
                window.innerWidth,
                window.innerHeight
            );


            squatStandingSince =
                null;


            if (
                !recorderMode
                &&
                selectedExercise.id ===
                "agachamento"
            ) {

                updateSquatHud(
                    {

                        framing:
                            false,

                        message:
                            "Corpo não detectado"

                    }
                );

            }

        }

    }

    catch (
        error
    ) {

        console.error(
            error
        );

    }

    finally {

        processing =
            false;

    }

}


function startVideoLoop() {

    if (
        "requestVideoFrameCallback"
        in
        HTMLVideoElement.prototype
    ) {

        const callback =
            () => {

                if (
                    !running
                ) {

                    return;

                }


                processFrame();


                video.requestVideoFrameCallback(
                    callback
                );

            };


        video.requestVideoFrameCallback(
            callback
        );

    }

    else {

        const callback =
            () => {

                if (
                    !running
                ) {

                    return;

                }


                processFrame();


                requestAnimationFrame(
                    callback
                );

            };


        requestAnimationFrame(
            callback
        );

    }

}


// ==========================================================
// REFERÊNCIA
// ==========================================================

function drawGeneratedReference(
    timestamp
) {

    const width =
        window.innerWidth;


    const height =
        window.innerHeight;


    // ======================================================
    // AGACHAMENTO - ESQUELETO AMARELO DE REFERÊNCIA
    // ======================================================

    if (
        selectedExercise.id ===
        "agachamento"
    ) {

        const cycleMs =
            3600;


        const progress =
            (
                timestamp
                %
                cycleMs
            )
            /
            cycleMs;


        let squatProgress;


        // --------------------------------------------------
        // EM PÉ
        // --------------------------------------------------

        if (
            progress <
            .18
        ) {

            squatProgress =
                0;

        }


        // --------------------------------------------------
        // DESCENDO
        // --------------------------------------------------

        else if (
            progress <
            .44
        ) {

            squatProgress =
                (
                    progress
                    -
                    .18
                )
                /
                .26;

        }


        // --------------------------------------------------
        // FUNDO
        // --------------------------------------------------

        else if (
            progress <
            .58
        ) {

            squatProgress =
                1;

        }


        // --------------------------------------------------
        // SUBINDO
        // --------------------------------------------------

        else if (
            progress <
            .84
        ) {

            squatProgress =
                1
                -
                (
                    (
                        progress
                        -
                        .58
                    )
                    /
                    .26
                );

        }


        // --------------------------------------------------
        // EM PÉ
        // --------------------------------------------------

        else {

            squatProgress =
                0;

        }


        // suavização do movimento

        squatProgress =
            (
                1
                -
                Math.cos(
                    squatProgress
                    *
                    Math.PI
                )
            )
            /
            2;


        /*
            Referência um pouco menor que a pessoa real.

            Isso ajuda a distinguir visualmente:

            AMARELO = referência
            BRANCO = usuário
        */

        const centerX =
            width
            *
            .50;


        const baseY =
            height
            *
            .80;


        const scale =
            Math.min(
                width
                /
                430,

                height
                /
                800
            );


        const bodyScale =
            Math.max(
                .90,
                scale
                *
                1.55
            );


        const hipDrop =
            94
            *
            bodyScale
            *
            squatProgress;


        const torsoLean =
            42
            *
            bodyScale
            *
            squatProgress;


        const kneeForward =
            38
            *
            bodyScale
            *
            squatProgress;


        const stance =
            37
            *
            bodyScale;


        // ==================================================
        // TORNOZELOS
        // ==================================================

        const ankleL = {

            x:
                centerX
                -
                stance,

            y:
                baseY

        };


        const ankleR = {

            x:
                centerX
                +
                stance,

            y:
                baseY

        };


        // ==================================================
        // JOELHOS
        // ==================================================

        const kneeL = {

            x:
                centerX
                -
                stance
                +
                kneeForward,

            y:
                baseY
                -
                (
                    103
                    *
                    bodyScale
                )
                +
                (
                    hipDrop
                    *
                    .45
                )

        };


        const kneeR = {

            x:
                centerX
                +
                stance
                -
                kneeForward,

            y:
                baseY
                -
                (
                    103
                    *
                    bodyScale
                )
                +
                (
                    hipDrop
                    *
                    .45
                )

        };


        // ==================================================
        // QUADRIL
        // ==================================================

        const hipL = {

            x:
                centerX
                -
                (
                    21
                    *
                    bodyScale
                ),

            y:
                baseY
                -
                (
                    205
                    *
                    bodyScale
                )
                +
                hipDrop

        };


        const hipR = {

            x:
                centerX
                +
                (
                    21
                    *
                    bodyScale
                ),

            y:
                baseY
                -
                (
                    205
                    *
                    bodyScale
                )
                +
                hipDrop

        };


        // ==================================================
        // OMBROS
        // ==================================================

        const shoulderL = {

            x:
                centerX
                -
                (
                    34
                    *
                    bodyScale
                )
                +
                torsoLean,

            y:
                hipL.y
                -
                (
                    114
                    *
                    bodyScale
                )

        };


        const shoulderR = {

            x:
                centerX
                +
                (
                    34
                    *
                    bodyScale
                )
                +
                torsoLean,

            y:
                hipR.y
                -
                (
                    114
                    *
                    bodyScale
                )

        };


        // ==================================================
        // CABEÇA
        // ==================================================

        const neck = {

            x:
                (
                    shoulderL.x
                    +
                    shoulderR.x
                )
                /
                2,

            y:
                (
                    shoulderL.y
                    +
                    shoulderR.y
                )
                /
                2
                -
                (
                    10
                    *
                    bodyScale
                )

        };


        const head = {

            x:
                neck.x,

            y:
                neck.y
                -
                (
                    39
                    *
                    bodyScale
                )

        };


        // ==================================================
        // BRAÇOS
        // ==================================================

        /*
            Durante o agachamento,
            a referência projeta os braços para frente.
        */

        const armRaise =
            squatProgress;


        const elbowL = {

            x:
                shoulderL.x
                -
                (
                    31
                    *
                    bodyScale
                )
                +
                (
                    48
                    *
                    bodyScale
                    *
                    armRaise
                ),

            y:
                shoulderL.y
                +
                (
                    47
                    *
                    bodyScale
                )
                -
                (
                    34
                    *
                    bodyScale
                    *
                    armRaise
                )

        };


        const elbowR = {

            x:
                shoulderR.x
                +
                (
                    31
                    *
                    bodyScale
                )
                +
                (
                    20
                    *
                    bodyScale
                    *
                    armRaise
                ),

            y:
                shoulderR.y
                +
                (
                    47
                    *
                    bodyScale
                )
                -
                (
                    34
                    *
                    bodyScale
                    *
                    armRaise
                )

        };


        const wristL = {

            x:
                elbowL.x
                +
                (
                    44
                    *
                    bodyScale
                    *
                    armRaise
                )
                +
                (
                    10
                    *
                    bodyScale
                ),

            y:
                elbowL.y
                +
                (
                    32
                    *
                    bodyScale
                    *
                    (
                        1
                        -
                        armRaise
                    )
                )

        };


        const wristR = {

            x:
                elbowR.x
                +
                (
                    44
                    *
                    bodyScale
                    *
                    armRaise
                )
                -
                (
                    10
                    *
                    bodyScale
                ),

            y:
                elbowR.y
                +
                (
                    32
                    *
                    bodyScale
                    *
                    (
                        1
                        -
                        armRaise
                    )
                )

        };


        // ==================================================
        // DESENHO
        // ==================================================

        const points = {

            head,
            neck,

            shoulderL,
            shoulderR,

            elbowL,
            elbowR,

            wristL,
            wristR,

            hipL,
            hipR,

            kneeL,
            kneeR,

            ankleL,
            ankleR

        };


        const lines = [

            [
                "neck",
                "head"
            ],

            [
                "shoulderL",
                "shoulderR"
            ],

            [
                "shoulderL",
                "elbowL"
            ],

            [
                "elbowL",
                "wristL"
            ],

            [
                "shoulderR",
                "elbowR"
            ],

            [
                "elbowR",
                "wristR"
            ],

            [
                "shoulderL",
                "hipL"
            ],

            [
                "shoulderR",
                "hipR"
            ],

            [
                "hipL",
                "hipR"
            ],

            [
                "hipL",
                "kneeL"
            ],

            [
                "kneeL",
                "ankleL"
            ],

            [
                "hipR",
                "kneeR"
            ],

            [
                "kneeR",
                "ankleR"
            ]

        ];


        targetCtx.save();


        targetCtx.lineCap =
            "round";


        targetCtx.lineJoin =
            "round";


        targetCtx.strokeStyle =
            rgba(
                YELLOW,
                .36
            );


        targetCtx.lineWidth =
            5;


        targetCtx.shadowBlur =
            12;


        targetCtx.shadowColor =
            rgba(
                YELLOW,
                .16
            );


        lines.forEach(
            (
                [
                    a,
                    b
                ]
            ) => {

                targetCtx.beginPath();


                targetCtx.moveTo(
                    points[a].x,
                    points[a].y
                );


                targetCtx.lineTo(
                    points[b].x,
                    points[b].y
                );


                targetCtx.stroke();

            }
        );


        // ==================================================
        // ARTICULAÇÕES
        // ==================================================

        const joints = [

            shoulderL,
            shoulderR,

            elbowL,
            elbowR,

            wristL,
            wristR,

            hipL,
            hipR,

            kneeL,
            kneeR,

            ankleL,
            ankleR

        ];


        joints.forEach(
            point => {

                targetCtx.beginPath();


                targetCtx.arc(
                    point.x,
                    point.y,
                    4.5,
                    0,
                    Math.PI
                    *
                    2
                );


                targetCtx.fillStyle =
                    rgba(
                        YELLOW,
                        .42
                    );


                targetCtx.fill();

            }
        );


        // ==================================================
        // CABEÇA
        // ==================================================

        targetCtx.beginPath();


        targetCtx.arc(
            head.x,
            head.y
            -
            (
                5
                *
                bodyScale
            ),
            16
            *
            bodyScale,
            0,
            Math.PI
            *
            2
        );


        targetCtx.strokeStyle =
            rgba(
                YELLOW,
                .40
            );


        targetCtx.lineWidth =
            4;


        targetCtx.stroke();


        targetCtx.restore();


        return;

    }


    // ======================================================
    // DEMAIS EXERCÍCIOS
    // ======================================================

    let wave =
        0;


    if (
        selectedExercise.motion ===
        "jump"
    ) {

        wave =
            (
                Math.sin(
                    (
                        timestamp
                        %
                        1400
                    )
                    /
                    1400
                    *
                    Math.PI
                    *
                    2
                    -
                    Math.PI
                    /
                    2
                )
                +
                1
            )
            /
            2;

    }


    const jumpY =
        wave
        *
        height
        *
        .055;


    const spread =
        wave
        *
        width
        *
        .08;


    const armLift =
        wave
        *
        height
        *
        .13;


    const points = {

        head: {

            x:
                width
                *
                .50,

            y:
                height
                *
                .23
                -
                jumpY

        },

        neck: {

            x:
                width
                *
                .50,

            y:
                height
                *
                .30
                -
                jumpY

        },

        shoulderL: {

            x:
                width
                *
                .41,

            y:
                height
                *
                .34
                -
                jumpY

        },

        shoulderR: {

            x:
                width
                *
                .59,

            y:
                height
                *
                .34
                -
                jumpY

        },

        elbowL: {

            x:
                width
                *
                .34
                -
                spread
                *
                .4,

            y:
                height
                *
                .45
                -
                jumpY
                -
                armLift
                *
                .35

        },

        elbowR: {

            x:
                width
                *
                .66
                +
                spread
                *
                .4,

            y:
                height
                *
                .45
                -
                jumpY
                -
                armLift
                *
                .35

        },

        wristL: {

            x:
                width
                *
                .30
                -
                spread
                *
                .6,

            y:
                height
                *
                .56
                -
                jumpY
                -
                armLift

        },

        wristR: {

            x:
                width
                *
                .70
                +
                spread
                *
                .6,

            y:
                height
                *
                .56
                -
                jumpY
                -
                armLift

        },

        hipL: {

            x:
                width
                *
                .45,

            y:
                height
                *
                .55
                -
                jumpY

        },

        hipR: {

            x:
                width
                *
                .55,

            y:
                height
                *
                .55
                -
                jumpY

        },

        kneeL: {

            x:
                width
                *
                .45
                -
                spread
                *
                .4,

            y:
                height
                *
                .70
                -
                jumpY

        },

        kneeR: {

            x:
                width
                *
                .55
                +
                spread
                *
                .4,

            y:
                height
                *
                .70
                -
                jumpY

        },

        ankleL: {

            x:
                width
                *
                .44
                -
                spread,

            y:
                height
                *
                .86
                -
                jumpY

        },

        ankleR: {

            x:
                width
                *
                .56
                +
                spread,

            y:
                height
                *
                .86
                -
                jumpY

        }

    };


    const lines = [

        [
            "neck",
            "head"
        ],

        [
            "shoulderL",
            "shoulderR"
        ],

        [
            "shoulderL",
            "elbowL"
        ],

        [
            "elbowL",
            "wristL"
        ],

        [
            "shoulderR",
            "elbowR"
        ],

        [
            "elbowR",
            "wristR"
        ],

        [
            "shoulderL",
            "hipL"
        ],

        [
            "shoulderR",
            "hipR"
        ],

        [
            "hipL",
            "hipR"
        ],

        [
            "hipL",
            "kneeL"
        ],

        [
            "kneeL",
            "ankleL"
        ],

        [
            "hipR",
            "kneeR"
        ],

        [
            "kneeR",
            "ankleR"
        ]

    ];


    targetCtx.save();


    targetCtx.lineCap =
        "round";


    targetCtx.strokeStyle =
        rgba(
            YELLOW,
            .28
        );


    targetCtx.lineWidth =
        6;


    lines.forEach(
        (
            [
                a,
                b
            ]
        ) => {

            targetCtx.beginPath();


            targetCtx.moveTo(
                points[a].x,
                points[a].y
            );


            targetCtx.lineTo(
                points[b].x,
                points[b].y
            );


            targetCtx.stroke();

        }
    );


    targetCtx.restore();

}


function drawRecordedReference(
    timestamp
) {

    const frames =
        selectedExercise.frames;


    if (
        !frames?.length
    ) {

        return;

    }


    const duration =
        Math.max(
            300,
            selectedExercise.durationMs
        );


    const frame =
        getRecordedFrameAt(
            frames,
            timestamp
            %
            duration
        );


    drawMotionFrameOnCanvas(
        targetCtx,
        frame.landmarks,
        window.innerWidth,
        window.innerHeight,
        facingMode ===
        "user"
        &&
        settings.mirror
    );

}


function drawReference(
    timestamp
) {

    targetCtx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );


    if (
        !supervisionEnabled
        ||
        !settings.reference
    ) {

        return;

    }


    if (
        selectedExercise.motion ===
        "recorded"
    ) {

        drawRecordedReference(
            timestamp
        );

    }

    else {

        drawGeneratedReference(
            timestamp
        );

    }

}


function startReferenceAnimation() {

    cancelAnimationFrame(
        targetAnimationFrame
    );


    const animate =
        timestamp => {

            if (
                workoutScreen
                    .classList
                    .contains(
                        "hidden"
                    )
                ||
                recorderMode
            ) {

                return;

            }


            drawReference(
                timestamp
            );


            targetAnimationFrame =
                requestAnimationFrame(
                    animate
                );

        };


    targetAnimationFrame =
        requestAnimationFrame(
            animate
        );

}


// ==========================================================
// HUD AO VIVO
// ==========================================================

function ensureLiveHud() {

    let layer =
        document.getElementById(
            "live-hud-layer"
        );


    if (
        layer
    ) {

        return layer;

    }


    layer =
        document.createElement(
            "div"
        );


    layer.id =
        "live-hud-layer";


    layer.className =
        "live-hud-layer";


    layer.innerHTML = `

        <div
            id="live-hud-series"
            class="live-hud-box"
        >

            <strong>
                SÉRIE 1/3
            </strong>

            <small>
                SÉRIE
            </small>

        </div>

        <div
            id="live-hud-counter"
            class="live-hud-box"
        >

            <strong>
                0 / 5
            </strong>

            <small>
                REPETIÇÕES
            </small>

        </div>

        <div
            id="live-hud-message"
            class="
                live-hud-box
                live-hud-message
            "
        >
            Preparando Body Engine
        </div>

        <div
            id="live-hud-time"
            class="live-hud-box"
        >

            <strong>
                00:00
            </strong>

            <small>
                TEMPO TOTAL
            </small>

        </div>

    `;


    workoutScreen.appendChild(
        layer
    );


    return layer;

}


function applyLiveHudSettings() {

    ensureLiveHud();


    const map = {

        counter:
            document.getElementById(
                "live-hud-counter"
            ),

        series:
            document.getElementById(
                "live-hud-series"
            ),

        message:
            document.getElementById(
                "live-hud-message"
            ),

        time:
            document.getElementById(
                "live-hud-time"
            )

    };


    Object.entries(
        map
    )
        .forEach(
            (
                [
                    key,
                    element
                ]
            ) => {

                positionHudBox(
                    element,
                    settings.hudPositions[
                        key
                    ]
                );

            }
        );


    map.counter.classList.toggle(
        "hidden",
        !settings.hudCounter
    );


    map.series.classList.toggle(
        "hidden",
        !settings.hudSeries
    );


    map.message.classList.toggle(
        "hidden",
        !settings.hudMessage
    );


    map.time.classList.toggle(
        "hidden",
        !settings.hudTime
    );

}


// ==========================================================
// TREINO
// ==========================================================

let currentSet =
    1;


let currentReps =
    0;


let remainingSeconds =
    30;


let timerInterval =
    null;


let workoutClockInterval =
    null;


let workoutStartedAt =
    0;


let routineSession =
    null;


function startRoutineGroup(
    routineId,
    groupId
) {

    const routine =
        routines.find(
            item =>
                item.id ===
                routineId
        );


    const group =
        routine?.groups
            .find(
                item =>
                    item.id ===
                    groupId
            );


    if (
        !group
        ||
        !group.exercises.length
    ) {

        alert(
            "Este grupo ainda não possui exercícios."
        );


        return;

    }


    routineSession = {

        routineId,

        groupId,

        exerciseIndex:
            0

    };


    loadRoutineExercise(
        0
    );

}


function loadRoutineExercise(
    index
) {

    if (
        !routineSession
    ) {

        return;

    }


    const routine =
        routines.find(
            item =>
                item.id ===
                routineSession.routineId
        );


    const group =
        routine.groups.find(
            item =>
                item.id ===
                routineSession.groupId
        );


    if (
        index >=
        group.exercises.length
    ) {

        finishRoutineWorkout();


        return;

    }


    routineSession.exerciseIndex =
        index;


    const routineItem =
        group.exercises[
            index
        ];


    const exercise =
        getExerciseById(
            routineItem.exerciseId
        );


    if (
        !exercise
    ) {

        loadRoutineExercise(
            index
            +
            1
        );


        return;

    }


    selectedExercise =
        exercise;


    workoutMode =
        routineItem.mode;


    targetReps =
        routineItem.reps;


    targetSeconds =
        routineItem.seconds;


    totalSets =
        routineItem.sets;


    currentRestSeconds =
        routineItem.restSeconds;


    supervisionEnabled =
        routineItem.supervision;


    beginWorkout();

}


async function beginWorkout() {

    recorderMode =
        false;


    currentSet =
        1;


    currentReps =
        0;


    remainingSeconds =
        targetSeconds;


    squatAutoAdvanceLocked =
        false;


    squatStandingSince =
        null;


    if (
        selectedExercise.id ===
        "agachamento"
    ) {

        resetSquatEngine();

    }


    workoutStartedAt =
        performance.now();


    Object
        .values(
            screens
        )
        .forEach(
            screen => {

                screen.classList.remove(
                    "active"
                );

            }
        );


    appHeader.classList.add(
        "hidden"
    );


    bottomNav.classList.add(
        "hidden"
    );


    workoutScreen.classList.remove(
        "hidden"
    );


    document
        .getElementById(
            "workout-title"
        )
        .textContent =
            selectedExercise.name
                .toUpperCase();


    document
        .getElementById(
            "skip-exercise"
        )
        .classList
        .toggle(
            "hidden",
            !routineSession
        );


    ensureLiveHud()
        .classList
        .remove(
            "hidden"
        );


    setSquatHudVisible(
        selectedExercise.id ===
        "agachamento"
        &&
        supervisionEnabled
    );


    updateWorkoutHud();

    applyLiveHudSettings();


    clearInterval(
        workoutClockInterval
    );


    workoutClockInterval =
        setInterval(
            updateWorkoutClock,
            250
        );


    if (
        supervisionEnabled
    ) {

        document
            .getElementById(
                "no-camera-mode"
            )
            .classList
            .add(
                "hidden"
            );


        video.classList.remove(
            "hidden"
        );


        canvas.classList.remove(
            "hidden"
        );


        targetCanvas.classList.remove(
            "hidden"
        );


        document
            .getElementById(
                "manual-rep"
            )
            .classList
            .add(
                "hidden"
            );


        await initializePoseLandmarker();

        await startCamera();

        startReferenceAnimation();

    }

    else {

        stopCamera();


        setSquatHudVisible(
            false
        );


        video.classList.add(
            "hidden"
        );


        canvas.classList.add(
            "hidden"
        );


        targetCanvas.classList.add(
            "hidden"
        );


        document
            .getElementById(
                "no-camera-mode"
            )
            .classList
            .remove(
                "hidden"
            );


        document
            .getElementById(
                "manual-rep"
            )
            .classList
            .toggle(
                "hidden",
                workoutMode !==
                "reps"
            );

    }


    prepareTimedSeries();

}


function updateWorkoutClock() {

    const elapsedSeconds =
        Math.floor(
            (
                performance.now()
                -
                workoutStartedAt
            )
            /
            1000
        );


    const minutes =
        Math.floor(
            elapsedSeconds
            /
            60
        );


    const seconds =
        elapsedSeconds
        %
        60;


    document
        .querySelector(
            "#live-hud-time strong"
        )
        .textContent =
            `${
                String(
                    minutes
                )
                .padStart(
                    2,
                    "0"
                )
            }:${
                String(
                    seconds
                )
                .padStart(
                    2,
                    "0"
                )
            }`;

}


function updateWorkoutHud() {

    ensureLiveHud();


    document
        .getElementById(
            "workout-series"
        )
        .textContent =
            `SÉRIE ${
                currentSet
            } DE ${
                totalSets
            }`;


    document
        .querySelector(
            "#live-hud-series strong"
        )
        .textContent =
            `SÉRIE ${
                currentSet
            }/${
                totalSets
            }`;


    const counter =
        document.querySelector(
            "#live-hud-counter strong"
        );


    const counterLabel =
        document.querySelector(
            "#live-hud-counter small"
        );


    if (
        workoutMode ===
        "reps"
    ) {

        counter.textContent =
            `${
                currentReps
            } / ${
                targetReps
            }`;


        counterLabel.textContent =
            "REPETIÇÕES";

    }

    else {

        counter.textContent =
            formatClock(
                remainingSeconds
            );


        counterLabel.textContent =
            "TEMPO DA SÉRIE";


        updateTimeControlClock();

    }


    if (
        selectedExercise.id !==
        "agachamento"
    ) {

        const message =
            document.getElementById(
                "live-hud-message"
            );


        message.style.color =
            "#ffffff";


        if (
            workoutMode ===
            "time"
            &&
            timedSeriesState ===
            "paused"
        ) {

            message.textContent =
                "Toque em PLAY quando estiver pronto";

        }

        else {

            message.textContent =
                supervisionEnabled
                    ?
                    "Acompanhe a referência"
                    :
                    "Execute no seu ritmo";

        }

    }


    applyLiveHudSettings();

}


document
    .getElementById(
        "begin-workout"
    )
    .onclick =
        async () => {

            routineSession =
                null;


            try {

                await beginWorkout();

            }

            catch (
                error
            ) {

                console.error(
                    error
                );


                alert(
                    "Não foi possível iniciar a câmera."
                );

            }

        };


document
    .getElementById(
        "manual-rep"
    )
    .onclick =
        () => {

            currentReps =
                Math.min(
                    targetReps,
                    currentReps
                    +
                    1
                );


            updateWorkoutHud();

        };


// ==========================================================
// SÉRIES
// ==========================================================

function completeCurrentSeries() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    squatStandingSince =
        null;


    showSquatReadyIndicator(
        false
    );


    if (
        !routineSession
    ) {

        if (
            currentSet >=
            totalSets
        ) {

            finishStandaloneWorkout();


            return;

        }


        currentSet++;


        currentReps =
            0;


        remainingSeconds =
            targetSeconds;


        if (
            selectedExercise.id ===
            "agachamento"
        ) {

            resetSquatEngine();

        }


        updateWorkoutHud();


        prepareTimedSeries();


        return;

    }


    if (
        currentSet <
        totalSets
    ) {

        showRestScreen(
            {
                nextType:
                    "set"
            }
        );


        return;

    }


    showRestAfterExercise();

}


document
    .getElementById(
        "complete-series"
    )
    .onclick =
        completeCurrentSeries;


document
    .getElementById(
        "skip-series"
    )
    .onclick =
        completeCurrentSeries;


// ==========================================================
// DESCANSO
// ==========================================================

const restScreen =
    document.getElementById(
        "rest-screen"
    );


let restInterval =
    null;


let restRemaining =
    0;


let restAction =
    null;


function showRestAfterExercise() {

    if (
        !routineSession
    ) {

        return;

    }


    const routine =
        routines.find(
            item =>
                item.id ===
                routineSession.routineId
        );


    const group =
        routine.groups.find(
            item =>
                item.id ===
                routineSession.groupId
        );


    const nextIndex =
        routineSession.exerciseIndex
        +
        1;


    if (
        nextIndex >=
        group.exercises.length
    ) {

        finishRoutineWorkout();


        return;

    }


    showRestScreen(
        {

            nextType:
                "exercise",

            nextIndex

        }
    );

}


function showRestScreen(
    {
        nextType,
        nextIndex = null
    }
) {

    stopCamera();


    cancelAnimationFrame(
        targetAnimationFrame
    );


    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    showSquatReadyIndicator(
        false
    );


    workoutScreen.classList.add(
        "hidden"
    );


    restScreen.classList.remove(
        "hidden"
    );


    restRemaining =
        currentRestSeconds;


    if (
        nextType ===
        "set"
    ) {

        document
            .getElementById(
                "rest-next-label"
            )
            .textContent =
                `Próxima: série ${
                    currentSet
                    +
                    1
                } de ${
                    totalSets
                }`;


        restAction =
            () => {

                currentSet++;


                currentReps =
                    0;


                remainingSeconds =
                    targetSeconds;


                if (
                    selectedExercise.id ===
                    "agachamento"
                ) {

                    resetSquatEngine();

                }


                resumeWorkoutAfterRest();

            };

    }

    else {

        const routine =
            routines.find(
                item =>
                    item.id ===
                    routineSession.routineId
            );


        const group =
            routine.groups.find(
                item =>
                    item.id ===
                    routineSession.groupId
            );


        const nextRoutineItem =
            group.exercises[
                nextIndex
            ];


        const nextExercise =
            getExerciseById(
                nextRoutineItem.exerciseId
            );


        document
            .getElementById(
                "rest-next-label"
            )
            .textContent =
                `Próximo exercício: ${
                    nextExercise?.name
                    ||
                    "Exercício"
                }`;


        restAction =
            () => {

                restScreen.classList.add(
                    "hidden"
                );


                loadRoutineExercise(
                    nextIndex
                );

            };

    }


    updateRestTimer();


    clearInterval(
        restInterval
    );


    if (
        restRemaining <=
        0
    ) {

        finishRest();


        return;

    }


    restInterval =
        setInterval(
            () => {

                restRemaining--;


                updateRestTimer();


                if (
                    restRemaining <=
                    0
                ) {

                    finishRest();

                }

            },
            1000
        );

}


function updateRestTimer() {

    document
        .getElementById(
            "rest-timer"
        )
        .textContent =
            formatClock(
                restRemaining
            );

}


function finishRest() {

    clearInterval(
        restInterval
    );


    restInterval =
        null;


    const action =
        restAction;


    restAction =
        null;


    if (
        action
    ) {

        action();

    }

}


document
    .getElementById(
        "skip-rest"
    )
    .onclick =
        finishRest;


async function resumeWorkoutAfterRest() {

    restScreen.classList.add(
        "hidden"
    );


    workoutScreen.classList.remove(
        "hidden"
    );


    squatAutoAdvanceLocked =
        false;


    squatStandingSince =
        null;


    workoutStartedAt =
        performance.now();


    updateWorkoutHud();


    if (
        supervisionEnabled
    ) {

        video.classList.remove(
            "hidden"
        );


        canvas.classList.remove(
            "hidden"
        );


        targetCanvas.classList.remove(
            "hidden"
        );


        await startCamera();

        startReferenceAnimation();

    }


    prepareTimedSeries();

}


// ==========================================================
// PULAR EXERCÍCIO
// ==========================================================

document
    .getElementById(
        "skip-exercise"
    )
    .onclick =
        () => {

            if (
                !routineSession
            ) {

                return;

            }


            clearInterval(
                timerInterval
            );


            timerInterval =
                null;


            showSquatReadyIndicator(
                false
            );


            stopCamera();


            cancelAnimationFrame(
                targetAnimationFrame
            );


            loadRoutineExercise(
                routineSession.exerciseIndex
                +
                1
            );

        };


// ==========================================================
// SAÍDA
// ==========================================================

const exitModal =
    document.getElementById(
        "exit-workout-modal"
    );


function requestWorkoutExit() {

    if (
        routineSession
    ) {

        exitModal.classList.remove(
            "hidden"
        );


        return;

    }


    closeStandaloneWorkout();

}


document
    .getElementById(
        "close-workout"
    )
    .onclick =
        requestWorkoutExit;


document
    .getElementById(
        "exit-routine-workout"
    )
    .onclick =
        () => {

            exitModal.classList.remove(
                "hidden"
            );

        };


document
    .getElementById(
        "continue-workout"
    )
    .onclick =
        () => {

            exitModal.classList.add(
                "hidden"
            );

        };


document
    .getElementById(
        "confirm-exit-workout"
    )
    .onclick =
        () => {

            exitModal.classList.add(
                "hidden"
            );


            abortWorkout();

        };


function cleanupWorkout() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    clearInterval(
        restInterval
    );


    restInterval =
        null;


    clearInterval(
        workoutClockInterval
    );


    workoutClockInterval =
        null;


    stopCamera();


    cancelAnimationFrame(
        targetAnimationFrame
    );


    showSquatReadyIndicator(
        false
    );


    setSquatHudVisible(
        false
    );


    const timeButton =
        document.getElementById(
            "time-control-button"
        );


    timeButton
        ?.classList
        .add(
            "hidden"
        );


    timedSeriesState =
        "idle";


    squatStandingSince =
        null;

}


function abortWorkout() {

    cleanupWorkout();


    workoutScreen.classList.add(
        "hidden"
    );


    restScreen.classList.add(
        "hidden"
    );


    appHeader.classList.remove(
        "hidden"
    );


    routineSession =
        null;


    if (
        selectedRoutineId
    ) {

        openRoutineDetail(
            selectedRoutineId,
            false
        );

    }

    else {

        showScreen(
            "home",
            false
        );

    }

}


function closeStandaloneWorkout() {

    cleanupWorkout();


    workoutScreen.classList.add(
        "hidden"
    );


    appHeader.classList.remove(
        "hidden"
    );


    showScreen(
        "config",
        false
    );

}


// ==========================================================
// RESULTADO
// ==========================================================

function prepareResultScreen(
    routine = false
) {

    const page =
        document.querySelector(
            ".result-page"
        );


    const eyebrow =
        page?.querySelector(
            ".eyebrow"
        );


    const title =
        page?.querySelector(
            "h1"
        );


    const description =
        page?.querySelector(
            "h1 + p"
        );


    if (
        eyebrow
    ) {

        eyebrow.textContent =
            routine
                ?
                "TREINO FINALIZADO"
                :
                "EXERCÍCIO FINALIZADO";

    }


    if (
        title
    ) {

        title.textContent =
            routine
                ?
                "Treino concluído."
                :
                "Muito bem.";

    }


    if (
        description
    ) {

        description.textContent =
            routine
                ?
                "Você concluiu todos os exercícios deste grupo."
                :
                `${
                    selectedExercise.name
                } concluído com sucesso.`;

    }

}


function finishStandaloneWorkout() {

    cleanupWorkout();


    workoutScreen.classList.add(
        "hidden"
    );


    appHeader.classList.remove(
        "hidden"
    );


    prepareResultScreen(
        false
    );


    showScreen(
        "result",
        false
    );

}


function finishRoutineWorkout() {

    cleanupWorkout();


    workoutScreen.classList.add(
        "hidden"
    );


    restScreen.classList.add(
        "hidden"
    );


    appHeader.classList.remove(
        "hidden"
    );


    routineSession =
        null;


    prepareResultScreen(
        true
    );


    showScreen(
        "result",
        false
    );

}


document
    .getElementById(
        "result-home"
    )
    .onclick =
        () => {

            screenHistory =
                [];


            showScreen(
                "home",
                false
            );

        };


// ==========================================================
// TROCAR CÂMERA
// ==========================================================

document
    .getElementById(
        "switch-camera"
    )
    .onclick =
        async () => {

            facingMode =
                facingMode ===
                "user"
                    ?
                    "environment"
                    :
                    "user";


            await startCamera();

        };


// ==========================================================
// RESIZE
// ==========================================================

window.addEventListener(
    "resize",
    () => {

        if (
            !workoutScreen
                .classList
                .contains(
                    "hidden"
                )
        ) {

            resizeCanvases();

        }


        if (
            getActiveScreenName() ===
            "exercise"
        ) {

            requestAnimationFrame(
                startExerciseDemo
            );

        }

    }
);


window.addEventListener(
    "orientationchange",
    () => {

        setTimeout(
            () => {

                resizeCanvases();


                if (
                    getActiveScreenName() ===
                    "exercise"
                ) {

                    startExerciseDemo();

                }

            },
            250
        );

    }
);


window.addEventListener(
    "beforeunload",
    () => {

        stopCamera();


        cancelAnimationFrame(
            targetAnimationFrame
        );


        cancelAnimationFrame(
            reviewAnimationFrame
        );


        cancelAnimationFrame(
            exerciseDemoAnimationFrame
        );

    }
);


// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

updateConfigNumbers();

renderRoutines();

renderExplore();

refreshAccountUI();

loadSettingsToUI();

ensureLiveHud();

ensureSquatHud();

ensureSquatReadyIndicator();

ensureTimeControlButton();

ensureExerciseDemoCanvas();

setSquatHudVisible(
    false
);

showSquatReadyIndicator(
    false
);

applyLiveHudSettings();

applyProductPolish();


const alreadyEntered =
    localStorage.getItem(
        STORAGE.entered
    );


if (
    alreadyEntered ===
    "true"
) {

    enterApp();

}