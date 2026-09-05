import {
    FilesetResolver,
    PoseLandmarker
}
from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/+esm";


// =======================================================
// ELEMENTOS
// =======================================================

const video =
    document.getElementById("camera");

const canvas =
    document.getElementById("overlay");

const ctx =
    canvas.getContext("2d");

const startButton =
    document.getElementById("start-button");

const switchButton =
    document.getElementById("switch-button");

const statusDot =
    document.getElementById("status-dot");


// =======================================================
// ESTADO
// =======================================================

let poseLandmarker = null;
let stream = null;

let running = false;
let processing = false;

let facingMode = "user";

let lastVideoTime = -1;


// =======================================================
// SUAVIZAÇÃO
// =======================================================

const previousPoints = new Map();


// Quanto maior, mais rápido acompanha.
// Movimento parado recebe suavização maior.
// Movimento rápido recebe resposta quase direta.

const BASE_ALPHA = 0.86;


// =======================================================
// MODELO
// =======================================================

const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/" +
    "pose_landmarker/pose_landmarker_full/" +
    "float16/1/pose_landmarker_full.task";


// =======================================================
// CONEXÕES
// =======================================================

const CONNECTIONS = [

    // Cabeça
    [7, 8],

    // Ombros
    [11, 12],

    // Braço esquerdo
    [11, 13],
    [13, 15],

    // Mão esquerda
    [15, 17],
    [15, 19],
    [15, 21],

    // Braço direito
    [12, 14],
    [14, 16],

    // Mão direita
    [16, 18],
    [16, 20],
    [16, 22],

    // Tronco
    [11, 23],
    [12, 24],
    [23, 24],

    // Perna esquerda
    [23, 25],
    [25, 27],

    // Pé esquerdo
    [27, 29],
    [29, 31],
    [27, 31],

    // Perna direita
    [24, 26],
    [26, 28],

    // Pé direito
    [28, 30],
    [30, 32],
    [28, 32]

];


// =======================================================
// ARTICULAÇÕES VISÍVEIS
// =======================================================

const BODY_LANDMARKS = [

    7,
    8,

    11,
    12,

    13,
    14,

    15,
    16,

    17,
    18,

    19,
    20,

    21,
    22,

    23,
    24,

    25,
    26,

    27,
    28,

    29,
    30,

    31,
    32

];


// =======================================================
// MEDIAPIPE
// =======================================================

async function initializePoseLandmarker() {

    const vision =
        await FilesetResolver.forVisionTasks(

            "https://cdn.jsdelivr.net/npm/" +
            "@mediapipe/tasks-vision@latest/wasm"

        );


    poseLandmarker =
        await PoseLandmarker.createFromOptions(

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
                    0.60,

                minPosePresenceConfidence:
                    0.60,

                minTrackingConfidence:
                    0.60,

                outputSegmentationMasks:
                    false

            }

        );

}


// =======================================================
// CÂMERA
// =======================================================

async function startCamera() {

    stopCamera();


    previousPoints.clear();

    lastVideoTime =
        -1;


    const constraints = {

        audio:
            false,

        video: {

            facingMode: {
                ideal:
                    facingMode
            },

            width: {
                ideal:
                    1280
            },

            height: {
                ideal:
                    720
            },

            frameRate: {
                ideal:
                    60,
                min:
                    30
            }

        }

    };


    stream =
        await navigator.mediaDevices.getUserMedia(
            constraints
        );


    video.srcObject =
        stream;


    await video.play();


    aplicarEspelhamento();


    resizeCanvas();


    running =
        true;


    startButton.classList.add(
        "hidden"
    );


    switchButton.classList.remove(
        "hidden"
    );


    iniciarLoop();

}


// =======================================================
// ESPELHAMENTO
// =======================================================

function aplicarEspelhamento() {

    if (
        facingMode === "user"
    ) {

        video.style.transform =
            "scaleX(-1)";

    }

    else {

        video.style.transform =
            "scaleX(1)";

    }

}


// =======================================================
// PARAR CÂMERA
// =======================================================

function stopCamera() {

    running =
        false;


    if (stream) {

        for (
            const track
            of stream.getTracks()
        ) {

            track.stop();

        }

    }


    stream =
        null;

}


// =======================================================
// TROCAR CÂMERA
// =======================================================

async function switchCamera() {

    facingMode =
        facingMode === "user"
            ? "environment"
            : "user";


    await startCamera();

}


// =======================================================
// CANVAS
// =======================================================

function resizeCanvas() {

    const largura =
        window.innerWidth;

    const altura =
        window.innerHeight;


    const pixelRatio =
        window.devicePixelRatio || 1;


    canvas.width =
        Math.round(
            largura * pixelRatio
        );


    canvas.height =
        Math.round(
            altura * pixelRatio
        );


    canvas.style.width =
        `${largura}px`;


    canvas.style.height =
        `${altura}px`;


    ctx.setTransform(

        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0

    );

}


// =======================================================
// LANDMARK → TELA
// =======================================================

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
        videoWidth === 0
        ||
        videoHeight === 0
    ) {

        return {
            x: 0,
            y: 0
        };

    }


    const videoRatio =
        videoWidth / videoHeight;


    const screenRatio =
        screenWidth / screenHeight;


    let renderedWidth;
    let renderedHeight;

    let offsetX;
    let offsetY;


    // object-fit: cover

    if (
        videoRatio > screenRatio
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


    // Como a câmera frontal está visualmente espelhada,
    // o esqueleto também precisa ser espelhado.

    if (
        facingMode === "user"
    ) {

        x =
            screenWidth - x;

    }


    return {
        x,
        y
    };

}


// =======================================================
// SUAVIZAÇÃO ADAPTATIVA
// =======================================================

function smoothPoint(
    index,
    point
) {

    const old =
        previousPoints.get(
            index
        );


    if (!old) {

        previousPoints.set(
            index,
            point
        );


        return point;

    }


    const dx =
        point.x - old.x;


    const dy =
        point.y - old.y;


    const speed =
        Math.sqrt(
            dx * dx
            +
            dy * dy
        );


    let alpha =
        BASE_ALPHA;


    // Muito rápido
    if (
        speed > 45
    ) {

        alpha =
            0.985;

    }

    // Rápido
    else if (
        speed > 25
    ) {

        alpha =
            0.96;

    }

    // Médio
    else if (
        speed > 10
    ) {

        alpha =
            0.91;

    }

    // Quase parado
    else if (
        speed < 3
    ) {

        alpha =
            0.60;

    }


    const smoothed = {

        x:
            old.x
            +
            (
                point.x
                -
                old.x
            )
            *
            alpha,

        y:
            old.y
            +
            (
                point.y
                -
                old.y
            )
            *
            alpha

    };


    previousPoints.set(
        index,
        smoothed
    );


    return smoothed;

}


// =======================================================
// CONFIANÇA
// =======================================================

function confidenceOf(
    landmark
) {

    const visibility =
        landmark.visibility
        ??
        1;


    const presence =
        landmark.presence
        ??
        1;


    return Math.min(
        visibility,
        presence
    );

}


// =======================================================
// CORES
// =======================================================

function colorForConfidence(
    confidence
) {

    if (
        confidence < 0.35
    ) {

        return {
            r: 115,
            g: 115,
            b: 115
        };

    }


    if (
        confidence < 0.55
    ) {

        return {
            r: 255,
            g: 50,
            b: 50
        };

    }


    if (
        confidence < 0.78
    ) {

        return {
            r: 255,
            g: 195,
            b: 30
        };

    }


    return {
        r: 65,
        g: 255,
        b: 125
    };

}


function rgba(
    color,
    alpha
) {

    return (

        `rgba(` +
        `${color.r},` +
        `${color.g},` +
        `${color.b},` +
        `${alpha})`

    );

}


// =======================================================
// LINHAS
// =======================================================

function drawSegment(
    a,
    b,
    confidenceA,
    confidenceB
) {

    const confidence =
        Math.min(
            confidenceA,
            confidenceB
        );


    const color =
        colorForConfidence(
            confidence
        );


    ctx.save();


    ctx.lineCap =
        "round";


    ctx.lineJoin =
        "round";


    // Glow externo

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
            color,
            0.16
        );


    ctx.lineWidth =
        12;


    ctx.stroke();


    // Glow interno

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
            color,
            0.34
        );


    ctx.lineWidth =
        6;


    ctx.stroke();


    // Linha principal

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
            color,
            0.98
        );


    ctx.lineWidth =
        2.5;


    ctx.stroke();


    ctx.restore();

}


// =======================================================
// ARTICULAÇÕES
// =======================================================

function drawJoint(
    point,
    confidence
) {

    const color =
        colorForConfidence(
            confidence
        );


    ctx.save();


    ctx.shadowBlur =
        12;


    ctx.shadowColor =
        rgba(
            color,
            0.85
        );


    ctx.beginPath();


    ctx.arc(
        point.x,
        point.y,
        7.5,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle =
        rgba(
            color,
            0.95
        );


    ctx.lineWidth =
        1.7;


    ctx.stroke();


    ctx.beginPath();


    ctx.arc(
        point.x,
        point.y,
        2.8,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        rgba(
            color,
            1
        );


    ctx.fill();


    ctx.restore();

}


// =======================================================
// INTERPOLAÇÃO
// =======================================================

function interpolate(
    a,
    b,
    amount
) {

    return {

        x:
            a.x
            +
            (
                b.x - a.x
            )
            *
            amount,

        y:
            a.y
            +
            (
                b.y - a.y
            )
            *
            amount

    };

}


// =======================================================
// COLUNA
// =======================================================

function drawSpine(
    points,
    confidences
) {

    const leftShoulder =
        points[11];

    const rightShoulder =
        points[12];

    const leftHip =
        points[23];

    const rightHip =
        points[24];


    if (
        !leftShoulder
        ||
        !rightShoulder
        ||
        !leftHip
        ||
        !rightHip
    ) {

        return;

    }


    const shoulderCenter = {

        x:
            (
                leftShoulder.x
                +
                rightShoulder.x
            )
            /
            2,

        y:
            (
                leftShoulder.y
                +
                rightShoulder.y
            )
            /
            2

    };


    const hipCenter = {

        x:
            (
                leftHip.x
                +
                rightHip.x
            )
            /
            2,

        y:
            (
                leftHip.y
                +
                rightHip.y
            )
            /
            2

    };


    const spine1 =
        interpolate(
            shoulderCenter,
            hipCenter,
            0.25
        );


    const spine2 =
        interpolate(
            shoulderCenter,
            hipCenter,
            0.50
        );


    const spine3 =
        interpolate(
            shoulderCenter,
            hipCenter,
            0.75
        );


    const confidence =
        Math.min(

            confidences[11],
            confidences[12],
            confidences[23],
            confidences[24]

        );


    drawSegment(
        shoulderCenter,
        spine1,
        confidence,
        confidence
    );


    drawSegment(
        spine1,
        spine2,
        confidence,
        confidence
    );


    drawSegment(
        spine2,
        spine3,
        confidence,
        confidence
    );


    drawSegment(
        spine3,
        hipCenter,
        confidence,
        confidence
    );


    drawJoint(
        shoulderCenter,
        confidence
    );


    drawJoint(
        spine1,
        confidence
    );


    drawJoint(
        spine2,
        confidence
    );


    drawJoint(
        spine3,
        confidence
    );


    drawJoint(
        hipCenter,
        confidence
    );


    // Pescoço estimado a partir das orelhas

    if (
        points[7]
        &&
        points[8]
    ) {

        const headBase = {

            x:
                (
                    points[7].x
                    +
                    points[8].x
                )
                /
                2,

            y:
                (
                    points[7].y
                    +
                    points[8].y
                )
                /
                2

        };


        const neckConfidence =
            Math.min(

                confidences[7],
                confidences[8],
                confidence

            );


        drawSegment(

            headBase,
            shoulderCenter,

            neckConfidence,
            confidence

        );


        drawJoint(
            headBase,
            neckConfidence
        );

    }

}


// =======================================================
// DESENHAR POSE
// =======================================================

function drawPose(
    landmarks
) {

    ctx.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
    );


    const screenPoints =
        [];


    const confidences =
        [];


    for (
        let i = 0;
        i < landmarks.length;
        i++
    ) {

        const rawPoint =
            landmarkToScreen(
                landmarks[i]
            );


        const smoothed =
            smoothPoint(
                i,
                rawPoint
            );


        screenPoints[i] =
            smoothed;


        confidences[i] =
            confidenceOf(
                landmarks[i]
            );

    }


    // Segmentos

    for (
        const connection
        of CONNECTIONS
    ) {

        const start =
            connection[0];

        const end =
            connection[1];


        const confidence =
            Math.min(
                confidences[start],
                confidences[end]
            );


        if (
            confidence < 0.20
        ) {

            continue;

        }


        drawSegment(

            screenPoints[start],
            screenPoints[end],

            confidences[start],
            confidences[end]

        );

    }


    // Coluna e pescoço

    drawSpine(
        screenPoints,
        confidences
    );


    // Pontos

    for (
        const index
        of BODY_LANDMARKS
    ) {

        if (
            confidences[index] < 0.20
        ) {

            continue;

        }


        drawJoint(

            screenPoints[index],
            confidences[index]

        );

    }


    updateStatus(
        confidences
    );

}


// =======================================================
// STATUS
// =======================================================

function updateStatus(
    confidences
) {

    const important = [

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

    ];


    let total =
        0;


    let count =
        0;


    for (
        const index
        of important
    ) {

        const confidence =
            confidences[index];


        if (
            confidence !== undefined
        ) {

            total +=
                confidence;

            count++;

        }

    }


    const average =
        count > 0
            ?
            total / count
            :
            0;


    statusDot.classList.remove(
        "active",
        "warning"
    );


    if (
        average >= 0.75
    ) {

        statusDot.classList.add(
            "active"
        );

    }

    else if (
        average >= 0.45
    ) {

        statusDot.classList.add(
            "warning"
        );

    }

}


// =======================================================
// PROCESSAR FRAME
// =======================================================

function processFrame() {

    if (
        !running
        ||
        processing
        ||
        !poseLandmarker
        ||
        video.readyState < 2
    ) {

        return;

    }


    if (
        video.currentTime
        ===
        lastVideoTime
    ) {

        return;

    }


    processing =
        true;


    lastVideoTime =
        video.currentTime;


    try {

        const result =
            poseLandmarker.detectForVideo(

                video,
                performance.now()

            );


        if (
            result.landmarks
            &&
            result.landmarks.length > 0
        ) {

            drawPose(
                result.landmarks[0]
            );

        }

        else {

            ctx.clearRect(
                0,
                0,
                window.innerWidth,
                window.innerHeight
            );


            previousPoints.clear();


            statusDot.classList.remove(
                "active",
                "warning"
            );

        }

    }

    catch (error) {

        console.error(
            error
        );

    }

    finally {

        processing =
            false;

    }

}


// =======================================================
// LOOP SINCRONIZADO COM VÍDEO
// =======================================================

function iniciarLoop() {

    if (
        "requestVideoFrameCallback"
        in HTMLVideoElement.prototype
    ) {

        const frameCallback = () => {

            if (
                !running
            ) {

                return;

            }


            processFrame();


            video.requestVideoFrameCallback(
                frameCallback
            );

        };


        video.requestVideoFrameCallback(
            frameCallback
        );

    }

    else {

        const fallback = () => {

            if (
                !running
            ) {

                return;

            }


            processFrame();


            requestAnimationFrame(
                fallback
            );

        };


        requestAnimationFrame(
            fallback
        );

    }

}


// =======================================================
// INICIAR
// =======================================================

startButton.addEventListener(

    "click",

    async () => {

        try {

            startButton.disabled =
                true;


            startButton.textContent =
                "...";


            if (
                !poseLandmarker
            ) {

                await initializePoseLandmarker();

            }


            await startCamera();


            startButton.textContent =
                "INICIAR";

        }

        catch (error) {

            console.error(
                error
            );


            alert(
                "Não foi possível iniciar a câmera."
            );


            startButton.disabled =
                false;


            startButton.textContent =
                "INICIAR";

        }

    }

);


// =======================================================
// TROCAR CÂMERA
// =======================================================

switchButton.addEventListener(

    "click",

    async () => {

        try {

            await switchCamera();

        }

        catch (error) {

            console.error(
                error
            );

        }

    }

);


// =======================================================
// REDIMENSIONAMENTO
// =======================================================

window.addEventListener(

    "resize",

    () => {

        resizeCanvas();

        previousPoints.clear();

    }

);


// =======================================================
// ORIENTAÇÃO
// =======================================================

window.addEventListener(

    "orientationchange",

    () => {

        setTimeout(

            () => {

                resizeCanvas();

                previousPoints.clear();

            },

            250

        );

    }

);


// =======================================================
// ENCERRAMENTO
// =======================================================

window.addEventListener(

    "beforeunload",

    () => {

        stopCamera();

    }

);