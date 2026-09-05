// ==========================================================
// FITAI - SHADOW ENGINE
// Referência amarela ancorada no corpo atual do usuário
// ==========================================================

import { getBodyTransform } from "./motion-engine.js";

let liveLandmarks = null;

const CONNECTIONS = [
    [11,12], [11,13], [13,15], [12,14], [14,16],
    [11,23], [12,24], [23,24],
    [23,25], [25,27], [27,29], [29,31],
    [24,26], [26,28], [28,30], [30,32]
];

function midpoint(a, b) {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        z: ((a.z ?? 0) + (b.z ?? 0)) / 2
    };
}

function smoothStep(t) {
    const value = Math.max(0, Math.min(1, t));
    return value * value * (3 - 2 * value);
}

function squatAmount(timestamp, slow = false) {
    const cycle = slow ? 12000 : 3800;
    const p = (timestamp % cycle) / cycle;

    if (slow) {
        if (p < 0.17) return 0;
        if (p < 0.42) return smoothStep((p - 0.17) / 0.25);
        if (p < 0.58) return 1;
        if (p < 0.83) return 1 - smoothStep((p - 0.58) / 0.25);
        return 0;
    }

    if (p < 0.15) return 0;
    if (p < 0.45) return smoothStep((p - 0.15) / 0.30);
    if (p < 0.58) return 1;
    if (p < 0.88) return 1 - smoothStep((p - 0.58) / 0.30);
    return 0;
}

function makeCanonicalSquat(timestamp, slow = false) {
    const a = squatAmount(timestamp, slow);

    const points = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 1 }));

    const set = (index, x, y, z = 0) => {
        points[index] = { x, y, z, visibility: 1 };
    };

    const hipY = 0.53 + 0.12 * a;
    const torsoLean = 0.10 * a;
    const kneeOut = 0.07 * a;
    const shoulderY = 0.31 + 0.10 * a;

    set(0, 0.50 + torsoLean, 0.20 + 0.08 * a);
    set(11, 0.44 + torsoLean, shoulderY);
    set(12, 0.56 + torsoLean, shoulderY);
    set(23, 0.46, hipY);
    set(24, 0.54, hipY);

    set(25, 0.45 + kneeOut, 0.69);
    set(26, 0.55 - kneeOut, 0.69);
    set(27, 0.43, 0.88);
    set(28, 0.57, 0.88);
    set(29, 0.42, 0.90);
    set(30, 0.58, 0.90);
    set(31, 0.47, 0.90);
    set(32, 0.63, 0.90);

    const armForward = 0.18 * a;
    set(13, 0.40 + torsoLean + armForward * 0.55, 0.43 - 0.07 * a);
    set(14, 0.60 + torsoLean + armForward * 0.55, 0.43 - 0.07 * a);
    set(15, 0.39 + torsoLean + armForward, 0.55 - 0.15 * a);
    set(16, 0.61 + torsoLean + armForward, 0.55 - 0.15 * a);

    return points;
}

function canonicalTransform(points) {
    const shoulders = midpoint(points[11], points[12]);
    const hips = midpoint(points[23], points[24]);
    const center = midpoint(shoulders, hips);
    const scale = Math.max(0.1, Math.hypot(shoulders.x - hips.x, shoulders.y - hips.y) * 2.7);
    return { center, scale };
}

function alignToLive(points) {
    if (!liveLandmarks?.[11] || !liveLandmarks?.[12] || !liveLandmarks?.[23] || !liveLandmarks?.[24]) {
        return points;
    }

    const target = getBodyTransform(liveLandmarks);
    const source = canonicalTransform(points);
    const ratio = target.scale / source.scale;

    return points.map(point => ({
        ...point,
        x: target.center.x + (point.x - source.center.x) * ratio,
        y: target.center.y + (point.y - source.center.y) * ratio,
        z: target.center.z + ((point.z ?? 0) - (source.center.z ?? 0)) * ratio
    }));
}

function alignRecordedToLive(frame) {
    const points = frame?.landmarks;
    if (!points?.length || !liveLandmarks?.length) return points;

    const target = getBodyTransform(liveLandmarks);
    const source = frame.body ?? getBodyTransform(points);
    const sourceScale = Math.max(0.05, source.scale ?? 0.05);
    const ratio = target.scale / sourceScale;

    return points.map(point => ({
        ...point,
        x: target.center.x + (point.x - source.center.x) * ratio,
        y: target.center.y + (point.y - source.center.y) * ratio,
        z: target.center.z + ((point.z ?? 0) - (source.center.z ?? 0)) * ratio
    }));
}

function toScreen(point, width, height, mirror) {
    let x = point.x * width;
    if (mirror) x = width - x;
    return { x, y: point.y * height };
}

function draw(ctx, points, width, height, mirror, opacity = 0.68) {
    if (!points?.length) return;

    const screen = points.map(point => toScreen(point, width, height, mirror));

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = `rgba(243,230,0,${opacity})`;
    ctx.fillStyle = `rgba(243,230,0,${Math.min(0.95, opacity + 0.16)})`;
    ctx.lineWidth = 3.2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(243,230,0,.16)";

    CONNECTIONS.forEach(([a, b]) => {
        if (!screen[a] || !screen[b]) return;
        ctx.beginPath();
        ctx.moveTo(screen[a].x, screen[a].y);
        ctx.lineTo(screen[b].x, screen[b].y);
        ctx.stroke();
    });

    [11,12,13,14,15,16,23,24,25,26,27,28].forEach(index => {
        const point = screen[index];
        if (!point) return;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4.6, 0, Math.PI * 2);
        ctx.fill();
    });

    if (screen[0]) {
        ctx.beginPath();
        ctx.arc(screen[0].x, screen[0].y, 12, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

export function setShadowLiveLandmarks(landmarks) {
    liveLandmarks = landmarks?.length ? landmarks : null;
}

export function clearShadowLiveLandmarks() {
    liveLandmarks = null;
}

export function drawExerciseShadow(ctx, exercise, timestamp, width, height, mirror, slow = false) {
    if (!exercise) return false;

    if (exercise.id === "agachamento") {
        const points = alignToLive(makeCanonicalSquat(timestamp, slow));
        draw(ctx, points, width, height, mirror, slow ? 0.86 : 0.62);
        return true;
    }

    if (exercise.motion === "recorded" && exercise.frames?.length) {
        const duration = Math.max(300, exercise.durationMs ?? exercise.frames.at(-1)?.t ?? 300);
        const playbackTime = slow ? (timestamp * 0.42) % duration : timestamp % duration;
        let frame = exercise.frames[0];

        for (let i = 1; i < exercise.frames.length; i++) {
            if (exercise.frames[i].t > playbackTime) break;
            frame = exercise.frames[i];
        }

        draw(ctx, alignRecordedToLive(frame), width, height, mirror, slow ? 0.86 : 0.62);
        return true;
    }

    return false;
}
