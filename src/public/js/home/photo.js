/*
Title: photo.js (home)
Author: R. Hurtado
Date: 09/26/2026
Description:
Anniversary photo of the home page.
- Without photo: clicking the empty space opens the file picker.
- With photo: the semi-transparent button (bottom right) changes it.
The photo is uploaded to the server (POST /home/photo) and shown once stored.
*/

//---------------------------------------------------------------------
// FUNCTIONS

/*homeOpenPhotoPicker
Opens the file picker of the device*/
function homeOpenPhotoPicker() {
    if (homePhotoUploading) return;
    homePhotoInput.value = "";
    homePhotoInput.click();
}

/*homeShowPhotoError
Shows (or hides with an empty text) the message under the photo*/
function homeShowPhotoError(message) {
    homePhotoError.textContent = message || "";
    homePhotoError.hidden = !message;
}

/*homeShowPhoto
Places the stored photo and swaps the empty state for the change button*/
function homeShowPhoto(url) {
    homePhotoImg.src = url;
    homePhotoImg.hidden = false;
    homePhotoChange.hidden = false;
    homePhotoAdd.hidden = true;
}

/*homeReadJsonResponse
Reads the JSON answer of the server. If the session or the form expired the
server answers with a redirect (HTML), so an empty object is returned*/
async function homeReadJsonResponse(response) {
    try {
        return await response.json();
    } catch (error) {
        return {};
    }
}

/*homeUploadPhoto
Sends the chosen photo. multer reads the multipart body AFTER csurf, so the
token travels in the CSRF-Token header*/
async function homeUploadPhoto() {
    const file = homePhotoInput.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        return homeShowPhotoError("El archivo debe ser una imagen.");
    }
    if (file.size > HOME_MAX_PHOTO_SIZE) {
        return homeShowPhotoError("La imagen no debe pesar más de 5 MB.");
    }

    const formData = new FormData();
    formData.append("image", file);

    homeShowPhotoError("");
    homePhotoUploading = true;
    homePhotoLoading.hidden = false;

    try {
        const response = await fetch("/home/photo", {
            method: "POST",
            headers: { "CSRF-Token": homePhoto.dataset.csrf },
            body: formData
        });
        const data = await homeReadJsonResponse(response);

        if (!response.ok || !data.success) {
            throw new Error(data.error || "No se pudo guardar la foto. Recarga la página e intenta de nuevo.");
        }

        homeShowPhoto(data.photoUrl);

    } catch (error) {
        homeShowPhotoError(error.message);
    } finally {
        homePhotoUploading = false;
        homePhotoLoading.hidden = true;
    }
}


//---------------------------------------------------------------------
//VARIABLES DECLARATION

// Same limit as the server (middleware uploadImage)
const HOME_MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const homePhoto = document.getElementById("homePhoto");
const homePhotoAdd = document.getElementById("homePhotoAdd");
const homePhotoImg = document.getElementById("homePhotoImg");
const homePhotoChange = document.getElementById("homePhotoChange");
const homePhotoLoading = document.getElementById("homePhotoLoading");
const homePhotoInput = document.getElementById("homePhotoInput");
const homePhotoError = document.getElementById("homePhotoError");

let homePhotoUploading = false;


//---------------------------------------------------------------------
//REACTIONS TO EVENTS

homePhotoAdd.addEventListener("click", homeOpenPhotoPicker);
homePhotoChange.addEventListener("click", homeOpenPhotoPicker);
homePhotoInput.addEventListener("change", homeUploadPhoto);
