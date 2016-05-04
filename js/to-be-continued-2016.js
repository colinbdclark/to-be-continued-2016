(function () {

    "use strict";

    flock.init({
        bufferSize: 512
    });

    fluid.defaults("colin.toBeContinued", {
        gradeNames: "fluid.viewComponent",

        components: {
            midiController: {
                type: "colin.toBeContinued.midiController",
                options: {
                    components: {
                        synthContext: "{toBeContinued}.band",
                        connection: {
                            options: {
                                components: {
                                    synthContext: "{toBeContinued}.band"
                                }
                            }
                        }
                    }
                }
            },

            band: {
                type: "colin.toBeContinued.band"
            }
        },

        listeners: {
            onCreate: "flock.environment.play()"
        },

        selectors: {
            midi: "#midi-selector-container"
        }
    });


    fluid.defaults("colin.toBeContinued.band", {
        gradeNames: "flock.band",

        components: {
            mandolin: {
                type: "colin.whiteout.mandolin"
            },

            lowGuitar: {
                type: "colin.whiteout.lowGuitar"
            }
        }
    });

    fluid.defaults("colin.toBeContinued.midiConnection", {
        gradeNames: "flock.midi.connection",

        members: {
            previousNote: null
        },

        ports: {
            name: "QUNEO"
        },

        openImmediately: true,

        listeners: {
            note: [
                {
                    funcName: "colin.toBeContinued.midiConnection.applyNoteMessage",
                    args: ["{that}", "{arguments}.0", "{that}.synthContext"]
                }
            ]
        }
    });

    colin.toBeContinued.midiConnection.applyNoteMessage = function (that, msg, synthContext) {
        var density = msg.velocity / 50,
            speed = (msg.note / 72) + 0.01;

        if (msg.note !== that.previousNote) {
            synthContext.mandolin.set("granulator.speed", speed);
        }
        // synthContext.mandolin.set("trigger.density", density);
        synthContext.mandolin.set("granulator.trigger", msg.velocity);
    };


    fluid.defaults("colin.toBeContinued.midiController", {
        gradeNames: "flock.midi.controller",

        components: {
            connection: {
                type: "colin.toBeContinued.midiConnection",
            }
        },

        controlMap: {

            /************
             * Mandolin *
             ************/

            // Grain speed
            0: {
                synth: "mandolin",
                input: "granulator.speed",
                transform: {
                    mul: 0.00787402,
                    add: 0.5
                }
            },

            // Grain duration freq.
            1: {
                synth: "mandolin",
                input: "grainDur.freq",
                transform: {
                    mul: 0.03125
                }
            },

            // Grain duration scale.
            2: [
                {
                    synth: "mandolin",
                    input: "grainDur.mul",
                    transform: {
                        mul: 0.03125
                    }
                },
                {
                    synth: "mandolin",
                    input: "grainDur.add",
                    transform: {
                        mul: 0.03125
                    }
                }
            ],

            // Volume.
            3: {
                synth: "mandolin",
                input: "granulator.mul",
                valuePath: "source",
                transform: {
                    ugen: "flock.ugen.math",
                    div: 64
                }
            },

            // Output volume.
            4: {
                synth: "mandolin",
                input: "flocking-out.mul",
                valuePath: "source",
                transform: {
                    ugen: "flock.ugen.math",
                    div: 127
                }
            },

            // Grain centre.
            10: {
                synth: "mandolin",
                input: "grainCentre.value",
                transform: {
                    mul: 0.1574804
                }
            },

            /**********
             * Guitar *
             **********/

            // Rotary pad - volume
            5: {
                synth: "lowGuitar",
                input: "flocking-out.mul",
                valuePath: "source",
                transform: {
                    ugen: "flock.ugen.math",
                    div: 32
                }
            },

            6: {
                synth: "lowGuitar",
                input: "granulator.speed",
                valuePath: "source.source",
                transform: {
                    ugen: "flock.ugen.passThrough",
                    source: {
                        ugen: "flock.ugen.math",
                        div: 64
                    },
                    add: 0.5
                }
            },

            // Grain duration.
            7: {
                synth: "lowGuitar",
                input: "granulator.dur",
                valuePath: "source",
                transform: {
                    ugen: "flock.ugen.math",
                    div: 32
                }
            },

            // Guitar density.
            8: {
                synth: "lowGuitar",
                input: "trigger.freq",
                transform: {
                    mul: 0.0787402
                }
            },

            9: {
                synth: "lowGuitar",
                input: "grainCentre.freq"
            }
        }
    });

    fluid.defaults("colin.whiteout.mandolin", {
        gradeNames: "flock.synth",

        synthDef: {
            id: "panner",
            ugen: "flock.ugen.pan2",
            pan: {
                ugen: "flock.ugen.triOsc",
                rate: "audio",
                freq: 1/20,
                mul: 0.75,
                options: {
                    interpolate: "linear"
                }
            },
            source: {
                id: "granulator",
                ugen: "flock.ugen.triggerGrains",
                options: {
                    interpolation: "linear"
                },
                buffer: {
                    id: "mandolin",
                    url: "audio/mandolin.wav"
                },
                dur: {
                    id: "grainDur",
                    ugen: "flock.ugen.lfNoise",
                    rate: "control",
                    freq: 1/10,
                    mul: 1 * 1.08843537414966,
                    add: 1.075 * 1.08843537414966
                },
                centerPos: {
                    id: "grainCentre",
                    ugen: "flock.ugen.value",
                    rate: "control",
                    value: 0.0,
                    mul: {
                        ugen: "flock.ugen.math",
                        rate: "constant",
                        source: {
                            ugen: "flock.ugen.bufferLength",
                            buffer: "mandolin",
                        },
                        div: 2
                    },
                    add: {
                        ugen: "flock.ugen.math",
                        rate: "constant",
                        source: {
                            ugen: "flock.ugen.bufferLength",
                            buffer: "mandolin"
                        },
                        div: 2
                    },
                    options: {
                        interpolation: "linear"
                    }
                },
                trigger: 0,
                mul: 0.1,
                speed: 1.0
            }
        }
    });

    fluid.defaults("colin.whiteout.lowGuitar", {
        gradeNames: "flock.synth",

        synthDef: {
            ugen: "flock.ugen.pan2",
            pan: {
                ugen: "flock.ugen.triOsc",
                rate: "audio",
                freq: 1/15,
                options: {
                    interpolate: "linear"
                }
            },
            source: {
                id: "granulator",
                ugen: "flock.ugen.triggerGrains",
                dur: 1 * 1.08843537414966,
                centerPos: {
                    id: "grainCentre",
                    ugen: "flock.ugen.lfNoise",
                    rate: "control",
                    freq: 1/2,
                    options: {
                        interpolation: "linear"
                    },
                    mul: {
                        ugen: "flock.ugen.line",
                        rate: "control",
                        start: 50 * 1.08843537414966,
                        end: 800 * 1.08843537414966,
                        duration: 60
                    }
                },
                buffer: {
                    id: "low-guitar",
                    url: "audio/low-bowed-guitar.wav"
                },
                trigger: {
                    id: "trigger",
                    ugen: "flock.ugen.impulse",
                    rate: "control",
                    freq: 0
                },
                mul: {
                    ugen: "flock.ugen.triOsc",
                    rate: "control",
                    freq: 1/5,
                    mul: 0.025,
                    add: 0.03,
                    options: {
                        interpolation: "linear"
                    }
                }
            }
        }
    });
}());
