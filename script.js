"use strict";

/* =========================================
   STUDYHUB - IMPROVED CONFIGURATION
========================================= */

/*
  PHOTO / PDF CONFIGURATION

  Photos:
  file: "photo.jpg"

  PDF:
  file: "notes.pdf"

  Both files must be inside study/image/
*/

const photos = [
    {
        file: "IMG_20261015_203337.jpg",
        title: "Study Notes 03",
        subject: "Study Material"
    },
    {
        file: "English 12 Tenses Hindi Guide.pdf",
        title: "English 12 Tenses Hindi Guide",
        subject: "English",
        description: "Hindi PDF Guide"
    }
];

/*
  VIDEO CONFIGURATION

  Google Drive:
  driveLink: "https://drive.google.com/file/d/FILE_ID/view"

  GitHub:
  file: "lesson-01.mp4"

  GitHub video folder:
  study/videos/

  Optional thumbnail:
  thumbnail: "lesson-01.jpg"

  IMPORTANT:
  Replace the sample Drive link below with your real link.
*/

const videos = [
    {
        title: "My First Video",
        subject: "Study Material",
        description: "Google Drive video",
        driveLink: "https://drive.google.com/file/d/PASTE_FILE_ID_HERE/view"
    }

    // Add more video objects here.
];

const IMAGE_FOLDER = "study/image/";
const VIDEO_FOLDER = "study/videos/";
const THUMBNAIL_FOLDER = "study/thumbnails/";


/* =========================================
   DOM ELEMENTS
========================================= */

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
let playerError = false;
let lastStatus = "Ready to play";
let activeVideoType = null;


/* =========================================
   INITIAL HTML CHECK
========================================= */

const requiredElements = [
    gallery,
    videoGrid,
    photoCount,
    photoCountLabel,
    videoCount,
    searchInput,
    playerModal,
    videoPlayer,
    playerTitle,
    playerSubject,
    playbackSpeed,
    fullscreenButton,
    closePlayerButton,
    playbackStatus,
    videoStage,
    toast
];

if (requiredElements.some(element => !element)) {
    console.error(
        "StudyHub: One or more required HTML elements are missing. " +
        "Check the element IDs in index.html."
    );
}


/* =========================================
   UTILITIES
========================================= */

function mediaURL(folder, filename) {
    if (!filename || typeof filename !== "string") {
        return "";
    }

    const safePath = filename
        .replace(/\\/g, "/")
        .split("/")
        .filter(part => part && part !== "." && part !== "..")
        .map(part => encodeURIComponent(part))
        .join("/");

    if (!safePath) {
        return "";
    }

    return folder + safePath;
}


function isPDF(file) {
    return /\.pdf$/i.test(file || "");
}


function showToast(message) {
    if (!toast) {
        console.warn("StudyHub:", message);
        return;
    }

    toast.textContent = message;
    toast.classList.add("visible");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("visible");
    }, 3500);
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


function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}


function getSearchText(item) {
    return [
        item.title,
        item.subject,
        item.description,
        item.file
    ].map(normalizeText).join(" ");
}


function safeOpen(url) {
    if (!url) {
        showToast("File path is missing.");
        return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
}


/* =========================================
   GOOGLE DRIVE LINK HANDLING
========================================= */

function getDrivePreviewUrl(link) {
    if (typeof link !== "string" || !link.trim()) {
        return "";
    }

    try {
        const url = new URL(link.trim());

        if (
            url.protocol !== "https:" ||
            ![
                "drive.google.com",
                "www.drive.google.com"
            ].includes(url.hostname.toLowerCase())
        ) {
            return "";
        }

        let fileId = "";

        const match = url.pathname.match(
            /\/file\/d\/([^/]+)/
        );

        if (match) {
            fileId = match[1];
        } else {
            fileId = url.searchParams.get("id") || "";
        }

        // Reject placeholders and suspicious IDs.
        if (
            !fileId ||
            /PASTE_FILE_ID_HERE|YOUR_FILE_ID/i.test(fileId) ||
            !/^[a-zA-Z0-9_-]+$/.test(fileId)
        ) {
            return "";
        }

        return (
            "https://drive.google.com/file/d/" +
            encodeURIComponent(fileId) +
            "/preview"
        );

    } catch (error) {
        return "";
    }
}


function isDriveVideo(video) {
    return Boolean(
        video &&
        getDrivePreviewUrl(video.driveLink)
    );
}


function isGitHubVideo(video) {
    return Boolean(
        video &&
        typeof video.file === "string" &&
        /\.mp4$/i.test(video.file)
    );
}


/* =========================================
   MEDIA CARD CREATION
========================================= */

function createMediaCard(options) {
    const {
        type,
        title,
        subject,
        description,
        file,
        thumbnail
    } = options;

    const card = createElement("button", "media-card");

    card.type = "button";

    card.dataset.search = getSearchText(options);

    const artwork = createElement("div", "media-artwork");

    /* ---------- VIDEO THUMBNAIL ---------- */

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
    }

    /* ---------- PHOTO / PDF ARTWORK ---------- */

    if (type === "photo") {
        const pdf = isPDF(file);

        if (pdf) {
            artwork.classList.add("pdf-artwork");

            artwork.appendChild(
                createElement("span", "artwork-symbol", "PDF")
            );

            artwork.appendChild(
                createElement("span", "media-type", "PDF DOCUMENT")
            );

        } else {
            artwork.classList.add("photo-artwork");

            const image = document.createElement("img");

            image.src = mediaURL(IMAGE_FOLDER, file);
            image.alt = title || "Study image";
            image.loading = "lazy";

            image.addEventListener("error", () => {
                image.remove();

                if (!artwork.querySelector(".artwork-symbol")) {
                    artwork.appendChild(
                        createElement("span", "artwork-symbol", "▧")
                    );
                }

                artwork.classList.add("artwork-fallback");
            });

            artwork.appendChild(image);
        }
    }

    /* ---------- VIDEO ARTWORK ---------- */

    if (type === "video") {
        artwork.classList.add("video-artwork");

        artwork.append(
            createElement("span", "artwork-play", "▶"),
            createElement("span", "media-type", "VIDEO")
        );
    }

    /* ---------- CARD INFORMATION ---------- */

    const info = createElement("div", "media-info");

    info.append(
        createElement("h3", "media-title", title || "Untitled"),
        createElement(
            "p",
            "media-subject",
            subject || "Study Material"
        )
    );

    if (description) {
        info.appendChild(
            createElement("p", "media-description", description)
        );
    }

    card.append(artwork, info);

    /* ---------- CARD ACTIONS ---------- */

    if (type === "video") {
        card.setAttribute(
            "aria-label",
            "Play video " + (title || "")
        );

        card.addEventListener("click", () => {
            openPlayer(options);
        });

    } else {
        const pdf = isPDF(file);

        card.setAttribute(
            "aria-label",
            (pdf ? "Open PDF " : "Open photo ") + (title || "")
        );

        card.addEventListener("click", () => {
            safeOpen(mediaURL(IMAGE_FOLDER, file));
        });
    }

    return card;
}


/* =========================================
   RENDER VIDEO LIBRARY
========================================= */

function renderVideos(query = "") {
    videoGrid.innerHTML = "";

    const filtered = videos.filter(video => {
        return getSearchText(video).includes(query);
    });

    videoCount.textContent = filtered.length;

    if (filtered.length === 0) {
        videoGrid.appendChild(
            createEmptyState(
                "▶",
                videos.length
                    ? "No matching videos"
                    : "Your video library is ready",
                videos.length
                    ? "Try another search term."
                    : "Add your Google Drive links or MP4 files in script.js."
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


/* =========================================
   RENDER PHOTO AND PDF LIBRARY
========================================= */

function renderPhotos(query = "") {
    gallery.innerHTML = "";

    const filtered = photos.filter(photo => {
        return getSearchText(photo).includes(query);
    });

    photoCount.textContent = filtered.length;

    const pdfCount = filtered.filter(
        item => isPDF(item.file)
    ).length;

    const imageCount = filtered.length - pdfCount;

    if (photoCountLabel) {
        photoCountLabel.textContent =
            imageCount + " photos · " + pdfCount + " PDFs";
    }

    if (filtered.length === 0) {
        gallery.appendChild(
            createEmptyState(
                "▧",
                "No matching study resources",
                "Try a different title, subject, or search term."
            )
        );

        return;
    }

    filtered.forEach(item => {
        gallery.appendChild(
            createMediaCard({
                ...item,
                type: "photo"
            })
        );
    });
}


/* =========================================
   SEARCH AND LIBRARY
========================================= */

function renderLibrary() {
    const query = normalizeText(searchInput.value);

    renderVideos(query);
    renderPhotos(query);
}


/* =========================================
   STOP AND RESET VIDEO PLAYER
========================================= */

function resetVideoPlayer() {
    videoPlayer.pause();

    videoPlayer.removeAttribute("src");
    videoPlayer.load();

    const oldFrame = videoStage.querySelector(".drive-player");

    if (oldFrame) {
        oldFrame.src = "about:blank";
        oldFrame.remove();
    }

    videoPlayer.hidden = false;
    activeVideoType = null;
}


/* =========================================
   OPEN VIDEO PLAYER
========================================= */

function openPlayer(video) {
    if (!video || !playerModal) {
        showToast("Unable to open this video.");
        return;
    }

    const driveUrl = getDrivePreviewUrl(video.driveLink || "");

    const githubUrl = isGitHubVideo(video)
        ? mediaURL(VIDEO_FOLDER, video.file)
        : "";

    if (!driveUrl && !githubUrl) {
        showToast(
            "Invalid video link. Add a valid Google Drive link or MP4 file."
        );
        return;
    }

    lastFocusedElement = document.activeElement;
    playerError = false;
    lastStatus = "Loading video...";

    playerTitle.textContent = video.title || "Study Video";
    playerSubject.textContent = video.subject || "Study Material";
    playbackStatus.textContent = lastStatus;

    resetVideoPlayer();

    playerModal.hidden = false;
    document.body.classList.add("player-open");

    if (driveUrl) {
        /* ---------- GOOGLE DRIVE PLAYER ---------- */

        activeVideoType = "drive";
        videoPlayer.hidden = true;

        const frame = document.createElement("iframe");

        frame.className = "drive-player";
        frame.src = driveUrl;
        frame.title = video.title || "Google Drive video player";

        frame.allow =
            "autoplay; fullscreen; picture-in-picture";

        frame.allowFullscreen = true;

        frame.referrerPolicy =
            "strict-origin-when-cross-origin";

        frame.setAttribute(
            "allow",
            "autoplay; fullscreen; picture-in-picture"
        );

        videoStage.appendChild(frame);

        playbackStatus.textContent =
            "Drive player ready. Press Play inside the video.";

    } else {
        /* ---------- GITHUB MP4 PLAYER ---------- */

        activeVideoType = "github";
        videoPlayer.hidden = false;

        videoPlayer.src = githubUrl;

        videoPlayer.playbackRate =
            Number(playbackSpeed.value) || 1;

        videoPlayer.load();

        playbackStatus.textContent = "Loading video...";

        // Attempt autoplay; some browsers require a user action.
        const playPromise = videoPlayer.play();

        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                if (!playerModal.hidden && activeVideoType === "github") {
                    playbackStatus.textContent =
                        "Press Play to start the video.";
                }
            });
        }
    }

    closePlayerButton.focus();
}


/* =========================================
   CLOSE VIDEO PLAYER
========================================= */

function closePlayer() {
    if (playerModal.hidden) {
        return;
    }

    resetVideoPlayer();

    playerModal.hidden = true;
    document.body.classList.remove("player-open");

    playerError = false;
    lastStatus = "Ready to play";

    if (
        lastFocusedElement &&
        document.contains(lastFocusedElement)
    ) {
        lastFocusedElement.focus();
    }

    lastFocusedElement = null;
}


/* =========================================
   PLAYBACK STATUS
========================================= */

function updatePlaybackStatus() {
    if (playerModal.hidden || activeVideoType !== "github") {
        return;
    }

    if (playerError) {
        playbackStatus.textContent =
            "Video could not be played. Check its path and format.";

    } else if (videoPlayer.ended) {
        playbackStatus.textContent = "Playback finished";

    } else if (videoPlayer.paused) {
        playbackStatus.textContent =
            videoPlayer.currentTime > 0
                ? "Paused"
                : lastStatus;

    } else {
        playbackStatus.textContent = "Now playing";
    }
}


/* =========================================
   FULLSCREEN
========================================= */

async function toggleFullscreen() {
    if (playerModal.hidden) {
        return;
    }

    const frame = videoStage.querySelector(".drive-player");

    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
            return;
        }

        if (frame && frame.requestFullscreen) {
            await frame.requestFullscreen();
            return;
        }

        if (videoStage.requestFullscreen) {
            await videoStage.requestFullscreen();
            return;
        }

        if (videoPlayer.webkitEnterFullscreen) {
            videoPlayer.webkitEnterFullscreen();
            return;
        }

        showToast("Fullscreen is not supported by this browser.");

    } catch (error) {
        showToast(
            "Use the fullscreen button inside the video player if available."
        );
    }
}


/* =========================================
   TV REMOTE NAVIGATION
========================================= */

function getFocusableElements() {
    const selector = [
        "a[href]",
        "button:not(:disabled)",
        "input:not(:disabled)",
        "select:not(:disabled)",
        "textarea:not(:disabled)",
        '[tabindex]:not([tabindex="-1"])'
    ].join(",");

    return Array.from(
        document.querySelectorAll(selector)
    ).filter(element => {
        return (
            element.getClientRects().length > 0 &&
            !element.closest("[hidden]") &&
            !element.closest("[inert]") &&
            element.getAttribute("aria-hidden") !== "true"
        );
    });
}


function moveFocus(direction) {
    const candidates = getFocusableElements().filter(
        element => element !== document.activeElement
    );

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


/* =========================================
   EVENT LISTENERS
========================================= */

searchInput.addEventListener("input", renderLibrary);

closePlayerButton.addEventListener("click", closePlayer);

fullscreenButton.addEventListener("click", toggleFullscreen);


/* ---------- PLAYBACK SPEED ---------- 
