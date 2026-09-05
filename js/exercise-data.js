// ==========================================================
// FITAI - EXERCISE DATA
// Ficha editorial + opções de guia por exercício
// ==========================================================

const EMPTY_PROFILE = {
    description: "",
    execution: "",
    observes: "",
    framing: "",
    slowGuide: false
};

const OFFICIAL_PROFILES = {
    agachamento: {
        description:
            "Fortalece principalmente quadríceps, glúteos e a musculatura estabilizadora do tronco. Inicie em pé, com os pés aproximadamente na largura dos ombros. Flexione quadris e joelhos de forma controlada e retorne à posição inicial.",
        execution:
            "Desça de forma controlada, mantenha os pés apoiados no chão e retorne completamente à posição em pé.",
        observes:
            "Joelho · Quadril · Inclinação do tronco",
        framing:
            "Posicione-se de forma que ombros, quadril, joelhos e pés apareçam na câmera.",
        slowGuide: true
    },

    // Os demais exercícios ficam deliberadamente vazios.
    // Vamos preenchê-los individualmente nas próximas etapas.
    pulo: { ...EMPTY_PROFILE },
    postura: { ...EMPTY_PROFILE },
    polichinelo: { ...EMPTY_PROFILE }
};

export function getExerciseProfile(exercise) {
    if (!exercise) {
        return { ...EMPTY_PROFILE };
    }

    if (exercise.motion === "recorded") {
        return {
            description: exercise.description ?? "",
            execution: exercise.execution ?? "",
            observes: exercise.observes ?? "",
            framing: exercise.framing ?? "",
            slowGuide: Boolean(exercise.slowGuide)
        };
    }

    return {
        ...EMPTY_PROFILE,
        ...(OFFICIAL_PROFILES[exercise.id] ?? {})
    };
}

export function emptyExerciseProfile() {
    return { ...EMPTY_PROFILE };
}
