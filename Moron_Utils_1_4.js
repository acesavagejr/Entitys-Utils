/*
   This extension was made with TurboBuilder!
   https://turbobuilder-steel.vercel.app/
*/
(async function(Scratch) {
    const variables = {};
    const blocks = [];
    const menus = {};


    if (!Scratch.extensions.unsandboxed) {
        alert("This extension needs to be unsandboxed to run!")
        return
    }

    function doSound(ab, cd, runtime) {
        const audioEngine = runtime.audioEngine;

        const fetchAsArrayBufferWithTimeout = (url) =>
            new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                let timeout = setTimeout(() => {
                    xhr.abort();
                    reject(new Error("Timed out"));
                }, 5000);
                xhr.onload = () => {
                    clearTimeout(timeout);
                    if (xhr.status === 200) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`HTTP error ${xhr.status} while fetching ${url}`));
                    }
                };
                xhr.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error(`Failed to request ${url}`));
                };
                xhr.responseType = "arraybuffer";
                xhr.open("GET", url);
                xhr.send();
            });

        const soundPlayerCache = new Map();

        const decodeSoundPlayer = async (url) => {
            const cached = soundPlayerCache.get(url);
            if (cached) {
                if (cached.sound) {
                    return cached.sound;
                }
                throw cached.error;
            }

            try {
                const arrayBuffer = await fetchAsArrayBufferWithTimeout(url);
                const soundPlayer = await audioEngine.decodeSoundPlayer({
                    data: {
                        buffer: arrayBuffer,
                    },
                });
                soundPlayerCache.set(url, {
                    sound: soundPlayer,
                    error: null,
                });
                return soundPlayer;
            } catch (e) {
                soundPlayerCache.set(url, {
                    sound: null,
                    error: e,
                });
                throw e;
            }
        };

        const playWithAudioEngine = async (url, target) => {
            const soundBank = target.sprite.soundBank;

            let soundPlayer;
            try {
                const originalSoundPlayer = await decodeSoundPlayer(url);
                soundPlayer = originalSoundPlayer.take();
            } catch (e) {
                console.warn(
                    "Could not fetch audio; falling back to primitive approach",
                    e
                );
                return false;
            }

            soundBank.addSoundPlayer(soundPlayer);
            await soundBank.playSound(target, soundPlayer.id);

            delete soundBank.soundPlayers[soundPlayer.id];
            soundBank.playerTargets.delete(soundPlayer.id);
            soundBank.soundEffects.delete(soundPlayer.id);

            return true;
        };

        const playWithAudioElement = (url, target) =>
            new Promise((resolve, reject) => {
                const mediaElement = new Audio(url);

                mediaElement.volume = target.volume / 100;

                mediaElement.onended = () => {
                    resolve();
                };
                mediaElement
                    .play()
                    .then(() => {
                        // Wait for onended
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });

        const playSound = async (url, target) => {
            try {
                if (!(await Scratch.canFetch(url))) {
                    throw new Error(`Permission to fetch ${url} denied`);
                }

                const success = await playWithAudioEngine(url, target);
                if (!success) {
                    return await playWithAudioElement(url, target);
                }
            } catch (e) {
                console.warn(`All attempts to play ${url} failed`, e);
            }
        };

        playSound(ab, cd)
    }
    class Extension {
        getInfo() {
            return {
                "blockIconURI": "data:image/png;base64,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",
                "id": "MORUTILS",
                "name": "Moron Utils 1.4",
                "color1": "#666666",
                "color2": "#0062ff",
                "tbShow": true,
                "blocks": blocks,
                "menus": menus
            }
        }
    }
    blocks.push({
        opcode: "ALERT",
        blockType: Scratch.BlockType.COMMAND,
        text: "Alert [ALERT]",
        arguments: {
            "ALERT": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'IM NOT A MORNON!',
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["ALERT"] = async (args, util) => {
        if (Boolean(!(args["ALERT"] == 0))) {
            alert(args["ALERT"]);

        } else {
            alert("Null");
            console.error('Empty input!');

        };
    };

    blocks.push({
        opcode: "PROMPT",
        blockType: Scratch.BlockType.COMMAND,
        text: "Prompt [PROMP]",
        arguments: {
            "PROMP": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'is your name GLaDOS?',
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["PROMPT"] = async (args, util) => {
        if (Boolean(!(args["PROMP"] == 0))) {
            variables["RE"] = prompt(args["PROMP"]);

        } else {
            variables["RE"] = prompt("Null");
            console.error('Empty input!');

        };
    };

    blocks.push({
        opcode: "RESPONCE",
        blockType: Scratch.BlockType.REPORTER,
        text: "Response",
        arguments: {},
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["RESPONCE"] = async (args, util) => {
        return variables['RE']
    };

    menus["REDER"] = {
        acceptReporters: false,
        items: [...[...[], 'Rederect'], 'New tab']
    }

    blocks.push({
        opcode: "REDER",
        blockType: Scratch.BlockType.COMMAND,
        text: "[REDER] [INPUT]",
        arguments: {
            "INPUT": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://www.thinkwithportals.com',
            },
            "REDER": {
                type: Scratch.ArgumentType.STRING,
                menu: 'REDER'
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["REDER"] = async (args, util) => {
        if (Boolean((args["REDER"] == 'New tab'))) {
            window.open(args["INPUT"], "_blank");;
        };
        if (Boolean((args["REDER"] == 'Rederect'))) {
            location.replace(args["INPUT"]);
        };
    };

    blocks.push({
        opcode: "RTB",
        blockType: Scratch.BlockType.REPORTER,
        text: "[BOOT]",
        arguments: {
            "BOOT": {
                type: Scratch.ArgumentType.BOOLEAN,
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["RTB"] = async (args, util) => {
        return args["BOOT"]
    };

    blocks.push({
        opcode: "BTR",
        blockType: Scratch.BlockType.BOOLEAN,
        text: "[REE]",
        arguments: {
            "REE": {
                type: Scratch.ArgumentType.empty,
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["BTR"] = async (args, util) => {
        return args["REE"]
    };

    blocks.push({
        opcode: "STORE",
        blockType: Scratch.BlockType.COMMAND,
        text: "Store [IN] To [LOCAL]",
        arguments: {
            "IN": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Lemons',
            },
            "LOCAL": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Cave Johnson',
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["STORE"] = async (args, util) => {
        localStorage.setItem(args["LOCAL"], args["IN"])
    };

    blocks.push({
        opcode: "GETLOC",
        blockType: Scratch.BlockType.REPORTER,
        text: "Get [LOC]",
        arguments: {
            "LOC": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Cave Johnson',
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["GETLOC"] = async (args, util) => {
        return localStorage.getItem(args["LOC"])
    };

    blocks.push({
        opcode: "DELLOC",
        blockType: Scratch.BlockType.COMMAND,
        text: "Delete Local [LOCA]",
        arguments: {
            "LOCA": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Cave Johnson',
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["DELLOC"] = async (args, util) => {
        localStorage.removeItem(args["LOCA"]);
    };

    blocks.push({
        opcode: "SOUNDPLAY!",
        blockType: Scratch.BlockType.COMMAND,
        text: "Play sound link [LINK]",
        arguments: {
            "LINK": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://acesavagejr.github.io/Entitys-site/i-am-not-a-moron.mp3',
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["SOUNDPLAY!"] = async (args, util) => {
        let mySound = new Audio(args["LINK"]);
        mySound.play();
    };

    blocks.push({
        opcode: "LOGCON",
        blockType: Scratch.BlockType.COMMAND,
        text: "Log [LOG]",
        arguments: {
            "LOG": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'I\'m just a potato',
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["LOGCON"] = async (args, util) => {
        console.log(args["LOG"]);
    };

    blocks.push({
        opcode: "ERRORLOG",
        blockType: Scratch.BlockType.COMMAND,
        text: "Error [LOG]",
        arguments: {
            "LOG": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'STILL ALIVE',
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["ERRORLOG"] = async (args, util) => {
        console.error(args["LOG"]);
    };

    blocks.push({
        opcode: "WARNLOG",
        blockType: Scratch.BlockType.COMMAND,
        text: "Warn [LOG]",
        arguments: {
            "LOG": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Placeholder',
            },
        },
        disableMonitor: true,
        isEdgeActivated: false
    });
    Extension.prototype["WARNLOG"] = async (args, util) => {
        console.warn(args["LOG"]);
    };

    Scratch.extensions.register(new Extension());
})(Scratch);