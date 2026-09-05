export const STORAGE = {
    entered: "fitai_entered_v1",
    account: "fitai_account_v1",
    favorites: "fitai_favorites_v1",
    routines: "fitai_routines_v3",
    oldRoutines: "fitai_routines_v2",
    settings: "fitai_settings_v2",
    createdExercises: "fitai_created_exercises_v1"
};


export function loadJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);

        if (value === null) {
            return fallback;
        }

        return JSON.parse(value);
    }

    catch {
        return fallback;
    }
}


export function saveJSON(key, value) {
    localStorage.setItem(
        key,
        JSON.stringify(value)
    );
}


export function createId(prefix = "item") {
    const randomPart =
        window.crypto?.randomUUID?.()
        ??
        `${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`;

    return `${prefix}-${randomPart}`;
}