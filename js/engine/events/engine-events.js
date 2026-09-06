// FitAI
// Engine Events 1.0
//
// Barramento central de eventos da Motion Platform.
//
// Responsabilidade:
// receber, armazenar e distribuir eventos
// produzidos pelos diferentes motores.
//
// Exemplos:
//
// body-detected
// body-lost
//
// movement-start
// movement-stop
//
// rep-start
// rep-complete
//
// set-complete
// rest-start
// rest-complete
//
// exercise-start
// exercise-complete
//
// coach-message
//
// session-complete


function now() {

    return performance.now();

}


function createEventId() {

    return (
        "event-"
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


export class EngineEvents {

    constructor(
        options = {}
    ) {

        this.config = {

            historyLimit:
                options.historyLimit
                ??
                200

        };


        this.listeners =
            new Map();


        this.frameEvents =
            [];


        this.history =
            [];

    }


    emit(
        type,
        data = {},
        source = "platform",
        timestamp = now()
    ) {

        if (
            !type
            ||
            typeof type
            !==
            "string"
        ) {

            return null;

        }


        const event = {

            id:
                createEventId(),

            type,

            source,

            timestamp,

            data:
                data
                ??
                {}

        };


        this.frameEvents.push(
            event
        );


        this.history.push(
            event
        );


        this.trimHistory();


        this.dispatch(
            event
        );


        return event;

    }


    dispatch(
        event
    ) {

        const directListeners =
            this.listeners.get(
                event.type
            );


        if (
            directListeners
        ) {

            for (
                const listener
                of directListeners
            ) {

                try {

                    listener(
                        event
                    );

                }
                catch (
                    error
                ) {

                    console.error(
                        "FitAI Engine Event listener error:",
                        error
                    );

                }

            }

        }


        const globalListeners =
            this.listeners.get(
                "*"
            );


        if (
            globalListeners
        ) {

            for (
                const listener
                of globalListeners
            ) {

                try {

                    listener(
                        event
                    );

                }
                catch (
                    error
                ) {

                    console.error(
                        "FitAI Engine Event global listener error:",
                        error
                    );

                }

            }

        }

    }


    on(
        type,
        listener
    ) {

        if (
            !type
            ||
            typeof listener
            !==
            "function"
        ) {

            return () => {};

        }


        if (
            !this.listeners.has(
                type
            )
        ) {

            this.listeners.set(
                type,
                new Set()
            );

        }


        const listeners =
            this.listeners.get(
                type
            );


        listeners.add(
            listener
        );


        return () => {

            this.off(
                type,
                listener
            );

        };

    }


    once(
        type,
        listener
    ) {

        if (
            typeof listener
            !==
            "function"
        ) {

            return () => {};

        }


        const wrapper =
            (
                event
            ) => {

                this.off(
                    type,
                    wrapper
                );


                listener(
                    event
                );

            };


        return this.on(
            type,
            wrapper
        );

    }


    off(
        type,
        listener
    ) {

        const listeners =
            this.listeners.get(
                type
            );


        if (
            !listeners
        ) {

            return false;

        }


        listeners.delete(
            listener
        );


        if (
            listeners.size
            ===
            0
        ) {

            this.listeners.delete(
                type
            );

        }


        return true;

    }


    beginFrame() {

        this.frameEvents =
            [];

    }


    getFrameEvents() {

        return [
            ...this.frameEvents
        ];

    }


    getHistory() {

        return [
            ...this.history
        ];

    }


    getEventsByType(
        type
    ) {

        return this.history.filter(
            (
                event
            ) =>
                event.type
                ===
                type
        );

    }


    getEventsBySource(
        source
    ) {

        return this.history.filter(
            (
                event
            ) =>
                event.source
                ===
                source
        );

    }


    getLatest(
        type = null
    ) {

        if (
            this.history.length
            ===
            0
        ) {

            return null;

        }


        if (
            !type
        ) {

            return (
                this.history[
                    this.history.length
                    -
                    1
                ]
                ??
                null
            );

        }


        for (
            let index =
                this.history.length
                -
                1;

            index
            >=
            0;

            index--
        ) {

            const event =
                this.history[
                    index
                ];


            if (
                event.type
                ===
                type
            ) {

                return event;

            }

        }


        return null;

    }


    hasEvent(
        type
    ) {

        return this.frameEvents.some(
            (
                event
            ) =>
                event.type
                ===
                type
        );

    }


    trimHistory() {

        const overflow =
            this.history.length
            -
            this.config
                .historyLimit;


        if (
            overflow
            >
            0
        ) {

            this.history.splice(
                0,
                overflow
            );

        }

    }


    clearFrame() {

        this.frameEvents =
            [];

    }


    clearHistory() {

        this.history =
            [];

    }


    clearListeners() {

        this.listeners.clear();

    }


    reset() {

        this.frameEvents =
            [];


        this.history =
            [];

    }

}


export const fitaiEngineEvents =
    new EngineEvents();