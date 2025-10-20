import { Art } from "./pim-art/index.js";
import Play from "./Play.js";
import Pause from "./Pause.js";

let inputColorIsOpen = false;
export let overlayColor = null;

const inputColorContainer = document.querySelector("#input-color-container");
const inputColor = document.querySelector("#input-color");
const audioPlayerElement = document.querySelector("audio-player");




if (inputColorContainer && audioPlayerElement && inputColor) {

    const art = new Art({
        width: 320,
        height: 180,
        play: new Play(),
        pause: new Pause(),
        canvas: "#canvas",
        willReadFrequently: true
    });

    art.start();

    audioPlayerElement.addEventListener("pause", async () => {
        await art.pause();
        inputColor.classList.add("display-none");
    });

    audioPlayerElement.addEventListener("play",async () => {
        await art.play();
        inputColor.classList.remove("display-none");
    });

    audioPlayerElement.addEventListener("volume", (e) => {
        console.log("VOLYME ", e.detail.volume)

        art.audio.setVolume(e.detail.volume / 100)
    });

    inputColorContainer.addEventListener("click", (e) => {
        if (inputColorIsOpen) {
            e.stopPropagation();
            inputColorIsOpen = false;
            inputColorContainer.classList.toggle("display-none");
        }
    });

    inputColor.addEventListener("click", (e) => {
        inputColorContainer.classList.toggle("display-none");
        inputColorIsOpen = !inputColorIsOpen;
        e.stopPropagation();
    });

    inputColor.addEventListener("blur", () => {
        if (inputColorIsOpen) {
            inputColorIsOpen = false;
            inputColorContainer.classList.toggle("display-none");
        }
    });

    inputColor.addEventListener("change", (e) => {
        if (e.target.value) overlayColor = e.target.value;
    });

    if (overlayColor) inputColor.value = overlayColor;

    addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            togglePlayPause();
        } else if (e.key === "f" || e.key === "F") {
            art.enterFullScreen();
        }
    });

    /**
     * Communication from parent document (pimpixels): 
     * 
     * F/f keydown events is relayed here via message "enter-fullscreen".
     * Space keydown events is relayed here via message "toggle-play-pause".
     * 
     */
    addEventListener("message", (event) => {
        const data = event.data;
        if (data.action === "toggle-play-pause") {
            togglePlayPause();
        } else if (data.action === "enter-fullscreen") {
            art.enterFullScreen();
        }
    });

    function togglePlayPause() {
        if (audioPlayerElement.isOn) {
            audioPlayerElement.pause();
        } else {
            audioPlayerElement.play();
        }
    }
}