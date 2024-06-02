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
                "blockIconURI": "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI4MC4zNzM4OCIgaGVpZ2h0PSI4MC4zNzM4OCIgdmlld0JveD0iMCwwLDgwLjM3Mzg4LDgwLjM3Mzg4Ij48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTk5LjgxMzA2LC0xMzkuODEzMDYpIj48ZyBkYXRhLXBhcGVyLWRhdGE9InsmcXVvdDtpc1BhaW50aW5nTGF5ZXImcXVvdDs6dHJ1ZX0iIGZpbGwtcnVsZT0ibm9uemVybyIgc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBzdHJva2UtZGFzaGFycmF5PSIiIHN0cm9rZS1kYXNob2Zmc2V0PSIwIiBzdHlsZT0ibWl4LWJsZW5kLW1vZGU6IG5vcm1hbCI+PHBhdGggZD0iTTIwOC4xNjk5OCwxODBjMCwtMTcuNTc5MjQgMTQuMjUwNzgsLTMxLjgzMDAyIDMxLjgzMDAyLC0zMS44MzAwMmMxNy41NzkyMywwIDMxLjgzMDAyLDE0LjI1MDc4IDMxLjgzMDAyLDMxLjgzMDAyYzAsMTcuNTc5MjQgLTE0LjI1MDc5LDMxLjgzMDAyIC0zMS44MzAwMiwzMS44MzAwMmMtMTcuNTc5MjQsMCAtMzEuODMwMDIsLTE0LjI1MDc4IC0zMS44MzAwMiwtMzEuODMwMDJ6IiBmaWxsPSIjYTNhM2EzIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iTmFOIiBzdHJva2UtbGluZWNhcD0iYnV0dCIvPjxwYXRoIGQ9Ik0yMTguNDkzMjMsMTgwYzAsLTExLjg3Nzg2IDkuNjI4OTEsLTIxLjUwNjc3IDIxLjUwNjc3LC0yMS41MDY3N2MxMS44Nzc4NiwwIDIxLjUwNjc3LDkuNjI4OTEgMjEuNTA2NzcsMjEuNTA2NzdjMCwxMS44Nzc4NiAtOS42Mjg5MSwyMS41MDY3NyAtMjEuNTA2NzcsMjEuNTA2NzdjLTExLjg3Nzg2LDAgLTIxLjUwNjc3LC05LjYyODkxIC0yMS41MDY3NywtMjEuNTA2Nzd6IiBmaWxsPSIjNzY3Njc2IiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiLz48cGF0aCBkPSJNMjI0LjAyMzU1LDE4MGMwLC04LjgyMzU1IDcuMTUyOSwtMTUuOTc2NDUgMTUuOTc2NDUsLTE1Ljk3NjQ1YzguODIzNTUsMCAxNS45NzY0NSw3LjE1MjkgMTUuOTc2NDUsMTUuOTc2NDVjMCw4LjgyMzU1IC03LjE1MjksMTUuOTc2NDYgLTE1Ljk3NjQ1LDE1Ljk3NjQ2Yy04LjgyMzU1LDAgLTE1Ljk3NjQ1LC03LjE1MjkxIC0xNS45NzY0NSwtMTUuOTc2NDZ6IiBmaWxsPSIjOGE4YThhIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiLz48cGF0aCBkPSJNMjMzLjYwOTQyLDE4MGMwLC0zLjUyOTQyIDIuODYxMTcsLTYuMzkwNTggNi4zOTA1OCwtNi4zOTA1OGMzLjUyOTQyLDAgNi4zOTA1OCwyLjg2MTE3IDYuMzkwNTgsNi4zOTA1OGMwLDMuNTI5NDIgLTIuODYxMTYsNi4zOTA1OCAtNi4zOTA1OCw2LjM5MDU4Yy0zLjUyOTQyLDAgLTYuMzkwNTgsLTIuODYxMTYgLTYuMzkwNTgsLTYuMzkwNTh6IiBmaWxsPSIjMDA5M2ZmIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiLz48cGF0aCBkPSJNMjMxLjIyNTc1LDE3Ny4yMTg4OHYtOC44NDg1aDE3LjIwNTQydjguODQ4NXoiIGZpbGw9IiM4YThhOGEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBzdHJva2UtbGluZWNhcD0iYnV0dCIvPjxwYXRoIGQ9Ik0yMjEuODg1NjcsMTU1LjM0MzQybC03LjQ5NjY1LC03LjQ5NjY1aDQ5LjAzNTQ0bC03LjE4OTQxLDcuMTg5NCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTI5MjkyIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTTI1Ny43OTM5NywyMDQuMDMyODlsNy4xODk0MSw3LjE4OTRoLTQ5LjAzNTQ0bDcuNDk2NjUsLTcuNDk2NjUiIGRhdGEtcGFwZXItZGF0YT0ieyZxdW90O2luZGV4JnF1b3Q7Om51bGx9IiBmaWxsPSJub25lIiBzdHJva2U9IiM5MjkyOTIiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNMTk5LjgxMzA2LDIyMC4xODY5NHYtODAuMzczODdoODAuMzczODh2ODAuMzczODh6IiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiLz48L2c+PC9nPjwvc3ZnPjwhLS1yb3RhdGlvbkNlbnRlcjo0MC4xODY5Mzc1OjQwLjE4NjkzNzUtLT4=",
                "id": "MORUTILS",
                "name": "Moron Utils",
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
        alert(args["ALERT"]);
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
        variables["RE"] = prompt(args["PROMP"]);
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

    Scratch.extensions.register(new Extension());
})(Scratch);