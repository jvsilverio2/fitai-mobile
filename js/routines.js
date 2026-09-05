import {
    STORAGE,
    loadJSON,
    saveJSON,
    createId
}
from "./storage.js";


const DEFAULT_REPS = 12;
const DEFAULT_SECONDS = 30;
const DEFAULT_SETS = 3;
const DEFAULT_REST = 60;


// ==========================================================
// MIGRAÇÃO
// ==========================================================

function migrateOldExercise(item) {

    if (
        typeof item === "string"
    ) {

        return {
            id: createId("routine-exercise"),

            exerciseId: item,

            mode: "reps",

            reps: DEFAULT_REPS,

            seconds: DEFAULT_SECONDS,

            sets: DEFAULT_SETS,

            restSeconds: DEFAULT_REST,

            supervision: true
        };

    }


    return {
        id:
            item.id
            ||
            createId("routine-exercise"),

        exerciseId:
            item.exerciseId,

        mode:
            item.mode
            ||
            "reps",

        reps:
            Number(
                item.reps
                ??
                DEFAULT_REPS
            ),

        seconds:
            Number(
                item.seconds
                ??
                DEFAULT_SECONDS
            ),

        sets:
            Number(
                item.sets
                ??
                DEFAULT_SETS
            ),

        restSeconds:
            Number(
                item.restSeconds
                ??
                DEFAULT_REST
            ),

        supervision:
            item.supervision !== false
    };

}


function migrateRoutine(routine) {

    return {
        ...routine,

        groups:
            (routine.groups || [])
                .map(
                    group => ({
                        ...group,

                        id:
                            group.id
                            ||
                            createId("group"),

                        exercises:
                            (group.exercises || [])
                                .map(
                                    migrateOldExercise
                                )
                    })
                )
    };

}


export function loadRoutines() {

    let routines =
        loadJSON(
            STORAGE.routines,
            null
        );


    if (
        routines === null
    ) {

        const old =
            loadJSON(
                STORAGE.oldRoutines,
                []
            );


        routines =
            old.map(
                migrateRoutine
            );


        saveJSON(
            STORAGE.routines,
            routines
        );

    }

    else {

        routines =
            routines.map(
                migrateRoutine
            );

    }


    return routines;

}


// ==========================================================
// SAVE
// ==========================================================

export function saveRoutines(routines) {

    saveJSON(
        STORAGE.routines,
        routines
    );

}


// ==========================================================
// CRIAÇÃO
// ==========================================================

export function createRoutine({
    name,
    duration = 8
}) {

    return {
        id:
            createId("routine"),

        name,

        duration,

        startDate:
            new Date().toISOString(),

        groups: []
    };

}


export function createGroup(
    name = "Novo grupo"
) {

    return {
        id:
            createId("group"),

        name,

        exercises: []
    };

}


export function createRoutineExercise(
    exerciseId
) {

    return {
        id:
            createId("routine-exercise"),

        exerciseId,

        mode:
            "reps",

        reps:
            DEFAULT_REPS,

        seconds:
            DEFAULT_SECONDS,

        sets:
            DEFAULT_SETS,

        restSeconds:
            DEFAULT_REST,

        supervision:
            true
    };

}


// ==========================================================
// ESTIMATIVA DE TEMPO
// ==========================================================

export function estimateExerciseSeconds(
    item
) {

    const sets =
        Math.max(
            1,
            item.sets || 1
        );


    let executionSeconds;


    if (
        item.mode === "time"
    ) {

        executionSeconds =
            Math.max(
                5,
                item.seconds || 30
            );

    }

    else {

        /*
            estimativa simples de 3 segundos por repetição
            apenas para exibir duração aproximada do treino
        */

        executionSeconds =
            Math.max(
                1,
                item.reps || 1
            )
            *
            3;

    }


    const restSeconds =
        Math.max(
            0,
            item.restSeconds || 0
        );


    return (
        executionSeconds *
        sets
    )
    +
    (
        restSeconds *
        Math.max(
            0,
            sets - 1
        )
    );

}


export function estimateGroupSeconds(
    group
) {

    return (
        group.exercises
            || []
    )
    .reduce(
        (
            total,
            exercise
        ) =>
            total
            +
            estimateExerciseSeconds(
                exercise
            ),
        0
    );

}


export function formatEstimatedTime(
    seconds
) {

    const minutes =
        Math.max(
            1,
            Math.round(
                seconds / 60
            )
        );


    return `≈ ${minutes} min`;

}


// ==========================================================
// TEXTO DA CONFIGURAÇÃO
// ==========================================================

export function formatRoutineExercise(
    item
) {

    const target =
        item.mode === "time"
        ?
        `${item.seconds}s`
        :
        `${item.reps} rep`;


    const bodyEngine =
        item.supervision
        ?
        "Body Engine ON"
        :
        "Body Engine OFF";


    return (
        `${item.sets} × ${target}`
        +
        ` · ${item.restSeconds}s descanso`
        +
        ` · ${bodyEngine}`
    );

}