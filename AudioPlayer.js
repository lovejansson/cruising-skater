/**
 * A singleton class for managing audio playback in the application.
 */
export default class AudioPlayer {
    /**
     * @type {AudioPlayer} The singleton instance of the AudioPlayer.
     */
    static instance;

    constructor() {
        /**
         * @type {Map<string, AudioBuffer>} A map of audio IDs to their corresponding audio buffers.
         */
        this.sounds = new Map();

        /**
         * @type {Map<string, AudioBufferSourceNode>} A map of currently playing audio IDs to their audio source nodes.
         */
        this.playingAudioNodes = new Map();

        /**
         * @type {boolean} Indicates whether the audio player is on or off.
         */
        this.onoff = true;

        /**
         * @type {AudioContext} The Web Audio API context used for audio playback.
         */
        this.audioCtx = new AudioContext();

        /**
         * @type {GainNode} The gain node used to control the volume of the audio.
         */
        this.volumeNode = this.audioCtx.createGain();
        this.volumeNode.connect(this.audioCtx.destination);
    }

    /**
     * Returns the singleton instance of the AudioPlayer.
     * @returns {AudioPlayer} The singleton instance of the AudioPlayer.
     */
    static getInstance() {
        if (!AudioPlayer.instance) {
            AudioPlayer.instance = new AudioPlayer();
        }
        return AudioPlayer.instance;
    }

    /**
     * Creates audio data from a file at the specified path and associates it with the given ID.
     * @param {string} id The unique ID for the audio.
     * @param {string} path The file path to the audio file.
     * @throws {AudioFetchError} If the audio file cannot be fetched or decoded.
     */
    async createAudio(id, path) {
        try {
            const response = await fetch(path);
            const audioBuffer = await this.audioCtx.decodeAudioData(await response.arrayBuffer());
            this.sounds.set(id, audioBuffer);
        } catch (err) {
            throw new AudioFetchError(path, err);
        }
    }

    /**
     * Plays the audio associated with the given ID. Optionally, the audio can loop.
     * @param {string} id The unique ID of the audio to play.
     * @param {boolean} [loop=false] Whether the audio should loop.
     * @throws {AudioNotFoundError} If the audio with the given ID does not exist.
     */
    playAudio(id, loop = false) {
        if (this.onoff) {
            const alreadyPlayingNode = this.playingAudioNodes.get(id);
            if (alreadyPlayingNode) {
                return;
            }

            if (this.audioCtx.state === "suspended") {
                this.audioCtx.resume();
            }

            const audioBuffer = this.sounds.get(id);
            if (!audioBuffer) throw new AudioNotFoundError(id);

            const audioSource = this.audioCtx.createBufferSource();
            audioSource.buffer = audioBuffer;
            audioSource.loop = loop;
            audioSource.connect(this.volumeNode);
            audioSource.start();

            this.playingAudioNodes.set(id, audioSource);

            audioSource.addEventListener("ended", () => {
                this.playingAudioNodes.delete(id);
            });
        }
    }

    /**
     * Stops the audio associated with the given ID.
     * @param {string} id The unique ID of the audio to stop.
     */
    stopAudio(id) {
        const source = this.playingAudioNodes.get(id);
        if (source) {
            source.stop();
        }
    }

    /**
     * Sets the volume for the audio player.
     * @param {number} volume The volume level (between 0 and 1).
     * @throws {InvalidVolumeRangeError} If the volume is not within the valid range (0-1).
     */
    setVolume(volume) {
        if (volume < 0 || volume > 1) throw new InvalidVolumeRangeError(volume);
        this.volumeNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    }

    /**
     * Toggles the audio player on or off.
     */
    onOffSwitch() {
        this.onoff = !this.onoff;
        if (!this.onoff) {
            this.turnOffAllAudios();
        }
    }

    /**
     * Checks if the audio player is currently on.
     * @returns {boolean} True if the audio player is on, false otherwise.
     */
    isOn() {
        return this.onoff;
    }

    /**
     * Stops all currently playing audio.
     */
    turnOffAllAudios() {
        for (const audioSource of this.playingAudioNodes.values()) {
            audioSource.stop();
        }
    }
}

/**
 * Error thrown when the volume is set outside the valid range (0-1).
 */
class InvalidVolumeRangeError extends Error {
    /**
     * @param {number} volume The invalid volume value.
     */
    constructor(volume) {
        super(`Volume: ${volume} is not within valid range 0-1.`);
    }
}

/**
 * Error thrown when an audio file with the given ID is not found.
 */
class AudioNotFoundError extends Error {
    /**
     * @param {string} id The ID of the missing audio.
     */
    constructor(id) {
        super(`Audio with id: ${id} does not exist.`);
    }
}

/**
 * Error thrown when an audio file cannot be fetched or decoded.
 */
class AudioFetchError extends Error {
    /**
     * @param {string} path The path to the audio file.
     * @param {Error} error The underlying error.
     */
    constructor(path, error) {
        super(`Unable to fetch audio file: ${path}. Error: ${error.message}`);
    }
}