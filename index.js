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

    art.play();

    audioPlayerElement.addEventListener("pause", () => {
        art.isPlaying = false;
        inputColor.classList.add("display-none");
    });

    audioPlayerElement.addEventListener("play", () => {
        art.isPlaying = true;
        inputColor.classList.remove("display-none");
    });

    audioPlayerElement.addEventListener("volume", (e) => {
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
}



