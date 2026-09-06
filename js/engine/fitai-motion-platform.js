// ==========================================================
// FITAI MOTION PLATFORM
// PLATFORM 2.0
//
// Pipeline:
// MediaPipe
//   ↓
// Body Model
//   ↓
// Body Confidence
//   ↓
// Body Normalizer
//   ↓
// Motion Engine
//   ↓
// Reference Engine
//   ↓
// Skill Engine
//
// A plataforma centraliza os módulos, mas mantém
// responsabilidades separadas.
// ==========================================================

import {
    EngineEvents
}
from "./events/engine-events.js";

import {
    SessionEngine
}
from "./session/session-engine.js";

import {
    createMotionContext
}
from "./context/motion-context.js";

import {
    FeedbackEngine
}
from "./feedback/feedback-engine.js";

import {
    CoachEngine
}
from "./coach/coach-engine.js";

import {
    BodyModel
}
from "./body/body-model.js";

import {
    ReferenceRecorder
}
from "./reference/reference-recorder.js";

import {
    BodyNormalizer
}
from "./body/body-normalizer.js";

import {
    BodyConfidence
}
from "./body/body-confidence.js";

import {
    MotionHistory
}
from "./motion/motion-history.js";

import {
    MotionEngine
}
from "./motion/motion-engine.js";

import {
    MotionMetrics
}
from "./motion/motion-metrics.js";

import {
    SkillEngine
}
from "./skills/skill-engine.js";

import {
    SquatSkill
}
from "./skills/squat-skill.js";

import {
    ReferenceEngine
}
from "./reference/reference-engine.js";

import {
    ReferencePlayer
}
from "./reference/reference-player.js";

import {
    MotionComparator
}
from "./performance/motion-comparator.js";

import {
    PerformanceEngine
}
from "./performance/performance-engine.js";


// ==========================================================
// FITAI MOTION PLATFORM
// ==========================================================

export class FitAIMotionPlatform {

    constructor() {

        // --------------------------------------------------
        // BODY
        // --------------------------------------------------

        this.body =
            new BodyModel();


        this.normalizer =
            new BodyNormalizer();


        this.confidence =
            new BodyConfidence();


        // --------------------------------------------------
        // MOTION
        // --------------------------------------------------

        this.history =
            new MotionHistory({

                duration: 4,

                maxFrames: 300

            });


        this.motion =
            new MotionEngine({

                history:
                    this.history

            });

            this.comparator =
    new MotionComparator();

    this.performance =
    new PerformanceEngine();

    this.coach =
    new CoachEngine();

   this.feedback =
    new FeedbackEngine();

    this.events =
    new EngineEvents();

    this.events.on(
    "rep-complete",
    (
        event
    ) => {

        if (
            event.source
            !==
            "skill"
        ) {

            return;

        }


        const sessionState =
            this.session.getState();


        const sessionSkillId =
            sessionState
                ?.exercise
                ?.skillId
            ??
            null;


        const eventSkillId =
            event
                ?.data
                ?.skillId
            ??
            null;


        if (
            !sessionState
                ?.active
            ||
            sessionState
                ?.status
            !==
            "active"
        ) {

            return;

        }


        if (
            !sessionSkillId
            ||
            !eventSkillId
            ||
            sessionSkillId
            !==
            eventSkillId
        ) {

            return;

        }


        this.session.registerRep(
            1,
            event.timestamp
        );

    }
);

this.session =
    new SessionEngine();

this.context =
    createMotionContext();


        this.metrics =
            new MotionMetrics(
                this.history
            );


        // --------------------------------------------------
        // REFERENCE
        // --------------------------------------------------

        this.reference =
            new ReferenceEngine();

            this.referenceRecorder =
    new ReferenceRecorder(
        this.reference
    );
this.referencePlayer =
    new ReferencePlayer();


        // --------------------------------------------------
        // SKILLS
        // --------------------------------------------------

        this.skills =
            new SkillEngine();


        this.squat =
            new SquatSkill();


        this.skills.register(
            this.squat
        );


        // --------------------------------------------------
        // PLATFORM STATE
        // --------------------------------------------------

        this.active =
            true;


        this.frameCount =
            0;


        this.state = {

            timestamp: 0,

            valid: false,

            frameCount: 0,

            body: null,

            normalizedBody: null,

            confidence: null,

            motion: null,

            reference:
                this.reference.getState(),

            referenceFrame: null,

            comparison: null,

            performance: null,

            skill: null,

            session:
                this.session.getState(),

            events: [],

            coach: null,

            feedback: null,

            context:
                this.context

        };

    }


    // ======================================================
    // UPDATE
    // ======================================================

    update(
        landmarks,
        worldLandmarks = null,
        timestamp =
            performance.now()
    ) {

    this.events.beginFrame();

        if (
            !this.active
        ) {

            return this.state;

        }


        // --------------------------------------------------
        // 1. BODY MODEL
        // --------------------------------------------------

        const body =
            this.body.update(

                landmarks,

                worldLandmarks,

                timestamp

            );


        // --------------------------------------------------
        // 2. CONFIDENCE
        // --------------------------------------------------

        const confidenceResult =
            this.confidence.update(
                body
            );


        // --------------------------------------------------
        // 3. NORMALIZATION
        // --------------------------------------------------

        const normalizedBody =
            this.normalizer.normalizeBody(
                body
            );


        // --------------------------------------------------
        // 4. MOTION
        // --------------------------------------------------

        const motionState =
            this.motion.update(
                body
            );


        // --------------------------------------------------
        // 5. REFERENCE RECORDING
        // --------------------------------------------------

        if (
            this.reference.recording
        ) {

            this.reference.addFrame({

                timestamp:
                    body
                        ?.timestamp
                    ??
                    timestamp,

                confidence:
                    confidenceResult
                        ?.detectionScore
                    ??
                    confidenceResult
                        ?.overall
                    ??
                    0,

                bodyState:
                    motionState
                        ?.bodyState
                    ??
                    null,

                intensity:
                    motionState
                        ?.intensity
                    ??
                    0,

                center:
                    body
                        ?.center
                        ?.position
                    ??
                    null,

                joints:
                    body
                        ?.joints
                    ??
                    {},

                angles:
                    body
                        ?.angles
                    ??
                    {},

                regions:
                    confidenceResult
                        ?.regions
                    ??
                    {}

            });

            this.referenceRecorder.update(
    timestamp
);

        }


        // --------------------------------------------------
        // 6. REFERENCE PLAYBACK
        // --------------------------------------------------

        const referencePlaybackFrame =
            this.reference.updatePlayback(
                timestamp
            );


        const referencePlaybackState =
            this.reference.getState()
                ?.playback
            ??
            null;


        const referenceFrame =
            referencePlaybackFrame
                ?
                (
                    this.referencePlayer.sampleAtTime(
                        referencePlaybackState
                            ?.currentTime
                        ??
                        referencePlaybackFrame.time
                        ??
                        0
                    )
                    ??
                    referencePlaybackFrame
                )
                :
                null;


            let comparison =
    null;


if (
    referenceFrame
) {

    comparison =
        this.comparator.compare(

            {

                joints:
                    body
                        ?.joints
                    ??
                    {},

                angles:
                    body
                        ?.angles
                    ??
                    {}

            },

            referenceFrame

        );

}

const performanceState =
    this.performance.update({

        body,

        confidence:
            confidenceResult,

        motion:
            motionState,

        comparison,

        metrics:
            this.metrics,

        history:
            this.history,

        referenceFrame

    });

// --------------------------------------------------
// 7. SKILL / SESSION / COACH / FEEDBACK
// --------------------------------------------------

const skillState =
    this.skills.update({

        body,

        confidence:
            confidenceResult,

        motion:
            motionState,

        metrics:
            this.metrics,

        history:
            this.history,

        reference:
            this.reference,

        referenceFrame,

        comparison,

        performance:
            performanceState

    });


// --------------------------------------------------
// SKILL EVENTS → EVENT BUS
// --------------------------------------------------

if (
    skillState
    &&
    Array.isArray(
        skillState.events
    )
) {

    for (
        const event
        of skillState.events
    ) {

        this.events.emit(
            event,
            {
                skillId:
                    this.skills
                        .getActiveSkill()
                        ?.id
                    ??
                    null
            },
            "skill",
            timestamp
        );

    }

}


// --------------------------------------------------
// SESSION ENGINE
// --------------------------------------------------

const sessionState =
    this.session.update(
        {
            timestamp,

            body,

            confidence:
                confidenceResult,

            motion:
                motionState,

            skill:
                skillState,

            performance:
                performanceState
        },
        timestamp
    );


// --------------------------------------------------
// SESSION EVENTS → EVENT BUS
// --------------------------------------------------

const sessionEvents =
    this.session.consumeEvents();


for (
    const event
    of sessionEvents
) {

    this.events.emit(
        event.type,
        event.data
            ??
            event,
        "session",
        event.timestamp
            ??
            timestamp
    );

}


// --------------------------------------------------
// SESSION ↔ SKILL SYNCHRONIZATION
// --------------------------------------------------

const currentExercise =
    sessionState
        ?.exercise
    ??
    null;


const currentSkillId =
    currentExercise
        ?.skillId
    ??
    null;


const activeSkillId =
    this.skills
        .getActiveSkill()
        ?.id
    ??
    null;


const hasSession =
    Boolean(
        sessionState
            ?.sessionId
    );


const sessionIsActive =
    sessionState
        ?.status
    ===
    "active";


if (
    hasSession
    &&
    sessionIsActive
    &&
    currentSkillId
    &&
    currentSkillId
    !==
    activeSkillId
) {

    this.skills.activate(
        currentSkillId
    );

}


if (
    hasSession
    &&
    (
        !sessionIsActive
        ||
        !currentSkillId
    )
    &&
    activeSkillId
) {

    this.skills.stop();

}


// --------------------------------------------------
// COACH ENGINE
// --------------------------------------------------

const coachState =
    this.coach.update({

        timestamp,

        body,

        confidence:
            confidenceResult,

        motion:
            motionState,

        comparison,

        performance:
            performanceState,

        skill:
            skillState,

        session:
            sessionState,

        events:
            this.events.getFrameEvents()

    });


// --------------------------------------------------
// FEEDBACK ENGINE
// --------------------------------------------------

const feedbackState =
    this.feedback.update(
        coachState,
        timestamp
    );


// --------------------------------------------------
// MOTION CONTEXT
// --------------------------------------------------

const motionContext =
    createMotionContext({

        timestamp,

        frameCount:
            this.frameCount,

       valid:
    Boolean(
        body
        &&
        (
            body.valid
            ||
            motionState
                ?.valid
            ||
            confidenceResult
                ?.detected
        )
    ),

        body,

        normalizedBody,

        confidence:
            confidenceResult,

        motion:
            motionState,

        reference:
            this.reference.getState(),

        referenceFrame,

        comparison,

        performance:
            performanceState,

        skill:
            skillState,

        session:
            sessionState,

        events:
            this.events.getFrameEvents(),

        coach:
            coachState,

        feedback:
            feedbackState

    });


this.context =
    motionContext;

        // --------------------------------------------------
        // 8. PLATFORM STATE
        // --------------------------------------------------

        this.frameCount +=
            1;


        this.state = {

            timestamp,

            valid:
                motionContext.valid,

            frameCount:
                this.frameCount,

            body,

            normalizedBody,

            confidence:
                confidenceResult,

            motion:
                motionState,

            reference:
                this.reference.getState(),

            referenceFrame,

            comparison,

            performance:
                performanceState,

            skill:
                skillState,

            session:
                sessionState,

            events:
                this.events.getFrameEvents(),

            coach:
                coachState,

            feedback:
                feedbackState,

            context:
                motionContext

        };


        return this.state;

    }


    // ======================================================
    // SKILLS
    // ======================================================

    activateSkill(
        skillId
    ) {

        return this.skills.activate(
            skillId
        );

    }


    stopSkill() {

        return this.skills.stop();

    }


    getActiveSkill() {

        return this.skills.getActiveSkill();

    }


    // ======================================================
    // REFERENCE RECORDING
    // ======================================================

    startReferenceRecording(
        options = {}
    ) {

        return this.reference.startRecording(
            options
        );

    }


    stopReferenceRecording(
        options = {}
    ) {

        return this.reference.stopRecording(
            options
        );

    }


    cancelReferenceRecording() {

        return this.reference.cancelRecording();

    }


    addReferenceMarker(
        name,
        data = {}
    ) {

        return this.reference.addMarker(
            name,
            data
        );

    }


    setReferencePhase(
        phase
    ) {

        return this.reference.setPhase(
            phase
        );

    }


    // ======================================================
    // REFERENCES
    // ======================================================

    getReferences() {

        return this.reference.getReferences();

    }


    getReferenceSummaries() {

        return this.reference.getReferenceSummaries();

    }


    activateReference(
          referenceId
) {

    const reference =
        this.reference.activateReference(
            referenceId
        );


    if (
        reference
    ) {

        this.referencePlayer.load(
            reference
        );

    }


    return reference;

}


    deactivateReference() {

       
    this.referencePlayer.unload();


    return this.reference.deactivateReference();

}


    exportReference(
        referenceId
    ) {

        return this.reference.exportReference(
            referenceId
        );

    }


    importReference(
        data
    ) {

        return this.reference.importReference(
            data
        );

    }


    // ======================================================
    // PLAYBACK
    // ======================================================

    startReferencePlayback(
        options = {}
    ) {

        return this.reference.startPlayback(
            options
        );

    }


    stopReferencePlayback() {

        return this.reference.stopPlayback();

    }


    // ======================================================
    // BODY API
    // ======================================================

    getJoint(
        jointName
    ) {

        return this.body.getJoint(
            jointName
        );

    }


    getAngle(
        angleName
    ) {

        return this.body.getAngle(
            angleName
        );

    }


    // ======================================================
    // MOTION API
    // ======================================================

    getJointMotion(
        jointName
    ) {

        return this.motion.getJoint(
            jointName
        );

    }


    getBodyState() {

        return this.motion.getBodyState();

    }


    getIntensity() {

        return this.motion.getIntensity();

    }


    // ======================================================
    // STATE
    // ======================================================

getContext() {

    return this.context;

}

    getState() {

        return this.state;

    }


    // ======================================================
    // PLATFORM CONTROL
    // ======================================================

    enable() {

        this.active =
            true;

    }


    disable() {

        this.active =
            false;

    }


    reset() {

        this.events.reset();

        this.session.reset();

        this.feedback.reset();

        this.coach.reset();

        this.comparator.reset();

        this.body.reset();

        this.performance.reset();

        this.normalizer.reset();

        this.confidence.reset();

        this.history.reset();

        this.motion.reset();

        this.skills.reset();

        this.reference.reset();

        this.referenceRecorder.reset();

        this.referencePlayer.reset();


        this.frameCount =
            0;


        this.context =
            createMotionContext();


        this.state = {

            timestamp: 0,

            valid: false,

            frameCount: 0,

            body: null,

            normalizedBody: null,

            confidence: null,

            motion: null,

            reference:
                this.reference.getState(),

            referenceFrame: null,

            comparison: null,

            performance: null,

            skill: null,

            session:
                this.session.getState(),

            events: [],

            coach: null,

            feedback: null,

            context:
                this.context

        };


        return this.state;

    }
}


// ==========================================================
// INSTÂNCIA PRINCIPAL
// ==========================================================

export const fitaiMotionPlatform =
    new FitAIMotionPlatform();


// ==========================================================
// DEBUG TEMPORÁRIO
// ==========================================================

if (
    typeof window
    !==
    "undefined"
) {

    window.fitaiMotionPlatform =
        fitaiMotionPlatform;

}