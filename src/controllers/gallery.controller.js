/*
Title: gallery.controller.js
Author: R. Hurtado
Date: 09/26/2026
Description:
Controller of the gallery page. Photos are grouped by anniversary year
(October → September) and, inside it, by month.
Only one anniversary year is loaded per request (?year=N).
The current file joins the traditional controller + model
functions as the database calls (Supabase) are performed here.
*/

//Import of used resources.
const supabase = require('../utils/webServices/supabase/supabase');
const { uploadGalleryImage, removeGalleryImage, getImageUrl } = require("../utils/webServices/supabase/storage");


/* CONSTANTS */

//The relationship started on September 30th, 2025 (Mexico City)
const START_YEAR = 2025;
const START_MONTH = 9;

//Anniversary years run from October to September
const FIRST_MONTH_OF_YEAR = 10;

const TIME_ZONE = 'America/Mexico_City';

//Maximum length of the optional description
const MAX_DESCRIPTION_LENGTH = 120;

const ORDINALS = ['1er', '2do', '3er', '4to', '5to', '6to', '7mo', '8vo', '9no', '10mo'];


/* AUXILIAR FUNCTIONS */

/*toMonthIndex
Auxiliar function that turns a year and month into a single comparable number*/

function toMonthIndex(year, month) {
    return year * 12 + (month - 1);
}

/*toMonthValue
Auxiliar function that returns the "YYYY-MM" value used by <input type="month">*/

function toMonthValue(year, month) {
    return `${year}-${String(month).padStart(2, '0')}`;
}

/*getAnniversaryYear
Auxiliar function that returns the anniversary year of a month.
Same formula as the generated column public.gallery.anniversary_year
(September 2025 folds into the 1st year)*/

function getAnniversaryYear(year, month) {
    return Math.max(1, (year - START_YEAR) + (month >= FIRST_MONTH_OF_YEAR ? 1 : 0));
}

/*getCurrentMonth
Auxiliar function that returns the current year and month in Mexico City*/

function getCurrentMonth() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: 'numeric'
    }).formatToParts(new Date());

    return {
        year: Number(parts.find(part => part.type === 'year').value),
        month: Number(parts.find(part => part.type === 'month').value)
    };
}

/*getAnniversaryMonths
Auxiliar function that lists the months of an anniversary year, newest first.
The 1st year also starts with September 2025. Months after the current one
are left out*/

function getAnniversaryMonths(anniversaryYear, current) {
    const first = anniversaryYear === 1
        ? toMonthIndex(START_YEAR, START_MONTH)
        : toMonthIndex(START_YEAR + anniversaryYear - 1, FIRST_MONTH_OF_YEAR);
    const last = Math.min(
        toMonthIndex(START_YEAR + anniversaryYear, FIRST_MONTH_OF_YEAR - 1),
        toMonthIndex(current.year, current.month)
    );

    const months = [];
    for (let index = last; index >= first; index--) {
        months.push({ year: Math.floor(index / 12), month: (index % 12) + 1 });
    }
    return months;
}

/*getOrdinal
Auxiliar function that returns the Spanish ordinal of an anniversary year*/

function getOrdinal(number) {
    return ORDINALS[number - 1] || `${number}º`;
}

/*parseMonthInput
Auxiliar function that validates a "YYYY-MM" value between September 2025
and the current month. Returns { year, month } or null*/

function parseMonthInput(value, current) {
    const match = /^(\d{4})-(\d{2})$/.exec(String(value || '').trim());
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) return null;

    const index = toMonthIndex(year, month);
    if (index < toMonthIndex(START_YEAR, START_MONTH) || index > toMonthIndex(current.year, current.month)) {
        return null;
    }

    return { year, month };
}


//------------------------------------------------------

/*getGalleryPage
Function responsible for rendering the gallery of one anniversary year.
Receives ?year=N (anniversary year); by default the current one*/

exports.getGalleryPage = async (request, response, next) => {
    const current = getCurrentMonth();
    const currentYear = getAnniversaryYear(current.year, current.month);

    //Invalid or missing years fall back to the current anniversary year
    const requested = Number.parseInt(request.query.year, 10);
    const anniversaryYear = requested >= 1 && requested <= currentYear ? requested : currentYear;

    //=========================
    /*Call and obtain the months and the photos of the year, newest first [Supabase]
    gallery.label_id → labels.id
    The labels of the modal are loaded apart (getLabels)*/
    const [monthsResult, photosResult] = await Promise.all([
        supabase.from('months').select('id, name').order('id'),
        supabase
            .from('gallery')
            .select('id, year, month_id, description, path_image, labels(name, code)')
            .eq('anniversary_year', anniversaryYear)
            .order('year', { ascending: false })
            .order('month_id', { ascending: false })
            .order('created_at', { ascending: false })
    ]);

    //Supabase Error Handling
    const loadError = monthsResult.error || photosResult.error;
    if (loadError) {
        console.error(loadError);
        response.locals.error = 'La galería no pudo ser cargada.';
    }
    //=========================

    const monthNames = new Map((monthsResult.data || []).map(month => [month.id, month.name]));
    const getMonthLabel = (year, month) => `${monthNames.get(month) || toMonthValue(year, month)} ${year}`;

    //Simplified object used by the view and the viewer
    const photos = (photosResult.data || []).map(row => ({
        id: row.id,
        year: row.year,
        month: row.month_id,
        url: getImageUrl(row.path_image),
        dateLabel: getMonthLabel(row.year, row.month_id),
        description: row.description || '',
        labelName: row.labels?.name || '',
        labelCode: row.labels?.code || ''
    }));

    //Aniversario photos take a full row at the top of the year
    const featured = photos.filter(photo => photo.labelCode === 'aniversario');

    const months = getAnniversaryMonths(anniversaryYear, current).map(({ year, month }) => ({
        value: toMonthValue(year, month),
        label: getMonthLabel(year, month),
        //Short version for the month marker on small screens (e.g. "Oct 2025")
        shortLabel: `${(monthNames.get(month) || String(month)).slice(0, 3)} ${year}`,
        photos: photos.filter(photo =>
            photo.labelCode !== 'aniversario' && photo.year === year && photo.month === month)
    }));

    //Order followed by the viewer (featured first, then month by month)
    const viewerPhotos = [...featured, ...months.flatMap(month => month.photos)];
    viewerPhotos.forEach((photo, index) => { photo.index = index; });

    //months is newest first, so the first month of the year is the last one
    const firstMonth = months[months.length - 1];
    const lastYearMonth = { year: START_YEAR + anniversaryYear, month: FIRST_MONTH_OF_YEAR - 1 };

    //Render of the gallery page
    response.render('pages/gallery', {
        title: 'Bolillosos ✦ Galería',
        anniversaryTitle: `${getOrdinal(anniversaryYear)} Aniversario`,
        rangeLabel: `${firstMonth ? firstMonth.label : ''} – ${getMonthLabel(lastYearMonth.year, lastYearMonth.month)}`,
        //null when that year does not exist (the button is shown disabled)
        previousYear: anniversaryYear > 1 ? anniversaryYear - 1 : null,
        nextYear: anniversaryYear < currentYear ? anniversaryYear + 1 : null,
        featured,
        months,
        viewerPhotos,
        minMonth: toMonthValue(START_YEAR, START_MONTH),
        maxMonth: toMonthValue(current.year, current.month),
        csrfToken: request.csrfToken()
    });
};

//------------------------------------------------------

/*getLabels
AJAX response with the labels of the new photo modal.
Called every time the modal is opened*/

exports.getLabels = async (request, response, next) => {
    //=========================
    /*Call and obtain the labels [Supabase]*/
    const { data: labels, error } = await supabase
        .from('labels')
        .select('id, name, code')
        .order('name', { ascending: true });

    //Supabase Error Handling
    if (error) {
        console.error(error);
        return response.status(500).json({ success: false, error: "Las etiquetas no pudieron ser cargadas." });
    }
    //=========================

    return response.status(200).json({ success: true, labels });
};

//------------------------------------------------------

/*createPhoto
AJAX response to add a photo to the gallery.
Receives the image in request.file (uploadImage middleware) and in the body:
date ("YYYY-MM"), labelId (optional) and description (optional)*/

exports.createPhoto = async (request, response, next) => {
    const image = request.file;
    const date = parseMonthInput(request.body.date, getCurrentMonth());
    const labelId = String(request.body.labelId || '').trim() || null;
    const description = String(request.body.description || '').trim().slice(0, MAX_DESCRIPTION_LENGTH) || null;

    //Validations
    if (!request.body.date) {
        return response.status(400).json({ success: false, error: "La fecha es requerida." });
    }
    if (!date) {
        return response.status(400).json({ success: false, error: "La fecha debe estar entre septiembre 2025 y este mes." });
    }
    if (!image) {
        return response.status(400).json({ success: false, error: "La imagen es requerida." });
    }

    //=========================
    /*Check the label exists [Supabase]*/
    if (labelId) {
        const { data: label, error: labelError } = await supabase
            .from('labels')
            .select('id')
            .eq('id', labelId)
            .maybeSingle();

        if (labelError || !label) {
            return response.status(400).json({ success: false, error: "La etiqueta no es válida." });
        }
    }
    //=========================

    //=========================
    /*Upload of the photo [Supabase Storage]*/
    let stored;

    try {
        stored = await uploadGalleryImage(image);
    } catch (error) {
        console.error(error);
        return response.status(500).json({ success: false, error: "La foto no pudo guardarse." });
    }
    //=========================

    //=========================
    /*Insert of the photo [Supabase]. If it fails the uploaded file is removed*/
    const { data: photo, error: insertError } = await supabase
        .from('gallery')
        .insert({
            created_by: request.session.user?.id || null,
            label_id: labelId,
            month_id: date.month,
            year: date.year,
            description,
            path_image: stored.filePath
        })
        .select('anniversary_year')
        .single();

    //Supabase Error Handling
    if (insertError) {
        console.error(insertError);
        await removeGalleryImage(stored.filePath);
        return response.status(500).json({ success: false, error: "La foto no pudo guardarse." });
    }
    //=========================

    request.session.success = 'Nueva foto agregada ♡';

    //Return AJAX response. The client opens the year of the new photo
    return response.status(201).json({ success: true, anniversaryYear: photo.anniversary_year });
};
