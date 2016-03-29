(function () {

    "use strict";

    flock.init({
        bufferSize: 2048
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
            // sine: {
            //     type: "colin.toBeContinued.sineSynth"
            // },
            //
            mandolin: {
                type: "colin.whiteout.mandolin"
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

    colin.toBeContinued.midiConnection.transformControlMessage = function (msg, controlSpec) {
        var val = msg.value,
            transform = controlSpec.transform;

        if (!transform) {
            return val;
        }

        if (transform.mul) {
            val *= transform.mul;
        }

        if (transform.add) {
            val += transform.add;
        }

        return val;
    };

    colin.toBeContinued.midiConnection.applyControlMessage = function (msg, map, synthContext) {
        var controlSpec = map[msg.number];
        if (!controlSpec) {
            return;
        }

        var val = colin.toBeContinued.midiConnection.transformControlMessage(msg, controlSpec);
        var synth = fluid.get(synthContext, controlSpec.synth);
        if (!synth) {
            return;
        }

        synth.set(controlSpec.input, val);
    };


    colin.toBeContinued.midiConnection.applyNoteMessage = function (that, msg, synthContext) {
        var density = msg.velocity / 3,
            speed = (msg.note / 36) + 0.01;

        if (msg.note !== that.previousNote) {
            synthContext.mandolin.set("granulator.speed", speed);
        }
        synthContext.mandolin.set("trigger.density", density);
    };

    fluid.defaults("colin.toBeContinued.midiController", {
        gradeNames: "flock.midi.controller",

        components: {
            connection: {
                type: "colin.toBeContinued.midiConnection",
            }
        },

        controlMap: {
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
            2: {
                synth: "mandolin",
                input: "grainDur.mul",
                transform: {
                    mul: 0.03125
                }
            },

            // Grain duration add.
            3: {
                synth: "mandolin",
                input: "grainDur.add",
                transform: {
                    mul: 0.03125
                }
            },

            // Volume.
            6: {
                synth: "mandolin",
                input: "granulator.mul",
                transform: {
                    mul: 0.00787402
                }
            },

            // Panning.
            7: {
                synth: "mandolin",
                input: "panner.pan",
                transform: {
                    mul: 0.015625,
                    add: -1.0
                }
            },

            // Grain centre.
            10: {
                synth: "mandolin",
                input: "grainCentre.value",
                transform: {
                    mul: 0.00787402
                }
            }
        },

        noteMap: {

        }

    });

    fluid.defaults("colin.whiteout.mandolin", {
        gradeNames: "flock.synth",

        synthDef: {
            id: "panner",
            ugen: "flock.ugen.pan2",
            pan: 0,
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
                trigger: {
                    id: "trigger",
                    ugen: "flock.ugen.dust",
                    rate: "control",
                    density: 0
                    // density: {
                    //     id: "grainDensity",
                    //     ugen: "flock.ugen.sinOsc",
                    //     rate: "control",
                    //     freq: {
                    //         ugen: "flock.ugen.lfNoise",
                    //         rate: "control",
                    //         mul: 1/45,
                    //         add: 1/45
                    //     },
                    //     mul: 2,
                    //     add: 2,
                    //     options: {
                    //         interpolation: "linear"
                    //     }
                    // }
                },
                mul: 0.1,
                speed: 1.0
            }
        }
    });
}());
