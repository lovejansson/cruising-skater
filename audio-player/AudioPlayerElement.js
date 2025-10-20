import "./array.js";

const playIcon = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" fill="currentColor" /> </svg>';
const pauseIcon = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M10 4H5v16h5V4zm9 0h-5v16h5V4z" fill="currentColor" /> </svg>';

const MAX_VOLUME = 100;
const DEFAULT_VOLUME = 20;
const VOLUME_STEP = 20;
const DEBUG = false;

export default class AudioPlayerElement extends HTMLElement {
  
    /**
     * @type {HTMLDivElement}
     */
    volumeControl;

    /**
     * @type {boolean}
     */
    isOn;

    /**
     * @type {number}
     */
    volume;
       
    
    constructor() {
        super();
        const template = document.getElementById("template-audio-player");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(templateContent.cloneNode(true));
        this.isOn = false;
        this.volume = DEFAULT_VOLUME;
    }


    async connectedCallback() {
        if(DEBUG) console.log(`Connected audio player element: ${this.getAttribute("channel")} ${this.getAttribute("playlist")}`);

        const player = this.shadowRoot.querySelector("#player");
        const playerControls = this.shadowRoot.querySelector("#player-controls");
        const btnPlayPause = this.shadowRoot.querySelector("#btn-play-pause");
        const volumeControl =  this.shadowRoot.querySelector("#volume-control");

        if(!player) throw new Error("Missing DOM element: player");
        if (!btnPlayPause) throw new Error("Missing DOM element: btnPlayPause");
        if (!volumeControl) throw new Error("Missing DOM element: volumeControl");
   
        player.classList.add("hidden");

        this.volumeControl = volumeControl;
        this.btnPlayPause = btnPlayPause;

        this.initVolumeControl();

        this.dispatchEvent(new CustomEvent("volume", {detail: {volume: this.volume}}));

        this.btnPlayPause.addEventListener("click", (e) => {
            if(this.isOn) {
                this.pause();
            } else {
                this.play();
            }

            e.stopPropagation();
        
        });

        player.addEventListener("click", (e) => {
         
            if(this.isOn) {
                this.pause();
            } else {
                this.play();
            }

            //e.stopPropagation();
        });

        playerControls.addEventListener("click", (e) => {
            e.stopPropagation();
        })

        player.classList.remove("hidden");
    }


    attributeChangedCallback(name, oldValue, newValue) {
       if(DEBUG) console.log(`Attribute ${name} has changed from ${oldValue} to ${newValue}`);
    }

    play() {
        this.isOn = true;
        this.btnPlayPause.innerHTML = pauseIcon;
        this.dispatchEvent(new CustomEvent("play"));
    }

    pause() {
        this.isOn = false;
        this.btnPlayPause.innerHTML = playIcon;
        this.dispatchEvent(new CustomEvent("pause"));
    }


    /**
     * Sets click listeners for volume control to change volume and initializes volume
     */
    initVolumeControl() {


        this.volume = DEFAULT_VOLUME;

        const volumeControl =  this.shadowRoot.querySelector("#volume-control");

        for (let i = 0; i < volumeControl.children.length; ++i) {

            const button = volumeControl.children.item(i);

            button.addEventListener("click", (e) => {

                const newVolume = (MAX_VOLUME / 5) * (parseInt(i) + 1);

                this.volume = this.volume === newVolume ? this.volume - MAX_VOLUME / 5 : newVolume;

                this.renderVolume();

                this.dispatchEvent(new CustomEvent("volume", {detail: {volume: this.volume}}));

                e.stopPropagation();
            });
        }

        volumeControl.addEventListener("click", (e) => {
            // Calculate which volume step based on position of click inside the volume control 

            const xInVolumeControl = e.x - volumeControl.getBoundingClientRect().left;

            const newVolume = ((Math.floor(((xInVolumeControl / (volumeControl.clientWidth + 2)) * 100) / VOLUME_STEP)) + 1) * VOLUME_STEP;
            this.volume = this.volume === newVolume ? this.volume - MAX_VOLUME / 5 : newVolume;

            this.renderVolume();

            this.dispatchEvent(new CustomEvent("volume", {detail: {volume: this.volume}}));

            e.stopPropagation();
        });

        this.renderVolume();
    }

    /**
     * Toggles classes for filled sqare or empty square to show volume.
     */
    renderVolume() {

        const volumeControl =  this.shadowRoot.querySelector("#volume-control");

        for (let i = 0; i < volumeControl.children.length; ++i) {

            const button = volumeControl.children.item(i);

            if ((MAX_VOLUME / 5) * (i + 1) <= this.volume) {
                button.classList.add("square-filled");
                button.classList.remove("square-empty");
            } else {
                button.classList.add("square-empty");
                button.classList.remove("square-filled");
            }
        }
    }

}

customElements.define("audio-player", AudioPlayerElement);