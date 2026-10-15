"use strict";

/*
  STUDYHUB MEDIA CONFIGURATION

  Photos:
  study/image/IMG_20261015_203337.jpg

  Videos:
  study/videos/your-video.mp4

  GitHub filenames are case-sensitive.
*/

const photos = [
    {
        file: "IMG_20261015_203337.jpg",
        title: "Study Notes 03",
        subject: "Study Material"
    }
];

/*
  Apni videos yahan add karo.

  Example:
  {
      file: "lesson-01.mp4",
      title: "Introduction to Mechanics",
      subject: "Mechanical Engineering",
      description: "Introduction to basic concepts",
      thumbnail: "lesson-01.jpg"
  }

  Video path:
  study/videos/lesson-01.mp4

  Thumbnail optional hai:
  study/thumbnails/lesson-01.jpg

  Example ko tabhi uncomment karke use karo jab
  tumne apni actual video aur thumbnail upload kar di ho.
*/

const videos = [
    // Apni actual video entries yahan add karo.
];

const IMAGE_FOLDER = "study/image/";
const VIDEO_FOLDER = "study/videos/";
const THUMBNAIL_FOLDER = "study/thumbnails/";

const gallery = document.getElementById("gallery");
const videoGrid = document.getElementById("videoGrid");
const photoCount = document.getElementById("photoCount");
const photoCountLabel = document.getElementById("photoCountLabel");
const videoCount = document.getElementById("videoCount");
const searchInput = document.getElementById("searchInput");

const playerModal = document.getElementById("playerModal");
const videoPlayer = document.getElementById("videoPlayer");
const playerTitle = document.getElementById("playerTitle");
const playerSubject = document.getElementById("playerSubject");
const playbackSpeed = document.getElementById("playbackSpeed");
const fullscreenButton = document.getElementById("fullscreenButton");
const closePlayerButton = document.getElementById("closePlayer");
const playbackStatus = document.getElementById("playbackStatus");
const videoStage = document.getElementById("videoStage");
const toast = document.getElementById("toast");

let lastFocusedElement = null;
let toastTimeout = null;
let currentVideo = null;
let playerError = false;
let lastStatus = "Ready to play";

/* Safe URL creation for local repository assets. */
function mediaURL(folder, filename) {
    return folder + filename.split("/").map(encodeURIComponent).join("/");
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("visible");
    }, 3000);
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function createEmptyState(icon, heading, description) {
    const state = createElement("div", "empty-state");
    state.append(
        createElement("div", "empty-icon", icon),
        createElement("h3", "", heading),
        createElement("p", "", description)
    );

    return state;
}

function createMediaCard({ type, title, subject, description, file, thumbnail }) {
    const card = createElement("button", "media-card");
    card.type = "button";
    card.dataset.search = [title, subject, description || ""].join(" ").toLowerCase();

    const artwork = createElement("div", "media-artwork");

    if (type === "video" && thumbnail) {
        const image = document.createElement("img");
        image.src = mediaURL(THUMBNAIL_FOLDER, thumbnail);
        image.alt = "";
        image.loading = "lazy";

        image.addEventListener("error", () => {
            image.remove();
            artwork.classList.add("artwork-fallback");
        });

        artwork.appendChild(image);
    } else if (type === "photo") {
        const image = document.createElement("img");
        image.src = mediaURL(IMAGE_FOLDER, file);
        image.alt = title;
        image.loading = "lazy";

        image.addEventListener("error", () => {
            image.alt = "Image could not be loaded";
            image.classList.add("image-error");
            image.style.display = "none";

            const fallback = createElement(
                "span",
                "artwork-symbol",
                "▧"
            );

            artwork.appendChild(fallback);
        });

        artwork.appendChild(image);
    }

    if (type === "video") {
        artwork.classList.add("video-artwork");

        const playIcon = createElement("span", "artwork-play", "▶");
        playIcon.setAttribute("aria-hidden", "true");
        artwork.appendChild(playIcon);

        artwork.appendChild(
            createElement("span", "media-type", "VIDEO")
        );
    } else {
        artwork.classList.add("photo-artwork");
    }

    const info = createElement("div", "media-info");
    info.append(
        createElement("h3", "media-title", title),
        createElement("p", "media-subject", subject || "Study Material")
    );

    if (description) {
        info.appendChild(
            createElement("p", "media-description", description)
        );
    }

    card.append(artwork, info);

    if (type === "video") {
        card.setAttribute("aria-label", "Play " + title);
        card.addEventListener("click", () => openPlayer({
            file,
            title,
            subject,
            description
        }));
    } else {
        card.setAttribute("aria-label", "Open photo " + title);

        card.addEventListener("click", () => {
            window.open(
                mediaURL(IMAGE_FOLDER, file),
                "_blank",
                "noopener"
            );
        });
    }

    return card;
}

function renderVideos(query = "") {
    videoGrid.innerHTML = "";

    const filtered = videos.filter(video => {
        const text = [
            video.title,
            video.subject,
            video.description || ""
        ].join(" ").toLowerCase();

        return text.includes(query);
    });

    videoCount.textContent = filtered.length;

    if (filtered.length === 0) {
        videoGrid.appendChild(
            createEmptyState(
                "▶",
                videos.length ? "No matching videos" : "Your video library is ready",
                videos.length
                    ? "Try another search term."
                    : "Add your video filenames in the videos array in script.js."
            )
        );

        return;
    }

    filtered.forEach(video => {
        videoGrid.appendChild(
            createMediaCard({
                ...video,
                type: "video"
            })
        );
    });
}

function renderPhotos(query = "") {
    gallery.innerHTML = "";

    const filtered = photos.filter(photo => {
        const text = [
            photo.title,
            photo.subject
        ].join(" ").toLowerCase();

        return text.includes(query);
    });

    photoCount.textContent = filtered.length;
    photoCountLabel.textContent = `${filtered.length} photos`;

    if (filtered.length === 0) {
        gallery.appendChild(
            createEmptyState(
                "▧",
                photos.length ? "No matching photos" : "No photos added",
                "Try another search or add a photo entry in script.js."
            )
        );

        return;
    }

    filtered.forEach(photo => {
        gallery.appendChild(
            createMediaCard({
                ...photo,
                type: "photo"
            })
        );
    });
}

function renderLibrary() {
    const query = searchInput.value.trim().toLowerCase();

    renderVideos(query);
    renderPhotos(query);
}

function openPlayer(video) {
    lastFocusedElement = document.activeElement;
    currentVideo = video;
    playerError = false;
    lastStatus = "Loading video...";

    playerTitle.textContent = video.title;
    playerSubject.textContent = video.subject || "Study Material";
    playbackStatus.textContent = lastStatus;

    videoPlayer.pause();
    videoPlayer.removeAttribute("src");
    videoPlayer.load();

    videoPlayer.src = mediaURL(VIDEO_FOLDER, video.file);
    videoPlayer.playbackRate = Number(playbackSpeed.value) || 1;

    playerModal.hidden = false;
    document.body.classList.add("player-open");

    videoPlayer.load();

    closePlayerButton.focus();

    const playPromise = videoPlayer.play();

    if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
            if (!playerError) {
                lastStatus = "Press Play to start";
                playbackStatus.textContent = lastStatus;
            }
        });
    }
}

function closePlayer() {
    if (playerModal.hidden) {
        return;
    }

    videoPlayer.pause();
    videoPlayer.removeAttribute("src");
    videoPlayer.load();

    playerModal.hidden = true;
    document.body.classList.remove("player-open");

    currentVideo = null;
    playerError = false;

    if (lastFocusedElement && document.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
    }
}

function updatePlaybackStatus() {
    if (playerError) {
        playbackStatus.textContent = "Video could not be played";
    } else if (videoPlayer.ended) {
        playbackStatus.textContent = "Playback finished";
    } else if (videoPlayer.paused) {
        playbackStatus.textContent = videoPlayer.currentTime > 0
            ? "Paused"
            : lastStatus;
    } else {
        playbackStatus.textContent = "Now playing";
    }
}

function toggleFullscreen() {
    if (playerModal.hidden) {
        return;
    }

    if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {
            showToast("Use your TV remote to exit fullscreen.");
        });

        return;
    }

    const target = videoStage;

    if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {
            showToast("Fullscreen is not supported by this browser.");
        });
    } else if (videoPlayer.webkitEnterFullscreen) {
        videoPlayer.webkitEnterFullscreen();
    } else {
        showToast("Fullscreen is not supported by this browser.");
    }
}

/*
  TV navigation:
  Arrow keys move focus to the nearest visible focusable element
  in the requested direction. Native video controls retain their
  normal browser keyboard behavior.
*/
function moveFocus(direction) {
    const candidates = Array.from(
        document.querySelectorAll(
            'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), video[tabindex="0"]'
        )
    ).filter(element => {
        return element.getClientRects().length > 0 &&
            !element.closest("[hidden]") &&
            element !== document.activeElement;
    });

    const active = document.activeElement;

    if (!active || !active.getClientRects().length) {
        candidates[0]?.focus();
        return;
    }

    const current = active.getBoundingClientRect();
    const cx = current.left + current.width / 2;
    const cy = current.top + current.height / 2;

    let best = null;
    let bestScore = Infinity;

    candidates.forEach(element => {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        const dx = x - cx;
        const dy = y - cy;

        let primary;
        let secondary;

        if (direction === "right" && dx > 8) {
            primary = dx;
            secondary = Math.abs(dy);
        } else if (direction === "left" && dx < -8) {
            primary = -dx;
            secondary = Math.abs(dy);
        } else if (direction === "down" && dy > 8) {
            primary = dy;
            secondary = Math.abs(dx);
        } else if (direction === "up" && dy < -8) {
            primary = -dy;
            secondary = Math.abs(dx);
        } else {
            return;
        }

        const score = primary + secondary * 1.8;

        if (score < bestScore) {
            bestScore = score;
            best = element;
        }
    });

    if (best) {
        best.focus();
    }
}

searchInput.addEventListener("input", renderLibrary);

closePlayerButton.addEventListener("click", closePlayer);
fullscreenButton.addEventListener("click", toggleFullscreen);

playbackSpeed.addEventListener("change", () => {
    videoPlayer.playbackRate = Number(playbackSpeed.value) || 1;
});

videoPlayer.addEventListener("playing", () => {
    lastStatus = "Now playing";
    updatePlaybackStatus();
});

videoPlayer.addEventListener("pause", updatePlaybackStatus);
videoPlayer.addEventListener("ended", updatePlaybackStatus);

videoPlayer.addEventListener("waiting", () => {
    if (!playerError) {
        playbackStatus.textContent = "Buffering...";
    }
});

videoPlayer.addEventListener("error", () => {
    playerError = true;
    playbackStatus.textContent =
        "Cannot play this video. Check its path and format.";
});

videoPlayer.addEventListener("loadedmetadata", () => {
    playerError = false;
    lastStatus = "Ready to play";
    updatePlaybackStatus();
});

/* Close the player if the user clicks the dark backdrop. */
playerModal.addEventListener("click", event => {
    if (event.target === playerModal) {
        closePlayer();
    }
});

/* Keyboard and TV remote controls. */
document.addEventListener("keydown", event => {
    const isOpen = !playerModal.hidden;
    const active = document.activeElement;

    if (event.key === "Escape" || event.key === "Backspace") {
        if (isOpen) {
            event.preventDefault();
            closePlayer();
            return;
        }
    }

    if (isOpen && event.key === "MediaPlayPause") {
        event.preventDefault();

        if (videoPlayer.paused) {
            videoPlayer.play().catch(() => {});
        } else {
            videoPlayer.pause();
        }

        return;
    }

    /*
      Do not override arrows inside the search box, select menus
      or native video controls.
    */
    const isNativeControl =
        active === searchInput ||
        active === playbackSpeed ||
        active === videoPlayer;

    if (isNativeControl) {
        return;
    }

    const directionMap = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right"
    };

    const direction = directionMap[event.key];

    if (direction) {
        event.preventDefault();
        moveFocus(direction);
    }
});

document.addEventListener("fullscreenchange", () => {
    fullscreenButton.textContent = document.fullscreenElement
        ? "⛶ Exit fullscreen"
        : "⛶ Fullscreen";
});

/* Initial render. */
renderLibrary();
