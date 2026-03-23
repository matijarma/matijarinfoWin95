export function createMediaEngine({ eventBus } = {}) {
  let audioEnabled = true;

  function setAudioEnabled(enabled) {
    audioEnabled = Boolean(enabled);
    eventBus?.emit("media:audio-enabled-changed", { enabled: audioEnabled });
  }

  function isAudioEnabled() {
    return audioEnabled;
  }

  function playSound(soundId, options = {}) {
    eventBus?.emit("media:sound-play-requested", {
      soundId,
      options,
      audioEnabled,
    });
  }

  function attachVideo(videoElement, src) {
    if (!(videoElement instanceof HTMLVideoElement)) {
      throw new Error("attachVideo expects an HTMLVideoElement.");
    }

    videoElement.src = src;
    eventBus?.emit("media:video-attached", { src });

    return videoElement;
  }

  function createEmbedFrame(url, { title = "Embedded content" } = {}) {
    const frame = document.createElement("iframe");
    frame.src = url;
    frame.title = title;
    frame.loading = "lazy";

    eventBus?.emit("media:embed-created", { url, title });

    return frame;
  }

  return {
    setAudioEnabled,
    isAudioEnabled,
    playSound,
    attachVideo,
    createEmbedFrame,
  };
}
