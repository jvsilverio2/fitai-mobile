// ==========================================================
// FITAI MOTION PLATFORM
// SKILL ENGINE
//
// Responsabilidade:
// gerenciar habilidades/exercícios específicos.
//
// Exemplo:
// - agachamento
// - flexão
// - jab
// - salto
//
// O Skill Engine recebe dados do Body/Motion Engine
// e entrega estado semântico do movimento.
// ==========================================================


// ==========================================================
// BASE SKILL
// ==========================================================

export class Skill {

    constructor(
        definition = {}
    ) {

        this.id =
            definition.id
            ??
            "unknown-skill";


        this.name =
            definition.name
            ??
            "Unknown Skill";


        this.category =
            definition.category
            ??
            "general";


        this.version =
            definition.version
            ??
            "1.0";


        this.active =
            false;


        this.state =
            this.createInitialState();

    }


    // ======================================================
    // ESTADO INICIAL
    // ======================================================

    createInitialState() {

        return {

            timestamp: 0,

            valid: false,

            phase:
                "idle",

            confidence: 0,

            progress: 0,

            events: [],

            metrics: {},

            flags: {},

            message: ""

        };

    }


    // ======================================================
    // CICLO
    // ======================================================

    start() {

        this.active =
            true;


        this.state.phase =
            "waiting";


        return this.getState();

    }


    stop() {

        this.active =
            false;


        this.state.phase =
            "idle";


        return this.getState();

    }


    reset() {

        const wasActive =
            this.active;


        this.state =
            this.createInitialState();


        this.active =
            wasActive;


        if (
            this.active
        ) {

            this.state.phase =
                "waiting";

        }


        return this.getState();

    }


    update(
    context = {}
) {

    this.clearEvents();


    this.state.timestamp =
        context.body
            ?.timestamp
        ??
        performance.now();


    return this.getState();

}


    // ======================================================
    // EVENTS
    // ======================================================

    emit(
        event
    ) {

        if (
            !event
        ) {

            return;

        }


        this.state.events.push(
            event
        );

    }


    clearEvents() {

        this.state.events =
            [];

    }


    // ======================================================
    // STATE HELPERS
    // ======================================================

    setPhase(
        phase
    ) {

        this.state.phase =
            phase;


        return this.state.phase;

    }


    setProgress(
        progress
    ) {

        const numeric =
            Number(
                progress
            );


        if (
            !Number.isFinite(
                numeric
            )
        ) {

            this.state.progress =
                0;


            return this.state.progress;

        }


        this.state.progress =
            Math.max(
                0,
                Math.min(
                    1,
                    numeric
                )
            );


        return this.state.progress;

    }


    setConfidence(
        confidence
    ) {

        const numeric =
            Number(
                confidence
            );


        if (
            !Number.isFinite(
                numeric
            )
        ) {

            this.state.confidence =
                0;


            return this.state.confidence;

        }


        this.state.confidence =
            Math.max(
                0,
                Math.min(
                    1,
                    numeric
                )
            );


        return this.state.confidence;

    }


    setMetric(
        name,
        value
    ) {

        this.state.metrics[
            name
        ] =
            value;


        return value;

    }


    getMetric(
        name,
        fallback = null
    ) {

        return (
            this.state.metrics[
                name
            ]
            ??
            fallback
        );

    }


    setFlag(
        name,
        value = true
    ) {

        this.state.flags[
            name
        ] =
            value;


        return value;

    }


    getFlag(
        name,
        fallback = false
    ) {

        return (
            this.state.flags[
                name
            ]
            ??
            fallback
        );

    }


    setMessage(
        message
    ) {

        this.state.message =
            String(
                message
                ??
                ""
            );


        return this.state.message;

    }


    // ======================================================
    // API
    // ======================================================

    getState() {

        return {

            id:
                this.id,

            name:
                this.name,

            category:
                this.category,

            version:
                this.version,

            active:
                this.active,

            ...this.state,

            events: [
                ...this.state.events
            ],

            metrics: {
                ...this.state.metrics
            },

            flags: {
                ...this.state.flags
            }

        };

    }


    getDefinition() {

        return {

            id:
                this.id,

            name:
                this.name,

            category:
                this.category,

            version:
                this.version,

            active:
                this.active

        };

    }

}


// ==========================================================
// SKILL ENGINE
// ==========================================================

export class SkillEngine {

    constructor() {

        this.skills =
            new Map();


        this.activeSkill =
            null;


        this.context = {

            body: null,

            confidence: null,

            motion: null,

            metrics: null,

            history: null,

            reference: null,

            referenceFrame: null,

            comparison: null,

            performance: null

        };

    }


    // ======================================================
    // REGISTRO
    // ======================================================

    register(
        skill
    ) {

        if (
            !skill
            ||
            !skill.id
        ) {

            return false;

        }


        this.skills.set(
            skill.id,
            skill
        );


        return true;

    }


    unregister(
        skillId
    ) {

        if (
            this.activeSkill
            ?.id
            ===
            skillId
        ) {

            this.stop();

        }


        return this.skills.delete(
            skillId
        );

    }


    // ======================================================
    // ATIVAÇÃO
    // ======================================================

    activate(
        skillId
    ) {

        const skill =
            this.skills.get(
                skillId
            );


        if (
            !skill
        ) {

            return null;

        }


        if (
            this.activeSkill
            &&
            this.activeSkill
            !==
            skill
        ) {

            this.activeSkill.stop();

        }


        this.activeSkill =
            skill;


        this.activeSkill.reset();


        this.activeSkill.start();


        return this.activeSkill.getState();

    }


    stop() {

        if (
            !this.activeSkill
        ) {

            return null;

        }


        const state =
            this.activeSkill.stop();


        this.activeSkill =
            null;


        return state;

    }


    // ======================================================
    // UPDATE
    // ======================================================

    update(
        context = {}
    ) {

        this.context = {

            body:
                context.body
                ??
                null,

            confidence:
                context.confidence
                ??
                null,

            motion:
                context.motion
                ??
                null,

            metrics:
                context.metrics
                ??
                null,

            history:
                context.history
                ??
                null,

            reference:
                context.reference
                ??
                null,

            referenceFrame:
                context.referenceFrame
                ??
                null,

            comparison:
                context.comparison
                ??
                null,

            performance:
                context.performance
                ??
                null

        };


        if (
            !this.activeSkill
        ) {

            return null;

        }


        if (
            !this.activeSkill.active
        ) {

            this.activeSkill.start();

        }


        return this.activeSkill.update(
            this.context
        );

    }


    // ======================================================
    // CONSULTAS
    // ======================================================

    getSkill(
        skillId
    ) {

        return (
            this.skills.get(
                skillId
            )
            ??
            null
        );

    }


    getActiveSkill() {

        return this.activeSkill;

    }


    getActiveState() {

        if (
            !this.activeSkill
        ) {

            return null;

        }


        return this.activeSkill.getState();

    }


    getRegisteredSkills() {

        return Array.from(
            this.skills.values()
        )
        .map(
            skill =>
                skill.getDefinition()
        );

    }


    // ======================================================
    // RESET
    // ======================================================

    resetActiveSkill() {

        if (
            !this.activeSkill
        ) {

            return null;

        }


        return this.activeSkill.reset();

    }


    reset() {

        if (
            this.activeSkill
        ) {

            this.activeSkill.stop();

        }


        for (
            const skill
            of
            this.skills.values()
        ) {

            skill.reset();

        }


        this.activeSkill =
            null;


        this.context = {

            body: null,

            confidence: null,

            motion: null,

            metrics: null,

            history: null

        };

    }

}


// ==========================================================
// INSTÂNCIA PRINCIPAL
// ==========================================================

export const fitaiSkillEngine =
    new SkillEngine();