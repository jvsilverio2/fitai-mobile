// ==========================================================
// FITAI MOTION PLATFORM
// ENGINE TEST 2.0
// ==========================================================

import { BodyModel } from "./body/body-model.js";
import { BodyNormalizer } from "./body/body-normalizer.js";
import { BodyConfidence } from "./body/body-confidence.js";
import { MotionHistory } from "./motion/motion-history.js";
import { MotionEngine } from "./motion/motion-engine.js";
import { MotionMetrics } from "./motion/motion-metrics.js";
import { MotionSignature } from "./reference/motion-signature.js";
import { ReferenceEngine } from "./reference/reference-engine.js";
import { ReferenceRecorder } from "./reference/reference-recorder.js";
import { ReferencePlayer } from "./reference/reference-player.js";
import { MotionComparator } from "./performance/motion-comparator.js";
import { PerformanceEngine } from "./performance/performance-engine.js";
import { SkillEngine } from "./skills/skill-engine.js";
import { SquatSkill } from "./skills/squat-skill.js";
import { SessionEngine } from "./session/session-engine.js";
import { EngineEvents } from "./events/engine-events.js";
import { CoachEngine } from "./coach/coach-engine.js";
import { FeedbackEngine } from "./feedback/feedback-engine.js";
import { createMotionContext } from "./context/motion-context.js";
import { FitAIMotionPlatform } from "./fitai-motion-platform.js";

function runEngineHealthCheck() {
    const history = new MotionHistory({ duration: 4, maxFrames: 300 });
    const reference = new ReferenceEngine();
    const skills = new SkillEngine();
    const squat = new SquatSkill();

    const tests = {
        bodyModel: new BodyModel() instanceof BodyModel,
        normalizer: new BodyNormalizer() instanceof BodyNormalizer,
        confidence: new BodyConfidence() instanceof BodyConfidence,
        motionHistory: history instanceof MotionHistory,
        motionEngine: new MotionEngine({ history }) instanceof MotionEngine,
        motionMetrics: new MotionMetrics(history) instanceof MotionMetrics,
        motionSignature: new MotionSignature() instanceof MotionSignature,
        referenceEngine: reference instanceof ReferenceEngine,
        referenceRecorder: new ReferenceRecorder(reference) instanceof ReferenceRecorder,
        referencePlayer: new ReferencePlayer() instanceof ReferencePlayer,
        comparator: new MotionComparator() instanceof MotionComparator,
        performance: new PerformanceEngine() instanceof PerformanceEngine,
        skillEngine: skills instanceof SkillEngine,
        squatRegistered: skills.register(squat) === true,
        squatActivated:
            Boolean(
                skills.activate("squat")
                    ?.active
            ),
        session: new SessionEngine() instanceof SessionEngine,
        events: new EngineEvents() instanceof EngineEvents,
        coach: new CoachEngine() instanceof CoachEngine,
        feedback: new FeedbackEngine() instanceof FeedbackEngine,
        context: Boolean(createMotionContext()),
        platform: new FitAIMotionPlatform() instanceof FitAIMotionPlatform
    };

    const passed = Object.values(tests).every(Boolean);

    const status = {
        passed,
        status: passed ? "READY" : "ERROR",
        tests
    };

    console.table(tests);
    console.log(
        passed
            ? "✅ FITAI MOTION PLATFORM — ENGINE STATUS: READY"
            : "❌ FITAI MOTION PLATFORM — ENGINE STATUS: ERROR"
    );

    return status;
}

if (typeof window !== "undefined") {
    window.runFitAIEngineHealthCheck = runEngineHealthCheck;
}

export { runEngineHealthCheck };
