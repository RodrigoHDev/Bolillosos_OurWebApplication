/*
Title: gallery.js
Author: R. Hurtado
Date: 09/26/2026
Description:
Gallery page behavior.
- "+ Nueva foto" and the "+" spaces of empty months open the new photo modal
  (the "+" spaces fill in their month). The labels of the dropdown are
  requested every time the modal opens (GET /gallery/labels).
- The photo is uploaded to the server (POST /gallery/photo) and the page opens
  the anniversary year of the new photo.
- Clicking a photo opens the viewer: arrows, keyboard (← → Esc) and swipe move
  through the photos of the loaded year.
*/

//---------------------------------------------------------------------
// FUNCTIONS

/*galleryShowError
Shows (or hides with an empty text) the message under the modal title*/
function galleryShowError(message) {
    newPhotoError.textContent = message || "";
    newPhotoError.hidden = !message;
}

/*gallerySetLabelOptions
Rebuilds the dropdown: "Sin etiqueta" first, then the given labels.
textContent is used because the names come from the database*/
function gallerySetLabelOptions(labels, firstText) {
    newPhotoLabel.replaceChildren();

    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = firstText || "Sin etiqueta";
    newPhotoLabel.appendChild(empty);

    labels.forEach(label => {
        const option = document.createElement("option");
        option.value = label.id;
        option.textContent = label.name;
        newPhotoLabel.appendChild(option);
    });
}

/*galleryLoadLabels
Requests the labels and fills the dropdown. Only the answer of the latest
request is used (the modal can be opened again before it arrives)*/
async function galleryLoadLabels() {
    const request = ++galleryLabelsRequest;

    gallerySetLabelOptions([], "Cargando etiquetas...");
    newPhotoLabel.disabled = true;

    try {
        const response = await fetch("/gallery/labels", { headers: { "Accept": "application/json" } });
        const data = await galleryReadJsonResponse(response);

        if (request !== galleryLabelsRequest) return;

        if (!response.ok || !data.success) {
            throw new Error(data.error || "No se pudieron cargar las etiquetas. Recarga la página e intenta de nuevo.");
        }

        gallerySetLabelOptions(data.labels);

    } catch (error) {
        if (request !== galleryLabelsRequest) return;
        gallerySetLabelOptions([]);
        galleryShowError(error.message);
    } finally {
        if (request === galleryLabelsRequest) newPhotoLabel.disabled = false;
    }
}

/*galleryOpenNewPhotoModal
Opens the modal. monthValue ("YYYY-MM") fills in the date when given*/
function galleryOpenNewPhotoModal(monthValue) {
    newPhotoForm.reset();
    galleryShowError("");
    if (monthValue) newPhotoDate.value = monthValue;
    newPhotoModal.classList.add("active");
    newPhotoDate.focus();
    galleryLoadLabels();
}

function galleryCloseNewPhotoModal() {
    if (galleryUploading) return;
    newPhotoModal.classList.remove("active");
}

/*galleryReadJsonResponse
Reads the JSON answer of the server. If the session or the form expired the
server answers with a redirect (HTML), so an empty object is returned*/
async function galleryReadJsonResponse(response) {
    try {
        return await response.json();
    } catch (error) {
        return {};
    }
}

/*galleryCreatePhoto
Sends the photo. multer reads the multipart body AFTER csurf, so the token
travels in the CSRF-Token header*/
async function galleryCreatePhoto(event) {
    event.preventDefault();

    const file = newPhotoImage.files[0];

    if (!/^\d{4}-\d{2}$/.test(newPhotoDate.value)) {
        return galleryShowError("El mes y año son requeridos.");
    }
    if (!file) {
        return galleryShowError("La foto es requerida.");
    }
    if (!file.type.startsWith("image/")) {
        return galleryShowError("El archivo debe ser una imagen.");
    }
    if (file.size > GALLERY_MAX_PHOTO_SIZE) {
        return galleryShowError("La imagen no debe pesar más de 5 MB.");
    }

    galleryShowError("");
    galleryUploading = true;
    btnCreatePhoto.disabled = true;
    btnCreatePhoto.textContent = "Subiendo...";

    try {
        const response = await fetch(newPhotoForm.action, {
            method: "POST",
            headers: { "CSRF-Token": newPhotoForm.querySelector('[name="_csrf"]').value },
            body: new FormData(newPhotoForm)
        });
        const data = await galleryReadJsonResponse(response);

        if (!response.ok || !data.success) {
            throw new Error(data.error || "No se pudo guardar la foto. Recarga la página e intenta de nuevo.");
        }

        // The "Nueva foto agregada" toast shows on the year of the new photo
        window.location.href = `/gallery?year=${data.anniversaryYear}`;

    } catch (error) {
        galleryShowError(error.message);
        galleryUploading = false;
        btnCreatePhoto.disabled = false;
        btnCreatePhoto.textContent = "Crear";
    }
}

/*galleryShowViewerPhoto
Places the photo of the given index (wraps around) in the viewer*/
function galleryShowViewerPhoto(index) {
    const total = window.galleryPhotos.length;
    galleryViewerIndex = (index + total) % total;

    const photo = window.galleryPhotos[galleryViewerIndex];

    galleryViewerImg.src = photo.url;
    galleryViewerImg.alt = photo.description || photo.dateLabel;
    galleryViewerImg.className = "gallery-viewer-img" + (photo.labelCode ? ` gallery-viewer-img--${photo.labelCode}` : "");

    galleryViewerDate.textContent = photo.dateLabel;

    galleryViewerLabel.textContent = photo.labelName;
    galleryViewerLabel.className = "gallery-label" + (photo.labelCode ? ` gallery-label--${photo.labelCode}` : "");
    galleryViewerLabel.hidden = !photo.labelName;

    galleryViewerDesc.textContent = photo.description;
    galleryViewerDesc.hidden = !photo.description;
}

function galleryOpenViewer(index) {
    galleryLastFocus = document.activeElement;
    galleryShowViewerPhoto(index);

    const single = window.galleryPhotos.length < 2;
    galleryViewerPrev.hidden = single;
    galleryViewerNext.hidden = single;

    galleryViewer.hidden = false;
    document.body.style.overflow = "hidden";
    galleryViewerClose.focus();
}

function galleryCloseViewer() {
    galleryViewer.hidden = true;
    galleryViewerImg.removeAttribute("src");
    document.body.style.overflow = "";
    if (galleryLastFocus) galleryLastFocus.focus();
}

function galleryStep(delta) {
    if (window.galleryPhotos.length < 2) return;
    galleryShowViewerPhoto(galleryViewerIndex + delta);
}


//---------------------------------------------------------------------
//VARIABLES DECLARATION

// Same limit as the server (middleware uploadImage)
const GALLERY_MAX_PHOTO_SIZE = 5 * 1024 * 1024;

// Minimum horizontal distance (px) of a swipe in the viewer
const GALLERY_SWIPE_DISTANCE = 50;

const btnNewPhoto = document.getElementById("btnNewPhoto");
const newPhotoModal = document.getElementById("newPhotoModal");
const closeNewPhotoModal = document.getElementById("closeNewPhotoModal");
const newPhotoForm = document.getElementById("newPhotoForm");
const newPhotoDate = document.getElementById("newPhotoDate");
const newPhotoLabel = document.getElementById("newPhotoLabel");
const newPhotoImage = document.getElementById("newPhotoImage");
const newPhotoError = document.getElementById("newPhotoError");
const btnCreatePhoto = document.getElementById("btnCreatePhoto");

const galleryViewer = document.getElementById("galleryViewer");
const galleryViewerImg = document.getElementById("galleryViewerImg");
const galleryViewerDate = document.getElementById("galleryViewerDate");
const galleryViewerLabel = document.getElementById("galleryViewerLabel");
const galleryViewerDesc = document.getElementById("galleryViewerDesc");
const galleryViewerClose = document.getElementById("galleryViewerClose");
const galleryViewerPrev = document.getElementById("galleryViewerPrev");
const galleryViewerNext = document.getElementById("galleryViewerNext");

let galleryUploading = false;
let galleryLabelsRequest = 0;
let galleryViewerIndex = 0;
let galleryLastFocus = null;
let galleryTouchStartX = null;


//---------------------------------------------------------------------
//REACTIONS TO EVENTS

btnNewPhoto.addEventListener("click", () => galleryOpenNewPhotoModal());
closeNewPhotoModal.addEventListener("click", galleryCloseNewPhotoModal);
newPhotoModal.addEventListener("click", (e) => {
    if (e.target === newPhotoModal) galleryCloseNewPhotoModal();
});
newPhotoForm.addEventListener("submit", galleryCreatePhoto);

// Photos and "+" spaces (one listener for the whole page)
document.querySelector(".gallery-body").addEventListener("click", (e) => {
    const photo = e.target.closest("[data-photo-index]");
    if (photo) return galleryOpenViewer(Number(photo.dataset.photoIndex));

    const addSpace = e.target.closest("[data-add-month]");
    if (addSpace) galleryOpenNewPhotoModal(addSpace.dataset.addMonth);
});

galleryViewerClose.addEventListener("click", galleryCloseViewer);
galleryViewerPrev.addEventListener("click", () => galleryStep(-1));
galleryViewerNext.addEventListener("click", () => galleryStep(1));

// Clicking the dark background closes the viewer
galleryViewer.addEventListener("click", (e) => {
    if (e.target === galleryViewer) galleryCloseViewer();
});

galleryViewer.addEventListener("touchstart", (e) => {
    galleryTouchStartX = e.touches[0].clientX;
}, { passive: true });

galleryViewer.addEventListener("touchend", (e) => {
    if (galleryTouchStartX === null) return;
    const distance = e.changedTouches[0].clientX - galleryTouchStartX;
    galleryTouchStartX = null;
    if (Math.abs(distance) >= GALLERY_SWIPE_DISTANCE) galleryStep(distance < 0 ? 1 : -1);
});

document.addEventListener("keydown", (e) => {
    if (!galleryViewer.hidden) {
        if (e.key === "Escape") galleryCloseViewer();
        else if (e.key === "ArrowLeft") galleryStep(-1);
        else if (e.key === "ArrowRight") galleryStep(1);
        return;
    }
    if (e.key === "Escape" && newPhotoModal.classList.contains("active")) galleryCloseNewPhotoModal();
});
