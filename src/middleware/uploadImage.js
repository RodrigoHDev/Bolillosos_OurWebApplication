/*
Title: uploadImage.js
Author: R. Hurtado
Date: 09/26/2026
Description:
Middleware that receives a single image from a multipart form (field "image")
and keeps it in memory (request.file.buffer) so it can be uploaded to
Supabase Storage. Upload errors are answered as JSON for the AJAX forms.
*/

const multer = require('multer');

//Maximum size of the image: 5 MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE },
    fileFilter: (request, file, callback) => {
        //Only images are accepted
        if (!file.mimetype.startsWith('image/')) {
            return callback(new Error('El archivo debe ser una imagen.'));
        }
        callback(null, true);
    }
}).single('image');

/*uploadImage
Runs multer and returns a JSON error in case the file is not valid*/

function uploadImage(request, response, next) {
    upload(request, response, (error) => {
        if (error) {
            const message = error.code === 'LIMIT_FILE_SIZE'
                ? 'La imagen no debe pesar más de 5 MB.'
                : error.message;
            return response.status(400).json({ success: false, error: message });
        }
        next();
    });
}

module.exports = uploadImage;
