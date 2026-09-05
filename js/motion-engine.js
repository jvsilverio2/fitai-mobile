// ==========================================================
// FITAI - MOTION ENGINE
// Estabilização temporal + métricas para gravação e replay
// ==========================================================

const LOW_CONFIDENCE = 0.46;
const MAX_HOLD_MS = 220;
const MAX_NORMALIZED_JUMP = 0.11;

const ANGLE_TRIPLETS = {
    leftElbow: [11, 13, 15],
    rightElbow: [12, 14, 16],
    leftShoulder: [13, 11, 23],
    rightShoulder: [14, 12, 24],
    leftHip: [11, 23, 25],
    rightHip: [12, 24, 26],
    leftKnee: [23, 25, 27],
    rightKnee: [24, 26, 28]
};

let previous = [];
let previousAt = [];
let previousAngles = null;
let previousAngleTimestamp = null;

function clonePoint(point) {
    return {
        x: point?.x ?? 0,
        y: point?.y ?? 0,
        z: point?.z ?? 0,
        visibility: point?.visibility ?? 0
    };
}

function pointDistance(a, b) {
    const dx = (a?.x ?? 0) - (b?.x ?? 0);
    const dy = (a?.y ?? 0) - (b?.y ?? 0);
    const dz = (a?.z ?? 0) - (b?.z ?? 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function blend(a, b, alpha) {
    return {
        x: a.x + (b.x - a.x) * alpha,
        y: a.y + (b.y - a.y) * alpha,
        z: (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * alpha,
        visibility: Math.max(a.visibility ?? 0, b.visibility ?? 0)
    };
}

function angle(a, b, c) {
    if (!a || !b || !c) return null;

    const ab = {
        x: a.x - b.x,
        y: a.y - b.y,
        z: (a.z ?? 0) - (b.z ?? 0)
    };

    const cb = {
        x: c.x - b.x,
        y: c.y - b.y,
        z: (c.z ?? 0) - (b.z ?? 0)
    };

    const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
    const magA = Math.hypot(ab.x, ab.y, ab.z);
    const magC = Math.hypot(cb.x, cb.y, cb.z);

    if (!magA || !magC) return null;

    const cosine = Math.max(-1, Math.min(1, dot / (magA * magC)));
    return Math.acos(cosine) * 180 / Math.PI;
}

function midpoint(a, b) {
    return {
        x: ((a?.x ?? 0) + (b?.x ?? 0)) / 2,
        y: ((a?.y ?? 0) + (b?.y ?? 0)) / 2,
        z: ((a?.z ?? 0) + (b?.z ?? 0)) / 2
    };
}

function bodyTransform(landmarks) {
    const shoulders = midpoint(landmarks[11], landmarks[12]);
    const hips = midpoint(landmarks[23], landmarks[24]);
    const center = midpoint(shoulders, hips);

    const shoulderWidth = pointDistance(landmarks[11], landmarks[12]);
    const hipWidth = pointDistance(landmarks[23], landmarks[24]);
    const torsoLength = pointDistance(shoulders, hips);

    const scale = Math.max(
        0.08,
        torsoLength * 2.7,
        shoulderWidth * 2.1,
        hipWidth * 2.5
    );

    const orientation = Math.atan2(
        landmarks[12].y - landmarks[11].y,
        landmarks[12].x - landmarks[11].x
    );

    return {
        center,
        scale,
        orientation
    };
}

function calculateAngles(landmarks) {
    const result = {};

    Object.entries(ANGLE_TRIPLETS).forEach(([name, [a, b, c]]) => {
        const value = angle(landmarks[a], landmarks[b], landmarks[c]);
        result[name] = value == null ? null : Number(value.toFixed(2));
    });

    return result;
}

function calculateAngularVelocity(angles, timestamp) {
    const velocities = {};
    const dt = previousAngleTimestamp == null
        ? null
        : Math.max(0.001, (timestamp - previousAngleTimestamp) / 1000);

    Object.keys(angles).forEach(name => {
        const current = angles[name];
        const last = previousAngles?.[name];

        velocities[name] = (
            dt == null || current == null || last == null
        )
            ? 0
            : Number(((current - last) / dt).toFixed(2));
    });

    previousAngles = { ...angles };
    previousAngleTimestamp = timestamp;

    return velocities;
}

function frameQuality(landmarks) {
    const important = [11,12,13,14,15,16,23,24,25,26,27,28];
    const confidence = important.reduce(
        (sum, index) => sum + (landmarks[index]?.visibility ?? 0),
        0
    ) / important.length;

    const lowConfidenceCount = important.filter(
        index => (landmarks[index]?.visibility ?? 0) < LOW_CONFIDENCE
    ).length;

    return {
        confidence: Number(confidence.toFixed(3)),
        lowConfidenceCount,
        occlusionRisk: lowConfidenceCount >= 2
    };
}

export function resetMotionEngine() {
    previous = [];
    previousAt = [];
    previousAngles = null;
    previousAngleTimestamp = null;
}

export function stabilizePoseLandmarks(landmarks, timestamp = performance.now()) {
    if (!landmarks?.length) return landmarks;

    const output = landmarks.map((raw, index) => {
        const current = clonePoint(raw);
        const last = previous[index];
        const lastAt = previousAt[index] ?? -Infinity;

        if (!last) {
            previous[index] = current;
            previousAt[index] = timestamp;
            return current;
        }

        const confidence = current.visibility ?? 0;
        const jump = pointDistance(current, last);

        // Quando um membro cruza/oculta outro por poucos frames,
        // preservamos continuidade em vez de aceitar um salto brusco.
        if (
            confidence < LOW_CONFIDENCE &&
            timestamp - lastAt <= MAX_HOLD_MS
        ) {
            const held = {
                ...last,
                visibility: confidence
            };
            return held;
        }

        let stabilized = current;

        if (jump > MAX_NORMALIZED_JUMP) {
            const alpha = confidence >= 0.72 ? 0.34 : 0.18;
            stabilized = blend(last, current, alpha);
        } else if (confidence < 0.65) {
            stabilized = blend(last, current, 0.42);
        }

        previous[index] = stabilized;
        previousAt[index] = timestamp;

        return stabilized;
    });

    return output;
}

export function buildMotionFrame(landmarks, elapsed, timestamp = performance.now()) {
    const transform = bodyTransform(landmarks);
    const angles = calculateAngles(landmarks);
    const angularVelocity = calculateAngularVelocity(angles, timestamp);
    const quality = frameQuality(landmarks);

    return {
        t: Math.round(elapsed),
        landmarks: landmarks.map(landmark => ({
            x: Number(landmark.x.toFixed(5)),
            y: Number(landmark.y.toFixed(5)),
            z: Number((landmark.z ?? 0).toFixed(5)),
            visibility: Number((landmark.visibility ?? 1).toFixed(3))
        })),
        body: {
            center: {
                x: Number(transform.center.x.toFixed(5)),
                y: Number(transform.center.y.toFixed(5)),
                z: Number((transform.center.z ?? 0).toFixed(5))
            },
            scale: Number(transform.scale.toFixed(5)),
            orientation: Number(transform.orientation.toFixed(5))
        },
        angles,
        angularVelocity,
        quality
    };
}

export function getBodyTransform(landmarks) {
    return bodyTransform(landmarks);
}
