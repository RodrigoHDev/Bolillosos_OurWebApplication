/*
Title: storage.js
Author: R. Hurtado
Date: 09/26/2026
Description:
Functions to store and remove files in Supabase Storage.
Bucket used: images (public).
- Category images: stored at the root of the bucket. The public URL is stored
  in public.category.image
- Home photo: stored in the folder home/. The newest file is the one shown.
*/

const path = require('path');
const supabase = require('./supabase');

// Centralize the bucket so you only have to change it in one place
const IMAGES_BUCKET = 'images';
const HOME_PHOTO_FOLDER = 'home';


/* AUXILIAR FUNCTIONS */

/*buildFileName
Auxiliar function that creates a unique file name keeping the extension*/

function buildFileName(file) {
    const extension = path.extname(file.originalname).toLowerCase() || `.${file.mimetype.split('/')[1]}`;
    return `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;
}

/*uploadFile
Auxiliar function that uploads a file received by multer and returns the
stored path and its public URL*/

async function uploadFile(filePath, file) {
    const { error } = await supabase.storage
        .from(IMAGES_BUCKET)
        .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (error) {
        throw new Error(error.message || 'Supabase could not upload the image.');
    }

    const { data } = supabase.storage
        .from(IMAGES_BUCKET)
        .getPublicUrl(filePath);

    return { filePath, publicUrl: data.publicUrl };
}

/*listHomePhotos
Auxiliar function that returns the files of the home folder, newest first.
Supabase adds a placeholder file to empty folders, it is ignored.*/

async function listHomePhotos() {
    const { data, error } = await supabase.storage
        .from(IMAGES_BUCKET)
        .list(HOME_PHOTO_FOLDER, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
        throw new Error(error.message || 'Supabase could not list the home photos.');
    }

    return data.filter(item => item.id && item.name !== '.emptyFolderPlaceholder');
}


//------------------------------------------------------
/*uploadCategoryImage
Function that uploads the image received by multer (request.file) and returns
the stored path and its public URL*/

const uploadCategoryImage = async function uploadCategoryImage(file) {
    return uploadFile(buildFileName(file), file);
};

//------------------------------------------------------
/*removeCategoryImage
Function that removes an uploaded image (used when the insert fails)*/

const removeCategoryImage = async function removeCategoryImage(filePath) {
    const { error } = await supabase.storage
        .from(IMAGES_BUCKET)
        .remove([filePath]);

    if (error) {
        console.error(error);
    }
};

//------------------------------------------------------
/*getHomePhotoUrl
Function that returns the public URL of the current home photo, or null if
no photo has been uploaded yet*/

const getHomePhotoUrl = async function getHomePhotoUrl() {
    const photos = await listHomePhotos();

    if (photos.length === 0) {
        return null;
    }

    const { data } = supabase.storage
        .from(IMAGES_BUCKET)
        .getPublicUrl(`${HOME_PHOTO_FOLDER}/${photos[0].name}`);

    return data.publicUrl;
};

//------------------------------------------------------
/*uploadHomePhoto
Function that uploads a new home photo and removes the previous ones.
Every photo has a new name, so the browser never shows a cached old photo.*/

const uploadHomePhoto = async function uploadHomePhoto(file) {
    const stored = await uploadFile(`${HOME_PHOTO_FOLDER}/${buildFileName(file)}`, file);

    //Removal of the previous photos. If it fails, the newest is still the one shown.
    try {
        const previousPhotos = (await listHomePhotos())
            .map(item => `${HOME_PHOTO_FOLDER}/${item.name}`)
            .filter(filePath => filePath !== stored.filePath);

        if (previousPhotos.length > 0) {
            const { error } = await supabase.storage
                .from(IMAGES_BUCKET)
                .remove(previousPhotos);

            if (error) {
                console.error(error);
            }
        }
    } catch (error) {
        console.error(error);
    }

    return stored;
};

module.exports = {
    uploadCategoryImage,
    removeCategoryImage,
    getHomePhotoUrl,
    uploadHomePhoto,
};
