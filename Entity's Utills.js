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
                "blockIconURI": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQ8AAAEqCAYAAAALTtW7AAAAAXNSR0IArs4c6QAAHhdJREFUeF7tnQnUVtMax/8hQkRRqZQKRcqQeR7LWIrMYyLzkFnmebiIzHMlhAyZaTBeDchQXBENlCHjxUXorsfx8g3v+53nzHv477XuvWvd79n77P179v513nP2OacelGX+AixQhsYOq18P9WJXZsXEBPLIceJOsoHMCWjXYcXFasJE0g4ic5qOHsCEHDuK1plh1bUGy8rDtElFiaQ/F03LcfojZItpEii3BqvJw+QJRYGkMxVMznE6I2QrWRGouQatkYcAoUCSTQuKIxk/1q6+Bv+Why0TiwKJN4VtyW+80bFWngRKa/BPedg2sSiQaFPFtvxGGx2j8yZgtTz4E0Y/XSgOPStG6gmIQKw88ygNkWcgdSeb4tAvBkZGI2C9PHgGUjnhFEe0xcDoaAT+lIcLk4xnINUT70JOo01lRudNwBl58Azkn6lDceS9jPw9nhNnHrwGEhCgOPxdyEWM3Cl5+HwGQnEUsXz8PqZz8vBRIBSH34u4qNE7KQ+fBEJxFLV0eFxn5eGDQCgOLuAiCTgtD5cFQnEUuWx4bCHgvDxcFAjFwcVrAgEv5OGSQCgOE5YN++DNmUfVVNu6G5XS4II1jYA3Zx41wdsiEUrDtCXD/pQIeCsPTgESIIFkBCiPZPxYmwS8JUB5eJt6DpwEkhGgPJLxY20S8JYA5eFt6jlwEkhGgPJIxo+1ScBbApSHt6nnwEkgGQHKIxk/1iYBbwlQHt6mngMngWQEKI9k/FibBLwlQHl4m3oOnASSEaA8kvFjbRLwlgDl4W3qOXASSEaA8kjGj7VJwFsClIe3qefASSAZAcojGT/WJgFvCVAe3qaeAyeBZAQoj2T8WJsEvCVAeXibeg6cBJIRoDyS8WNtEvCWAOXhbeo5cBJIRoDySMaPtUnAWwKUh7ep58BJIBkByiMZP9YmAW8JUB7epp4DJ4FkBCiPZPxYmwS8JUB5eJt6DpwEkhGgPJLxY20S8JYA5eFt6jlwEkhGgPJIxo+1FQS6rgW8/ZYi8K+QK68Gjj1eH8/IYghQHsVw9+qolIeb6bZCHmefCVxykVkJmD0XaN7crD4l7c3A04HLL627lR13Ah59PNqR8pBHVn2PNlK/oimPmPl2UR7rdwUmv2GnPLLqe8zp4UU1yiNmml2Tx7x5QIumwIIF9skjy77HnB5eVKM8YqbZNXmMuA/Yb+9wGCb+bMmy7+FE/I2gPGLm3jV59OsLDLkzHIaJ8siy7+FE/I2gPGLm3jV5tF0R+OSTcBgmyiPLvocT8TeC8oiZe5fk8Z/3gM6r60DEkcdbbwI//KBrX6LatgNatNDFZ913XS/8jKI8YubdJXkMvgYYoNyUFUceMRGrqtncd9UADQ6iPGImxyV59NwZePIJHQjT5GFz33XEzY2iPGLmppI8fv8deG1SeKP16gHrb1A5buYM4LFRwITxwNSpwNdfAT/+CCyxBLB8U2C11YDNtwB26anfrDZ/PjBxQvVjyq3ZXXbU/6zYaGPgksvK93uFFYB27Wv/bco7Qd+1pc1KtcdUVN+1ffYxzml5vPt+sNCyKI0aASKAmuXbb4Hll9Udcc4XwPLLV499+SXggvOAcWPD91xIzUUXBQ44CLjoEqBx47qP+9lnwIor6PoWJ+rQ/sANN9WumcYO07z6/vhjQK8e0UbfZU3g9Tf1debMAdq01MfL9Z+PZwMLLaSvk0ek0/Io4qdFFHmMeT44e5Ai/zIfcyQwbGi8tMsEG/UEsOZalevntQBr9sAmeciZ4yptgdmzo+VBFnerVro6Q4cAhxyki5Wok06pfLanbyX9SMojZaZR5HHdDUD/IwBZ1PLb/Y3Xk3VmmWWA8ZOA9iuXb4fyqMy36lmTnPmdf260XNx4M9DvMF2dg/YHht+ti5Wot6YAq3fSx+cVSXmkTDqKPI48Grj4UmDzTaI9sl5Xl7uuC7w6sfxPKspDJw/Z77LySoCchWjLLj2Ahx7VRbduAcydq4uVfMo/CCYWyiPlrESRh/zEaN06uDCaZhl2D7BXma3mlIdOHhIl1z3k+oe2LLkk8PlXwGKL1V1j6hRgrc7aVoFB1wJHHaOPzzOS8kiZdhR5pHzov5vbdDNg3Iu1W6c89PKQW9fyUzJKeeJpoFv3umtcOwg48QRdq/XrA7PmAMstp4vPO8ppeaQJU26rvjI+vEUT5CF3geROTs1JR3no5fHHH8GF01mzwnNeijj6WODqa+qO77ET8NSTujZ77go8+LAutogoykNJ3SZ5yJBk0snkq1ooD708JPKiC4Bzz1ZOEAR7XN7/sHK87FVp2li/p6ZcDvW9yT6S8lAyzkMecg3k5FOBjTcJ9mx8NB246UbgljJ7J8K6Lfs+TjktLAo44zTgigqbvsrVjrPDNI1bteX6knXfZT9Gu9bRLpxO/Q+waofy3GUPz1abh+dEIpo0AWSrgfx0MbVQHsrMZC2P3fsAQ+4ONn3VLCefCAy6StnRv8KOOAq49rrwOlkvQOmBrfKQvu+2KzBKeRdF4q+4Ejh+QHnuchYjZzOaInfirhmsiSwuhvJQss9SHvIU6ZvvBFvPy5XvvgtuHcr1FG054EDg9rvCoymPuhk9/VSwfV9bttoaeHZM+ejNNgbGv6prSW7Pym1akwvlocxOlvK49HLgxJPr7kjUfwH33Au4+97wwVEedTOSC6ertgNmzgxnKRHyM0Nu2S61VPX4778HmjUBfvstvJ3VVgfenhoeV3QE5aHMQJbyeG4ssOVWdXfkqCOiXfvYY09g+H3hg6M8whnJm/vlDf7acv9IoFfv6tHy00f+AdAU2Tgo175ML5SHMkNZyuO1yXU/kyJdPPZo4MbrlZ0FQHnUZhXnYq+0IrtB5cKp5qxB4vc/ALhjSPXjH3cMcIPiGpQ8/PbRLKBlhAfn9LMi3UjKQ8mT8ghAxVmANl8wLU2PPr2BR5R7LuROieyzqfoU7OodgA+mhU+27boBTz4THmdChNPy6L0b0KBBOpjlYbOzFQ9LxdkkxjOP6jnSfm4yj59cpZ49+wyw0/b6ufTyq8AGGwbxcr1ELnhrytDhwN77aCKLj3FaHqY/kl9KP+VhvjzkpUmrtgdmfKxbtGeeDZxzXhB72y3AEf3D68lF1k8/BxZfPDzWhAjKI+Us8MyjNlAXfrbIqC69GDhroG7CrLte8HSzlL33AB58ILzeQX2BW28PjzMlgvJIOROUh7vykO39cuFUtpmHFXm+SM4i5Pki+RKffNUurIx9AdhMuQM1rK08/k55pEyZ8nBXHjKyPXcHHhqpmzR3DQM6dw522IaVldoC06aXfw9LWN2i/k55pEzedXlsvQ3wzOho0Ez52RKn7zVHOvo5YIduuvHvu19wC/6Uk8LjzzpHd0E+vKX8IpyWR5YvQJa7OOXu5Lguj05rBFvpoxRT5BGn7zXHKRdOO64SPLQYVuThxsZNgA8/CIsMnsYt9+b58JrFRTgtjyyxyg5A2QlYs7guj0UWAWZ8AjRrpqdrijzi9L3cKC+/FBh4un78YZGbbAo8/1JYlHl/pzxi5sRXeQiuvv2A628EZDFqiinyiNP3cuP74gtgpVa6C6caPjffGjC1rVAeMTPmijzOOwe48PzoEJo3B9bpCjRs+E/dbbcDDj6kdltZySOPvlcio739GkZW9nTIfiT5DpBthfKImTFX5HHdtcAJx8WEUKNalh99KtfDPPpeiczYMUD3bZNz0z79nPxI6bdAecRk6oo8Xnge2DbkiV4torzlkUffK41dLpyutiowvY7XDmq4Pf4U0D3CtndNm3nFUB4xSbsij19/BVo1B775JiaIKtXylkcefa+Lyr8uB05P8Oi8fNtXvjS38MLJ2RfRAuURk7or8pDhR33RbyVkecsjj77XNT2+/DK4cCoSi1PkBVDyIihbC+URM3MuyUMm/47dAfkZkKQUIY+s+x7GY9+9gPtHhEWV/7vsl5G9J7YWyiNm5lyShyD46afgQ9vyEea4pQh5ZN33MBbjxgLdtgmLqv33tdcBJib8NnH0o6Zbg/KIydM1eZQwTJoI3HwTMOY5QL7ZqimyYUxelnTY4cD2O9SukdWt2ppHyqLvYeOXC6fyoh/NLtKqbcmb7eUN9zYXK+RhM2Cb+y6boSa/Acj/fv8dIC/xlSLvnWjaDGjbNthSLW/OMq3k2fe9+gAjH9QTkL0xMz8Fll5aX8fESMrDxKywT9YQ+PlnQL56H+VuVaWfd9YM+q+OUh62ZYz9NYrAZZcAZ56h75K811Q+q9Cho76OqZGUh6mZYb+MJ3DXHcHrBbVvVZcByftJ5T2lLhTKw4UscgyZELj3HkA++lS1zP8VmD0bkC/JTZwQ7bCyGeytKW6cdcjIKY9o+We0RwQaLBLtI9dhaGzfFFZzfJRHWMb5d28JpCmPsO8R2wiZ8rAxa+xzLgTSkoc8dj96XLAXxqVCebiUTY4lVQJpyEPurox4ENi1V6pdM6IxysOINLATJhJIKo8llgBuuxPos4eJo0veJ8ojOUO24CiBJPJYZVVgxANA5y6OwuHdFncTy5ElJ9CwAfDLL9Hake+vDDwT2O8A/Tteox3BnGieeZiTC/bEMAKy5XzMaODVfwNTpwAzZgBffhE8gSx7NuSZHvm0QsuWwOZbAPJdGHmvq1zn8KFQHj5kmWMkgQwIUB4ZQGWTJOADAcrDhyxzjCSQAQHKIwOobJIEfCBAefiQZY6RBDIgQHlkAJVNkoAPBCgPH7LMMZJABgQojwygskkS8IEA5eFDljlGEsiAAOWRAVQ2SQI+EKA8fMgyx0gCGRCgPDKAyiZJwAcClIcPWeYYSSADApRHBlDZJAn4QIDy8CHLHCMJZECgnrQ5fwEWZNA2myQBEnCUQP16qEd5OJpcDosEsiRAeWRJl22TgMMEKA+Hk8uhkUCWBP6WB697ZImZbZOAWwREHDKiP/+rVHjh1K0kczQkkDaBkjgoj7TJsj0ScJxARXnwDMTxzHN4JBCTQFVplJqo9rOFP2FikmU1EnCYQDlx1PrZUmn8vBbi8Mzg0EigDIFKwqgaWvHMo0iilFW+9DUTJd8e8Wg2EDBSHvz5lM/UoTTy4ezqUYyXh4DnmUi604/SSJenr61ZIQ8KJL3pSXGkx9L3lqyRBwWSfKpSHMkZsoV/CFglDwok/tSlOOKzY83yBKyTBwUSfSpTHNGZsUY4ASvlQYGEJ7YUQXHoWTEyGgFr5UGBhCea4ghnxIj4BKyWBwVSOfEUR/xFwZo6Amp55LnXIurEz7NvOqzFRkXlV+otORabN5OOrplDdcrDhMmkGQTPQP6ZdlpeFIZJS9XsvkR6MM4EaVTFqV0QpvU77ymh5UTZ5p0ZN45Xc37VOvMweQFqFofJ/c9yCmnY8Gwjywz40bbVbxLTLBLfBKJhQnH4sbjzGKXV7zDVLBZfBKJhQXHksaT8OUYtedi22DSLxrYxRZ1+GgYUR1SqjNcQkLn39zUPGxeadvHYOLawBGrHzoujYST597gErP/cpHYRuSQQ7ZgpjrjLgvU0BKyXhwxSu5hsF4h2nPypopn6jElKwAl5+CAQiiPpVGf9tAk4I48oArHpX+ao0uBPlbSXCNurRMApecQRiGtTw/afZq7lw+XxOCcPnwVCcbi8VM0bm5Py8FEgFId5i8v1HjkrD58EQnG4vkzNHJ/T8vBBIBSHmQvLh145Lw+XBUJx+LBEzR2jF/JwUSAUh7mLypeeeSMPVwRCafiyNM0fp1fyKKUjzsYrE1JJcZiQBfahRMBLedgmEUqDC9ZEAl7Lw8SEsE8kYAsBysOWTLGfJGAYAcrDsISwOyRgCwHKw5ZMsZ8kYBgBysOwhLA7JGALAcrDlkyxnyRgGAHKw7CEsDskYAsBysOWTLGfJGAYAcrDsISwOyRgCwHKw5ZMsZ8kYBgBysOwhLA7JGALAcrDlkyxnyRgGAHKw7CEsDskYAsBysOWTLGfJGAYAcrDsISwOyRgCwHKw5ZMsZ8kYBgBysOwhLA7JGALAcrDlkyxnyRgGAHKw7CEsDskYAsBysOWTLGfJGAYAcrDsISwOyRgCwHKw5ZMsZ8kYBgBysOwhLA7JGALAcrDlkyxnyRgGAHKw7CEsDskYAsBysOWTLGfJGAYAcrDsIQU3Z1HHwF276XvRaNGwLxvK8cPOB4YfI2+vR49gZGP6OMZWRwByqM49kYemfIwMi1GdsppeSzTEPjxx2jc99gTGH5ftDql6DtuA/ofGr3u+ElA13Wj1fvhB6BpY2D+/LrrRW2b8oiWB5+jKY8a2bdFHo8/BvTqET51KY9wRoyIR4DysFQexx8LXD84POmURzgjRsQjQHlYKo9OHYFp74cnnfIIZ8SIeAQoDwvlMXs20K61LuGUh44To6IToDwslMedtwOH9dMlm/LQcWJUdAKUh4Xy2GdP4IH7dcmOKo+vvwbee1fXtkQtsgiwwYaV47nPQ8/StkjKwzJ5/PEH0KIp8NVXuqkWVR66VvVRlIeelW2RlIdl8nj9NWDD9fTTzFd5/PorMGsm8OmnwV4f+Y/8f0ssASy1FLD88kD7lYGGDfUsGVmdAOVhsDw+mg7MnVu9g/JzRXOLtlTrltuAVTuUn/brbwDUr1/9b998o7uLU6olP1vq2uCW15mHsBr9HPD8OGD8q4E05CwtrKywAiActtwK2K4b0KFjWA3+vUSA8jBYHkceDtx6c3aTdfZcoHnz6u3btsP0maeBawcBzz0LLFiQnNUmmwL9jwBks+DCCydvz+UWKA/KoxoBW+Qxbx5waF9AdtpmUeRsSs7auqyZRetutEl5UB7WyePdqUD3bYHPPst2EcpPsrvvBXbbPdvj2No65UF5WCUPuZW80fqAXOPIoyy6KPDwKKBb9zyOZtcxKA/Kwyp59OkNPPJwvousWTPg3WnA0kvne1zTj0Z5UB7WyGPKO8DaXYpZUoOvBw4/sphjm3pUyoPysEYe55wFXHyhfin16g0cPyC4/dqkSfDukzlzgFdeBgZdBUx+Q9/WLj2Ahx7Vx/sQSXlQHtbIY/vtgDGjdcuyTRtg2kfAQguVj//tN2CbLYF/v6Jrr+NqwDsRtu3rWrU7ivIwWB41p9bPPwNLLR5twkXdYWryrdqOqwDTP9SNv2VL4P3pwGKLVY6/+krglJN07a24IvDRLF2sL1GUB+VhzZlHq+bA55/rl+a66wGnnBbcKVlySX09RuoIUB6UhzXyaN8GmBXjX3/ZryGbvTbcCOjaFei0BrDa6sFzLizxCVAelIc18th6C+ClF+NP9qo169UDWrcOLqau0Tl4PmfddYF27dNp34dWKA/Kwxp5nDUQuPTibJelPETYezfgwIOAlVfJ9li2t055UB7WyOODaUCXToDcKcm6yE+dvv2As88FZJMYS20ClIcB8pjwGrBO1/Dp6fvdFiF0/rnABeeFs0orQu7aPDum8msN0jqOje04LY/my+nfuFVK3g47AqOeiJfKKLf+qh7hrSnA6p3Cj0l5BIz6HggMGxrOK62Ipk2BF17mz5iaPJ2WxyrtgBkfR5tCnbsAb7wVrU4pOuqLb0r1ZP+A7CMIK5RHQEje2yHv8Bh4OvDLL2HU0vn7ZpsDY19Ipy1XWnFaHuutA7w5OVqqZEfi518ByywTrZ5Er9812pbn0hG+/j54NV5YoTyqE5Ina6+4HBg2JB+JTHwdWHudsCz583en5bHf3sCIGN+dvWoQcMxx0SaBSEpkFbXIa/BmzdHVojzKc5KXQT8+CpDdsbLdXPtyaB31f6IuvBg49fSotdyNd1oeV1wGnHFa9OTJq/nenBI8TKUpchrdbZvg/ZlRS/ftgcef0tWiPHSc5Ixk0iTgtUnAG68D77wNyLtZk5a99wGGDk/aijv1nZaHPD255WbxkrX1NsFTlGHbmkUcJ54ADL4m3nHOPR8YeJaubhx5PP8SIO/l1BaTn23RjqFcnLwQWc4ORSiy0ezll4Dff4/WYhTRR2vZzmin5SFvz267YvAYdpwi25gvuyJ4NkJ2JNYsMhnlot2zz8RpPagz5T39G7vjyGPEg8GmJ20xVR4336h/AlbyJs+01FVEJicP0H88S9qSt6s/mSDX2hzYEue0PCQJp54MXPWvZOlYbrnguYimzYI3an81LzgdnjEjWbuyt0P2eGhLHHkceTRwzWDtEYLrBrv30sc3agTM+7ZyfNQ7UD16AiMfqd1ev4OBIXfp+iXyePOd8Fjh2Xjp4D0fmtJnD+CeEZpIP2Kcl4c8hdmhffDRH9OKvBtz5130vYojD1nccotR+xZwU+Vx5hnAZZfoWT32JLD9DnXHyzdxWrfQtyk/L+VnJktAwHl5yCBlR6LsTDSpbLoZMC7iQ17yM6zBItG/TyJnS/J4eqtW1b9FcsPNgMilajFVHvKJhV499BmUFxeffCrQ77Bg3FWLcJQPQ500AJg0Ud+m/GSRny4sHskj6lujsp4cyy4LTJoMyNuuopamjdO5cyDHtemjT/KpyHato73Po8RW5NGsefBR7u+/Dz5DGfVMVG6pT59Z+wt7UfPnUrwXZx6SMLlAtsUmwMyZxaZP/kWU3/Rhp9SVeimvznsxpZ2ONslDeAy9Czjk4GLyd90NwZfkWP4h4I08/vyXdnbwsSB5OrOIsvjiwP0j44tD+nzlFcBpp6TTe9vkIaOWfTuyfyfPsnsf4N778zyiHcfySh6SEvlo0JH9gZEP5psgeYHu0LuTb2+W/nfqAMjnFpMWG+UhY07jDpqW3QYbAs+MDt/vo23PpTjv5FFK3n33AvJymagPzkVNfsOGwFHHBBvB5MwjjfLUk0Dvnsnfa2GrPITh2DFA/37Jb5dXyofs6znhREC2pNevn0bW3GvDW3lIKuVC6vBhwK23ABPGp5tcuRi67/7BMzKyTyTtIp8gkEfT426Ak/7YLA/p///+F+TvusHA1CnpEJaLqvJtWhGHvJqQpTIBr+VRFYucgYx6NPggkNzGi7oo5QxDbodutHFwTUP+t9yu1DQno9wxuOO2YJekfMBI9oGEFVkc8s5OuVV80SW1XwJs6q3asHFNnBDs9H3uWeD116I9ZSvPMm2+BbDV1sCOOwMtIuz9COuXy3+nPCpkV57MnDkjuDsz78vgX7mffgJkj4D8/JD/LN0oeIlum5UAeeNUpQ8M5TGBZJek/Ov7wQfAd98C330XyKRBA0BuDbdaEWjfHmjdxv3TcMmR5G7aNOCzucB//wv88EOQBXljujyvtGxjoG3b4IXHNfe65JEvF45BebiQRY6BBAogQHkUAJ2HJAEXCFAeLmSRYyCBAghQHgVA5yFJwAUClIcLWeQYSKAAApRHAdB5SBJwgQDl4UIWOQYSKIAA5VEAdB6SBFwgQHm4kEWOgQQKIEB5FACdhyQBFwhQHi5kkWMggQIIUB4FQOchScAFApSHC1nkGEigAAKURwHQeUgScIEA5eFCFjkGEiiAAOVRAHQekgRcIEB5uJBFjoEECiBAeRQAnYckARcIUB4uZJFjIIECCFAeBUDnIUnABQKUhwtZ5BhIoAAClEcB0HlIEnCBAOXhQhY5BhIogADlUQB0HpIEXCBAebiQRY6BBAogQHkUAJ2HJAEXCFAeLmSRYyCBAghQHgVA5yFJwAUClIcLWeQYSKAAApRHAdB5SBJwgQDl4UIWOQYSKIAA5VEAdB6SBFwg8Kc8pMxfgAUuDIhjIAESyIcA5ZEPZx6FBJwiUL8e6v0tD559OJVbDoYEMiMg4pDGKY/MELNhEnCTQFl58OzDzWRzVCSQFoGSOGqdefDiaVqI2Q4JuEegqjgqyoMScS/xHBEJxCVQUxqldqpd86ircd7KjYue9UjAPgKVhFF1JGp55D18yio/4pqJkl9veCRbCBgrD/50yn4KURrZM3b5CMbLgxLJZvpRHNlw9alVa+QhSeFPmeRTk9JIzpAtBASskgcFkmzaUhzJ+LF2dQLWyYMCiTeFKY543FirMgEr5UGBRJvSFEc0XozWEbBWHhSILsEUh44To6ITsFoeFEjdCac4oi8I1tATsF4eFEj5ZFMc+kXAyHgEnJAHBVI9+RRHvMXAWtEIOCMPCiRIPMURbQEwOj4Bp+Thu0AojvgLgTWjE3BOHr4KhOKIPvlZIxkBJ+Xhm0AojmSLgLXjEXBWHr4IhOKIN/FZKzkBp+XhukAojuQLgC3EJ+C8PFwVCMURf9KzZjoEvJCHawKhONKZ/GwlGQFv5FHCZPs7QSiOZBOetdMj4J08bD0LoTTSm/RsKR0CXsqjKjrTz0QojXQmOltJn8D/AR82y52YX++3AAAAAElFTkSuQmCC",
                "id": "ENTIUTILS",
                "name": "Entity's Utils",
                "color1": "#abad00",
                "color2": "#000000",
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
                defaultValue: 'Hello, World',
            },
        },
        disableMonitor: true
    });
    Extension.prototype["ALERT"] = async (args, util) => {
        alert(args["ALERT"])
    };

    blocks.push({
        opcode: "PROMPT",
        blockType: Scratch.BlockType.COMMAND,
        text: "Prompt [Prompt]",
        arguments: {
            "Prompt": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Whats your name?',
            },
        },
        disableMonitor: true
    });
    Extension.prototype["PROMPT"] = async (args, util) => {
        variables['Reply'] = prompt(args["Prompt"])
    };

    blocks.push({
        opcode: "REPLY",
        blockType: Scratch.BlockType.REPORTER,
        text: "responce",
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype["REPLY"] = async (args, util) => {
        return variables['Reply']
    };

    blocks.push({
        opcode: "GTL",
        blockType: Scratch.BlockType.COMMAND,
        text: "Go to Link [LINK]",
        arguments: {
            "LINK": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            },
        },
        disableMonitor: true
    });
    Extension.prototype["GTL"] = async (args, util) => {
        variables['Foo'] = args["LINK"]
        window.location.replace(variables['Foo']);
    };

    blocks.push({
        opcode: "NTX",
        blockType: Scratch.BlockType.COMMAND,
        text: "Num To Hex [NUM]",
        arguments: {
            "NUM": {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 2763,
            },
        },
        disableMonitor: true
    });
    Extension.prototype["NTX"] = async (args, util) => {
        yourNumber = args["NUM"];
        hexString = yourNumber.toString(16);
        variables['Num'] = hexString
    };

    blocks.push({
        opcode: "XTN",
        blockType: Scratch.BlockType.COMMAND,
        text: "Hex to num [HEX]",
        arguments: {
            "HEX": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'acb',
            },
        },
        disableMonitor: true
    });
    Extension.prototype["XTN"] = async (args, util) => {
        hexString = args["HEX"];
        yourNumber = parseInt(hexString, 16);
        variables['HEX'] = yourNumber
    };

    blocks.push({
        opcode: "NUM",
        blockType: Scratch.BlockType.REPORTER,
        text: "Num",
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype["NUM"] = async (args, util) => {
        return variables['HEX']
    };

    blocks.push({
        opcode: "HEX",
        blockType: Scratch.BlockType.REPORTER,
        text: "Hex",
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype["HEX"] = async (args, util) => {
        return variables['Num']
    };

    blocks.push({
        opcode: "IDK",
        blockType: Scratch.BlockType.REPORTER,
        text: "[NUM]",
        arguments: {
            "NUM": {
                type: Scratch.ArgumentType.BOOLEAN,
            },
        },
        disableMonitor: true
    });
    Extension.prototype["IDK"] = async (args, util) => {
        return args["NUM"]
    };

    blocks.push({
        opcode: "IDK1",
        blockType: Scratch.BlockType.BOOLEAN,
        text: "[BOOT]",
        arguments: {
            "NUM": {
                type: Scratch.ArgumentType.empty,
            },
        },
        disableMonitor: true
    });
    Extension.prototype["IDK1"] = async (args, util) => {
        return args["BOOT"]
    };

    blocks.push({
        opcode: "WHOHUH",
        blockType: Scratch.BlockType.REPORTER,
        text: "Who made Entity\'s Utils?",
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype["WHOHUH"] = async (args, util) => {
        return 'EntityAiden made Entity\'s Utils!'
    };

    Scratch.extensions.register(new Extension());
})(Scratch);
