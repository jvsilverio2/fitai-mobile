// FitAI
// Session Engine 1.1
//
// Responsabilidade:
// organizar a sessão de treino.
//
// NÃO analisa biomecânica.
// NÃO detecta movimentos.
// NÃO decide se uma repetição foi correta.
//
// Recebe eventos dos Skills e controla:
//
// exercício
// série
// repetição
// tempo
// descanso
// pausa
// avanço
// conclusão


function now() {

    return performance.now();

}


function createId(
    prefix = "session"
) {

    return (
        `${prefix}-`
        +
        Date.now()
        +
        "-"
        +
        Math.random()
            .toString(16)
            .slice(2)
    );

}


function clamp(
    value,
    min,
    max
) {

    return Math.min(
        max,
        Math.max(
            min,
            value
        )
    );

}


export class SessionEngine {

    constructor(
        options = {}
    ) {

        this.config = {

            defaultRestDuration:
                options.defaultRestDuration
                ??
                60,

            autoAdvance:
                options.autoAdvance
                ??
                false

        };


        this.session =
            null;


        this.state =
            this.emptyState();


        this.lastUpdateAt =
            null;


        this.events =
            [];

    }


    emptyState() {

        return {

            active:
                false,

            sessionId:
                null,

            status:
                "idle",

            exercise:
                null,

            exerciseIndex:
                0,

            exerciseCount:
                0,

            set:
                0,

            setCount:
                0,

            reps:
                0,

            targetReps:
                0,

            elapsed:
                0,

            targetDuration:
                0,

            restRemaining:
                0,

            totalReps:
                0,

            completedSets:
                0,

            completedExercises:
                0,

            events:
                []

        };

    }


    createSession(
        data = {}
    ) {

        const exercises =
            Array.isArray(
                data.exercises
            )
                ?
                data.exercises.map(
                    (
                        exercise,
                        index
                    ) =>
                        this.normalizeExercise(
                            exercise,
                            index
                        )
                )
                :
                [];


        this.session = {

            id:
                data.id
                ??
                createId(),

            name:
                data.name
                ??
                "Treino FitAI",

            type:
                data.type
                ??
                "workout",

            createdAt:
                Date.now(),

            startedAt:
                null,

            endedAt:
                null,

            status:
                "ready",

            exercises,

            currentExerciseIndex:
                0,

            currentSetIndex:
                0,

            currentReps:
                0,

            currentElapsed:
                0,

            totalReps:
                0,

            completedSets:
                0,

            completedExercises:
                0,

            restDuration:
                0,

            restRemaining:
                0,

            pausedFromStatus:
                null

        };


        this.events =
            [];


        this.lastUpdateAt =
            null;


        this.updateState();


        return this.getSession();

    }


    normalizeExercise(
        exercise = {},
        index = 0
    ) {

        const mode =
            exercise.mode
            ===
            "time"
                ?
                "time"
                :
                "reps";


        return {

            id:
                exercise.id
                ??
                `exercise-${index + 1}`,

            name:
                exercise.name
                ??
                `Exercício ${index + 1}`,

            skillId:
                exercise.skillId
                ??
                null,

            mode,

            sets:
                Math.max(
                    1,
                    Number(
                        exercise.sets
                        ??
                        1
                    )
                ),

            targetReps:
                Math.max(
                    0,
                    Number(
                        exercise.targetReps
                        ??
                        0
                    )
                ),

            targetDuration:
                Math.max(
                    0,
                    Number(
                        exercise.targetDuration
                        ??
                        0
                    )
                ),

            restDuration:
                Math.max(
                    0,
                    Number(
                        exercise.restDuration
                        ??
                        this.config
                            .defaultRestDuration
                    )
                ),

            completedSets:
                0,

            completedReps:
                0,

            completed:
                false

        };

    }


    start(
        timestamp = now()
    ) {

        if (
            !this.session
            ||
            this.session.exercises.length
            ===
            0
        ) {

            return false;

        }


        this.session.status =
            "active";


        this.session.startedAt =
            Date.now();


        this.session.endedAt =
            null;


        this.session.currentExerciseIndex =
            0;


        this.session.currentSetIndex =
            0;


        this.session.currentReps =
            0;


        this.session.currentElapsed =
            0;


        this.session.restDuration =
            0;


        this.session.restRemaining =
            0;


        this.session.pausedFromStatus =
            null;


        this.lastUpdateAt =
            timestamp;


        this.emit(
            "session-start"
        );


        this.emit(
            "exercise-start"
        );


        this.updateState();


        return true;

    }


    update(
        context = {},
        timestamp = now()
    ) {

        if (
            !this.session
        ) {

            return this.updateState();

        }


        if (
            this.lastUpdateAt
            ===
            null
        ) {

            this.lastUpdateAt =
                timestamp;

        }


        const deltaSeconds =
            clamp(
                (
                    timestamp
                    -
                    this.lastUpdateAt
                )
                /
                1000,
                0,
                0.25
            );


        this.lastUpdateAt =
            timestamp;


        if (
            this.session.status
            ===
            "paused"
        ) {

            return this.updateState();

        }


        if (
            this.session.status
            ===
            "rest"
        ) {

            this.updateRest(
                deltaSeconds,
                timestamp
            );


            return this.updateState();

        }


        if (
            this.session.status
            !==
            "active"
        ) {

            return this.updateState();

        }


        this.updateActiveSession(
            context,
            timestamp,
            deltaSeconds
        );


        return this.updateState();

    }


    updateActiveSession(
        context = {},
        timestamp = now(),
        deltaSeconds = 0
    ) {

        const exercise =
            this.getCurrentExercise();


        if (
            !exercise
        ) {

            this.completeSession(
                timestamp
            );

            return;

        }


        if (
            exercise.mode
            ===
            "time"
        ) {

            this.session.currentElapsed +=
                deltaSeconds;


            if (
                exercise.targetDuration
                >
                0
                &&
                this.session.currentElapsed
                >=
                exercise.targetDuration
            ) {

                this.session.currentElapsed =
                    exercise.targetDuration;


                this.completeSet(
                    timestamp
                );

            }

        }

    }


    registerRep(
        amount = 1,
        timestamp = now()
    ) {

        if (
            !this.session
            ||
            this.session.status
            !==
            "active"
        ) {

            return false;

        }


        const exercise =
            this.getCurrentExercise();


        if (
            !exercise
            ||
            exercise.mode
            !==
            "reps"
        ) {

            return false;

        }


        const quantity =
            Math.max(
                0,
                Number(
                    amount
                )
                ||
                0
            );


        if (
            quantity
            <=
            0
        ) {

            return false;

        }


        this.session.currentReps +=
            quantity;


        this.session.totalReps +=
            quantity;


        exercise.completedReps +=
            quantity;


        this.emit(
            "rep-complete",
            {
                amount:
                    quantity,

                reps:
                    this.session
                        .currentReps,

                totalReps:
                    this.session
                        .totalReps
            }
        );


        if (
            exercise.targetReps
            >
            0
            &&
            this.session.currentReps
            >=
            exercise.targetReps
        ) {

            this.completeSet(
                timestamp
            );

        }


        this.updateState();


        return true;

    }


    completeSet(
        timestamp = now()
    ) {

        if (
            !this.session
        ) {

            return false;

        }


        const exercise =
            this.getCurrentExercise();


        if (
            !exercise
        ) {

            return false;

        }


        exercise.completedSets +=
            1;


        this.session.completedSets +=
            1;


        this.emit(
            "set-complete",
            {
                exerciseId:
                    exercise.id,

                set:
                    this.session
                        .currentSetIndex
                    +
                    1
            }
        );


        const hasMoreSets =
            this.session.currentSetIndex
            +
            1
            <
            exercise.sets;


        if (
            hasMoreSets
        ) {

            this.session.currentSetIndex +=
                1;


            this.session.currentReps =
                0;


            this.session.currentElapsed =
                0;


            if (
                exercise.restDuration
                >
                0
            ) {

                this.startRest(
                    exercise.restDuration,
                    timestamp
                );

            }
            else {

                this.session.status =
                    "active";


                this.emit(
                    "set-start",
                    {
                        set:
                            this.session
                                .currentSetIndex
                            +
                            1
                    }
                );

            }


            this.updateState();


            return true;

        }


        return this.completeExercise(
            timestamp
        );

    }


    completeExercise(
        timestamp = now()
    ) {

        if (
            !this.session
        ) {

            return false;

        }


        const exercise =
            this.getCurrentExercise();


        if (
            !exercise
        ) {

            return false;

        }


        exercise.completed =
            true;


        this.session.completedExercises +=
            1;


        this.emit(
            "exercise-complete",
            {
                exerciseId:
                    exercise.id,

                exerciseName:
                    exercise.name
            }
        );


        const completedRestDuration =
            exercise.restDuration;


        const hasNextExercise =
            this.session.currentExerciseIndex
            +
            1
            <
            this.session.exercises.length;


        if (
            !hasNextExercise
        ) {

            this.completeSession(
                timestamp
            );


            return true;

        }


        this.session.currentExerciseIndex +=
            1;


        this.session.currentSetIndex =
            0;


        this.session.currentReps =
            0;


        this.session.currentElapsed =
            0;


        if (
            completedRestDuration
            >
            0
        ) {

            this.startRest(
                completedRestDuration,
                timestamp
            );

        }
        else {

            this.session.status =
                "active";


            this.emit(
                "exercise-start",
                {
                    exerciseId:
                        this.getCurrentExercise()
                            ?.id
                        ??
                        null
                }
            );

        }


        this.updateState();


        return true;

    }


    startRest(
        duration = null,
        timestamp = now()
    ) {

        if (
            !this.session
        ) {

            return false;

        }


        const restDuration =
            Math.max(
                0,
                Number(
                    duration
                    ??
                    this.config
                        .defaultRestDuration
                )
                ||
                0
            );


        if (
            restDuration
            <=
            0
        ) {

            this.session.restDuration =
                0;


            this.session.restRemaining =
                0;


            this.session.status =
                "active";


            return true;

        }


        this.session.restDuration =
            restDuration;


        this.session.restRemaining =
            restDuration;


        this.session.status =
            "rest";


        this.lastUpdateAt =
            timestamp;


        this.emit(
            "rest-start",
            {
                duration:
                    restDuration
            }
        );


        this.updateState();


        return true;

    }


    updateRest(
        deltaSeconds = 0,
        timestamp = now()
    ) {

        if (
            !this.session
            ||
            this.session.status
            !==
            "rest"
        ) {

            return false;

        }


        this.session.restRemaining =
            Math.max(
                0,
                this.session
                    .restRemaining
                -
                deltaSeconds
            );


        if (
            this.session.restRemaining
            <=
            0
        ) {

            this.endRest(
                timestamp
            );

        }


        return true;

    }


    endRest(
        timestamp = now()
    ) {

        if (
            !this.session
        ) {

            return false;

        }


        this.session.restRemaining =
            0;


        this.session.restDuration =
            0;


        this.session.status =
            "active";


        this.lastUpdateAt =
            timestamp;


        this.emit(
            "rest-complete"
        );


        this.emit(
            "set-or-exercise-ready"
        );


        this.updateState();


        return true;

    }


    skipRest(
        timestamp = now()
    ) {

        if (
            !this.session
            ||
            this.session.status
            !==
            "rest"
        ) {

            return false;

        }


        this.emit(
            "rest-skip"
        );


        return this.endRest(
            timestamp
        );

    }


    skipSet(
        timestamp = now()
    ) {

        if (
            !this.session
            ||
            (
                this.session.status
                !==
                "active"
                &&
                this.session.status
                !==
                "rest"
            )
        ) {

            return false;

        }


        this.emit(
            "set-skip"
        );


        this.session.status =
            "active";


        this.session.restRemaining =
            0;


        this.session.restDuration =
            0;


        return this.completeSet(
            timestamp
        );

    }


    skipExercise(
        timestamp = now()
    ) {

        if (
            !this.session
            ||
            (
                this.session.status
                !==
                "active"
                &&
                this.session.status
                !==
                "rest"
            )
        ) {

            return false;

        }


        this.emit(
            "exercise-skip"
        );


        this.session.status =
            "active";


        this.session.restRemaining =
            0;


        this.session.restDuration =
            0;


        return this.completeExercise(
            timestamp
        );

    }


    pause() {

        if (
            !this.session
            ||
            (
                this.session.status
                !==
                "active"
                &&
                this.session.status
                !==
                "rest"
            )
        ) {

            return false;

        }


        this.session.pausedFromStatus =
            this.session.status;


        this.session.status =
            "paused";


        this.emit(
            "session-pause"
        );


        this.updateState();


        return true;

    }


    resume(
        timestamp = now()
    ) {

        if (
            !this.session
            ||
            this.session.status
            !==
            "paused"
        ) {

            return false;

        }


        this.session.status =
            this.session.pausedFromStatus
            ??
            "active";


        this.session.pausedFromStatus =
            null;


        this.lastUpdateAt =
            timestamp;


        this.emit(
            "session-resume"
        );


        this.updateState();


        return true;

    }


    completeSession(
        timestamp = now()
    ) {

        if (
            !this.session
        ) {

            return false;

        }


        this.session.status =
            "completed";


        this.session.endedAt =
            Date.now();


        this.session.restRemaining =
            0;


        this.session.restDuration =
            0;


        this.emit(
            "session-complete"
        );


        this.updateState();


        return true;

    }


    getCurrentExercise() {

        if (
            !this.session
        ) {

            return null;

        }


        return (
            this.session
                .exercises[
                    this.session
                        .currentExerciseIndex
                ]
            ??
            null
        );

    }


    getCurrentSet() {

        if (
            !this.session
        ) {

            return 0;

        }


        return (
            this.session.currentSetIndex
            +
            1
        );

    }


    getSession() {

        return this.session;

    }


    getState() {

        return this.state;

    }


    updateState() {

        if (
            !this.session
        ) {

            this.state =
                this.emptyState();


            return this.state;

        }


        const exercise =
            this.getCurrentExercise();


        this.state = {

            active:
                (
                    this.session.status
                    ===
                    "active"
                    ||
                    this.session.status
                    ===
                    "rest"
                    ||
                    this.session.status
                    ===
                    "paused"
                ),

            sessionId:
                this.session.id,

            status:
                this.session.status,

            exercise,

            exerciseIndex:
                this.session
                    .currentExerciseIndex,

            exerciseCount:
                this.session
                    .exercises
                    .length,

            set:
                exercise
                    ?
                    this.session
                        .currentSetIndex
                    +
                    1
                    :
                    0,

            setCount:
                exercise
                    ?.sets
                ??
                0,

            reps:
                this.session
                    .currentReps,

            targetReps:
                exercise
                    ?.targetReps
                ??
                0,

            elapsed:
                this.session
                    .currentElapsed,

            targetDuration:
                exercise
                    ?.targetDuration
                ??
                0,

            restRemaining:
                this.session
                    .restRemaining,

            totalReps:
                this.session
                    .totalReps,

            completedSets:
                this.session
                    .completedSets,

            completedExercises:
                this.session
                    .completedExercises,

            events:
                [
                    ...this.events
                ]

        };


        return this.state;

    }


    emit(
        type,
        data = {}
    ) {

        this.events.push({

            type,

            timestamp:
                now(),

            ...data

        });

    }


    clearEvents() {

        this.events =
            [];

    }

    consumeEvents() {

    const events =
        [
            ...this.events
        ];


    this.events =
        [];


    if (
        this.state
    ) {

        this.state.events =
            [];

    }


    return events;

}

    getEvents() {

        return [
            ...this.events
        ];

    }


    reset() {

        this.session =
            null;


        this.lastUpdateAt =
            null;


        this.events =
            [];


        this.state =
            this.emptyState();


        return this.state;

    }

}


export const fitaiSessionEngine =
    new SessionEngine();