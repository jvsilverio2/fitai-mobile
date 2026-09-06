// ==========================================================
// FITAI MOTION PLATFORM
// FEEDBACK ENGINE 1.1
//
// Responsabilidade:
// decidir COMO uma orientação será entregue.
//
// Canais:
// - texto
// - voz
// - vibração
//
// O Coach Engine decide O QUE comunicar.
// O Feedback Engine decide COMO comunicar.
// ==========================================================


// ==========================================================
// HELPERS
// ==========================================================

function now() {

    return performance.now();

}


function clamp(
    value,
    min = 0,
    max = 1
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}


// ==========================================================
// FEEDBACK ENGINE
// ==========================================================

export class FeedbackEngine {

    constructor(
        options = {}
    ) {

        this.channels = {

            text:
                options.text
                ??
                true,

            voice:
                options.voice
                ??
                true,

            vibration:
                options.vibration
                ??
                false

        };


        this.options = {

            voiceCooldown:
                options.voiceCooldown
                ??
                1800,

            vibrationCooldown:
                options.vibrationCooldown
                ??
                800,

            minimumPriorityForVoice:
                options.minimumPriorityForVoice
                ??
                35,

            minimumPriorityForVibration:
                options.minimumPriorityForVibration
                ??
                55,

            voiceLanguage:
                options.voiceLanguage
                ??
                "pt-BR",

            voiceRate:
                options.voiceRate
                ??
                1.05,

            voicePitch:
                options.voicePitch
                ??
                1,

            voiceVolume:
                options.voiceVolume
                ??
                1

        };


        this.lastVoiceAt =
            0;


        this.lastVibrationAt =
            0;


        this.lastSpokenCode =
            null;


        this.state =
            this.emptyState();

    }


    // ======================================================
    // UPDATE
    // ======================================================

    update(
        coachState = null,
        timestamp = now()
    ) {

        if (
            !coachState
            ||
            !coachState.active
            ||
            !coachState.message
        ) {

            this.state = {

                ...this.emptyState(),

                timestamp,

                channels: {
                    ...this.channels
                }

            };


            return this.state;

        }


        const priority =
            clamp(
                Number(
                    coachState.priority
                    ??
                    0
                ),
                0,
                100
            );


        const text =
            this.channels.text
                ?
                {
                    active: true,

                    message:
                        coachState.message,

                    code:
                        coachState.code
                }
                :
                {
                    active: false,

                    message: null,

                    code:
                        coachState.code
                };


        const voiceAllowed =
            this.channels.voice
            &&
            priority
            >=
            this.options.minimumPriorityForVoice
            &&
            (
                timestamp
                -
                this.lastVoiceAt
            )
            >=
            this.options.voiceCooldown;


        const voice = {

            active:
                voiceAllowed,

            message:
                voiceAllowed
                    ?
                    coachState.message
                    :
                    null,

            code:
                coachState.code

        };


        if (
            voiceAllowed
        ) {

            this.lastVoiceAt =
                timestamp;


            this.speak(
                coachState.message,
                coachState.code
            );

        }


        const vibrationAllowed =
            this.channels.vibration
            &&
            priority
            >=
            this.options.minimumPriorityForVibration
            &&
            (
                timestamp
                -
                this.lastVibrationAt
            )
            >=
            this.options.vibrationCooldown;


        const vibration = {

            active:
                vibrationAllowed,

            pattern:
                vibrationAllowed
                    ?
                    this.getVibrationPattern(
                        coachState
                    )
                    :
                    null,

            code:
                coachState.code

        };


        if (
            vibrationAllowed
        ) {

            this.lastVibrationAt =
                timestamp;


            this.vibrate(
                vibration.pattern
            );

        }


        this.state = {

            timestamp,

            active:
                text.active
                ||
                voice.active
                ||
                vibration.active,

            source:
                coachState.source
                ??
                null,

            type:
                coachState.type
                ??
                "guidance",

            priority,

            code:
                coachState.code
                ??
                null,

            message:
                coachState.message,

            channels: {
                ...this.channels
            },

            text,

            voice,

            vibration

        };


        return this.state;

    }


    // ======================================================
    // VOZ
    // ======================================================

    speak(
        message,
        code = null
    ) {

        if (
            !this.channels.voice
            ||
            !message
            ||
            typeof window
            ===
            "undefined"
            ||
            !("speechSynthesis" in window)
        ) {

            return false;

        }


        if (
            code
            &&
            code === this.lastSpokenCode
            &&
            window.speechSynthesis.speaking
        ) {

            return false;

        }


        const utterance =
            new SpeechSynthesisUtterance(
                message
            );


        utterance.lang =
            this.options.voiceLanguage;


        utterance.rate =
            this.options.voiceRate;


        utterance.pitch =
            this.options.voicePitch;


        utterance.volume =
            this.options.voiceVolume;


        this.lastSpokenCode =
            code;


        window.speechSynthesis.speak(
            utterance
        );


        return true;

    }


    stopVoice() {

        if (
            typeof window
            !==
            "undefined"
            &&
            "speechSynthesis" in window
        ) {

            window.speechSynthesis.cancel();

        }

    }


    // ======================================================
    // VIBRAÇÃO
    // ======================================================

    vibrate(
        pattern
    ) {

        if (
            !this.channels.vibration
            ||
            typeof navigator
            ===
            "undefined"
            ||
            !navigator.vibrate
        ) {

            return false;

        }


        navigator.vibrate(
            pattern
        );


        return true;

    }


    getVibrationPattern(
        coachState
    ) {

        const priority =
            Number(
                coachState.priority
                ??
                0
            );


        if (
            priority
            >=
            85
        ) {

            return [
                120,
                60,
                120
            ];

        }


        if (
            priority
            >=
            60
        ) {

            return [
                100
            ];

        }


        return [
            60
        ];

    }


    // ======================================================
    // CANAIS
    // ======================================================

    setTextEnabled(
        enabled
    ) {

        this.channels.text =
            Boolean(
                enabled
            );


        return this.channels.text;

    }


    setVoiceEnabled(
        enabled
    ) {

        this.channels.voice =
            Boolean(
                enabled
            );


        if (
            !this.channels.voice
        ) {

            this.stopVoice();

        }


        return this.channels.voice;

    }


    setVibrationEnabled(
        enabled
    ) {

        this.channels.vibration =
            Boolean(
                enabled
            );


        return this.channels.vibration;

    }


    toggleText() {

        return this.setTextEnabled(
            !this.channels.text
        );

    }


    toggleVoice() {

        return this.setVoiceEnabled(
            !this.channels.voice
        );

    }


    toggleVibration() {

        return this.setVibrationEnabled(
            !this.channels.vibration
        );

    }


    getChannels() {

        return {
            ...this.channels
        };

    }


    // ======================================================
    // STATE
    // ======================================================

    getState() {

        return this.state;

    }


    emptyState() {

        return {

            timestamp: 0,

            active: false,

            source: null,

            type:
                "silence",

            priority: 0,

            code: null,

            message: null,

            channels: {
                ...this.channels
            },

            text: {

                active: false,

                message: null,

                code: null

            },

            voice: {

                active: false,

                message: null,

                code: null

            },

            vibration: {

                active: false,

                pattern: null,

                code: null

            }

        };

    }


    // ======================================================
    // RESET
    // ======================================================

    reset() {

        this.stopVoice();


        this.lastVoiceAt =
            0;


        this.lastVibrationAt =
            0;


        this.lastSpokenCode =
            null;


        this.state =
            this.emptyState();

    }

}