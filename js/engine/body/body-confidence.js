// ==========================================================
// FITAI MOTION PLATFORM
// BODY CONFIDENCE 2.0
//
// Responsabilidade:
// avaliar a confiança por região corporal.
//
// Princípio:
// o Body Engine informa QUAIS regiões consegue entender.
// Cada Skill decide QUAIS regiões precisa.
//
// Exemplo:
// boxe pode funcionar sem pernas.
// agachamento exige quadril, joelhos e tornozelos.
//
// NÃO:
// - avalia exercício
// - desenha
// - fornece feedback ao usuário
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


function jointConfidence(
    joint
) {

    if (
        !joint
    ) {

        return 0;

    }


    return clamp(

        joint.confidence
        ??
        joint.visibility
        ??
        0

    );

}


// ==========================================================
// REGIÕES CORPORAIS
// ==========================================================

export const BODY_REGIONS =
    Object.freeze({

        head: [

            "nose",

            "leftEye",
            "rightEye",

            "leftEar",
            "rightEar"

        ],


        shoulders: [

            "leftShoulder",
            "rightShoulder"

        ],


        core: [

            "leftShoulder",
            "rightShoulder",

            "leftHip",
            "rightHip"

        ],


        hips: [

            "leftHip",
            "rightHip"

        ],


        leftArm: [

            "leftShoulder",
            "leftElbow",
            "leftWrist"

        ],


        rightArm: [

            "rightShoulder",
            "rightElbow",
            "rightWrist"

        ],


        arms: [

            "leftShoulder",
            "leftElbow",
            "leftWrist",

            "rightShoulder",
            "rightElbow",
            "rightWrist"

        ],


        leftHand: [

            "leftWrist",
            "leftPinky",
            "leftIndex",
            "leftThumb"

        ],


        rightHand: [

            "rightWrist",
            "rightPinky",
            "rightIndex",
            "rightThumb"

        ],


        hands: [

            "leftWrist",
            "leftPinky",
            "leftIndex",
            "leftThumb",

            "rightWrist",
            "rightPinky",
            "rightIndex",
            "rightThumb"

        ],


        leftLeg: [

            "leftHip",
            "leftKnee",
            "leftAnkle"

        ],


        rightLeg: [

            "rightHip",
            "rightKnee",
            "rightAnkle"

        ],


        legs: [

            "leftHip",
            "leftKnee",
            "leftAnkle",

            "rightHip",
            "rightKnee",
            "rightAnkle"

        ],


        knees: [

            "leftKnee",
            "rightKnee"

        ],


        ankles: [

            "leftAnkle",
            "rightAnkle"

        ],


        leftFoot: [

            "leftAnkle",
            "leftHeel",
            "leftFootIndex"

        ],


        rightFoot: [

            "rightAnkle",
            "rightHeel",
            "rightFootIndex"

        ],


        feet: [

            "leftAnkle",
            "leftHeel",
            "leftFootIndex",

            "rightAnkle",
            "rightHeel",
            "rightFootIndex"

        ],


        upperBody: [

            "leftShoulder",
            "rightShoulder",

            "leftElbow",
            "rightElbow",

            "leftWrist",
            "rightWrist"

        ],


        lowerBody: [

            "leftHip",
            "rightHip",

            "leftKnee",
            "rightKnee",

            "leftAnkle",
            "rightAnkle"

        ]

    });


// ==========================================================
// BODY CONFIDENCE
// ==========================================================

export class BodyConfidence {

    constructor(
        options = {}
    ) {

        this.minimumJointConfidence =
            options.minimumJointConfidence
            ??
            0.45;


        this.usableRegionConfidence =
            options.usableRegionConfidence
            ??
            0.50;


        this.goodRegionConfidence =
            options.goodRegionConfidence
            ??
            0.70;


        this.result =
            this.emptyResult();

    }


    // ======================================================
    // UPDATE
    // ======================================================

    update(
        body
    ) {

        if (
            !body
            ||
            !body.joints
        ) {

            this.result =
                this.emptyResult();


            return this.result;

        }


        const joints =
            body.joints;


        const regions = {};


        for (
            const [
                regionName,
                jointNames
            ]
            of
            Object.entries(
                BODY_REGIONS
            )
        ) {

            regions[
                regionName
            ] =
                this.evaluateRegion(

                    joints,

                    jointNames

                );

        }


        const missing = [];

        const weak = [];


        for (
            const [
                name,
                joint
            ]
            of
            Object.entries(
                joints
            )
        ) {

            const confidence =
                jointConfidence(
                    joint
                );


            if (
                confidence
                <=
                0.05
            ) {

                missing.push(
                    name
                );

            }

            else if (
                confidence
                <
                this.minimumJointConfidence
            ) {

                weak.push(
                    name
                );

            }

        }


        // --------------------------------------------------
        // Presença corporal
        //
        // Não exige corpo inteiro.
        //
        // Consideramos que existe um corpo utilizável quando
        // ao menos uma região estrutural importante é vista
        // com confiança suficiente.
        // --------------------------------------------------

        const detectionScore =
            Math.max(

                regions.core.score,

                regions.upperBody.score,

                regions.lowerBody.score,

                regions.arms.score,

                regions.legs.score

            );


        const detected =
            detectionScore
            >=
            this.usableRegionConfidence;


        // "overall" continua existindo apenas como informação
        // estatística. Ele NÃO decide sozinho se o corpo existe.

        const overall =
            average([

                regions.head.score,

                regions.core.score,

                regions.arms.score,

                regions.hips.score,

                regions.legs.score

            ]);


        this.result = {

            detected,

            valid:
                detected,

            overall,

            detectionScore,

            status:
                this.getStatus(
                    detectionScore
                ),

            regions,

            missing,

            weak

        };


        return this.result;

    }


    // ======================================================
    // REGIÃO
    // ======================================================

    evaluateRegion(
        joints,
        jointNames
    ) {

        const values =
            jointNames.map(
                name =>
                    jointConfidence(
                        joints[
                            name
                        ]
                    )
            );


        const score =
            average(
                values
            );


        const strongCount =
            values.filter(
                value =>
                    value
                    >=
                    this.minimumJointConfidence
            ).length;


        const coverage =
            jointNames.length > 0
                ?
                strongCount
                /
                jointNames.length
                :
                0;


        return {

            score,

            coverage,

            usable:
                (
                    score
                    >=
                    this.usableRegionConfidence
                    &&
                    coverage
                    >=
                    0.5
                ),

            good:
                (
                    score
                    >=
                    this.goodRegionConfidence
                    &&
                    coverage
                    >=
                    0.65
                ),

            joints: [
                ...jointNames
            ]

        };

    }


    // ======================================================
    // STATUS
    // ======================================================

    getStatus(
        score
    ) {

        if (
            score
            >=
            0.82
        ) {

            return "excellent";

        }


        if (
            score
            >=
            0.68
        ) {

            return "good";

        }


        if (
            score
            >=
            0.50
        ) {

            return "usable";

        }


        if (
            score
            >=
            0.30
        ) {

            return "weak";

        }


        return "lost";

    }


    // ======================================================
    // CONSULTA DE REGIÃO
    // ======================================================

    getRegion(
        regionName
    ) {

        return (
            this.result
                .regions[
                    regionName
                ]
            ??
            null
        );

    }


    getRegionScore(
        regionName
    ) {

        return (
            this.getRegion(
                regionName
            )
                ?.score
            ??
            0
        );

    }


    canTrustRegion(
        regionName,
        minimumScore =
            this.usableRegionConfidence
    ) {

        const region =
            this.getRegion(
                regionName
            );


        if (
            !region
        ) {

            return false;

        }


        return (
            region.score
            >=
            minimumScore
            &&
            region.coverage
            >=
            0.5
        );

    }


    // ======================================================
    // MÚLTIPLAS REGIÕES
    // ======================================================

    canTrustRegions(
        regionNames,
        minimumScore =
            this.usableRegionConfidence
    ) {

        if (
            !Array.isArray(
                regionNames
            )
            ||
            regionNames.length === 0
        ) {

            return false;

        }


        return regionNames.every(
            regionName =>
                this.canTrustRegion(

                    regionName,

                    minimumScore

                )
        );

    }


    // ======================================================
    // REQUISITOS DE UMA SKILL
    //
    // Exemplo:
    //
    // evaluateRequirements({
    //     required: ["hips", "knees", "ankles"],
    //     optional: ["feet"],
    //     minimumScore: 0.55
    // })
    // ======================================================

    evaluateRequirements(
        requirements = {}
    ) {

        const required =
            requirements.required
            ??
            [];


        const optional =
            requirements.optional
            ??
            [];


        const minimumScore =
            requirements.minimumScore
            ??
            this.usableRegionConfidence;


        const requiredResults =
            required.map(
                regionName => {

                    const region =
                        this.getRegion(
                            regionName
                        );


                    return {

                        region:
                            regionName,

                        score:
                            region
                                ?.score
                            ??
                            0,

                        coverage:
                            region
                                ?.coverage
                            ??
                            0,

                        trusted:
                            this.canTrustRegion(

                                regionName,

                                minimumScore

                            )

                    };

                }
            );


        const optionalResults =
            optional.map(
                regionName => {

                    const region =
                        this.getRegion(
                            regionName
                        );


                    return {

                        region:
                            regionName,

                        score:
                            region
                                ?.score
                            ??
                            0,

                        coverage:
                            region
                                ?.coverage
                            ??
                            0,

                        trusted:
                            this.canTrustRegion(

                                regionName,

                                minimumScore

                            )

                    };

                }
            );


        const missingRequired =
            requiredResults
                .filter(
                    item =>
                        !item.trusted
                )
                .map(
                    item =>
                        item.region
                );


        const ready =
            missingRequired.length
            ===
            0;


        const requiredScore =
            average(
                requiredResults.map(
                    item =>
                        item.score
                )
            );


        return {

            ready,

            score:
                requiredResults.length > 0
                    ?
                    requiredScore
                    :
                    1,

            minimumScore,

            required:
                requiredResults,

            optional:
                optionalResults,

            missingRequired

        };

    }


    // ======================================================
    // ATALHOS
    // ======================================================

    canTrustUpperBody() {

        return this.canTrustRegion(
            "upperBody"
        );

    }


    canTrustLowerBody() {

        return this.canTrustRegion(
            "lowerBody"
        );

    }


    canTrustArms() {

        return this.canTrustRegion(
            "arms"
        );

    }


    canTrustHands() {

        return this.canTrustRegion(
            "hands"
        );

    }


    canTrustCore() {

        return this.canTrustRegion(
            "core"
        );

    }


    canTrustHips() {

        return this.canTrustRegion(
            "hips"
        );

    }


    canTrustLegs() {

        return this.canTrustRegion(
            "legs"
        );

    }


    canTrustFeet() {

        return this.canTrustRegion(
            "feet"
        );

    }


    // ======================================================
    // API
    // ======================================================

    getResult() {

        return this.result;

    }


    emptyResult() {

        return {

            detected: false,

            valid: false,

            overall: 0,

            detectionScore: 0,

            status:
                "lost",

            regions: {},

            missing: [],

            weak: []

        };

    }


    reset() {

        this.result =
            this.emptyResult();

    }

}


// ==========================================================
// INSTÂNCIA PRINCIPAL
// ==========================================================

export const fitaiBodyConfidence =
    new BodyConfidence();