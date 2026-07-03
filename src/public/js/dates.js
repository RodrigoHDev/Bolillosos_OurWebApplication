const yesButton = document.getElementById("btnYes");
const noButton = document.getElementById("btnNo");
const modal = document.getElementById("yesModal");
const closeModal = document.getElementById("closeModal");



yesButton.addEventListener("click",()=>{
    modal.classList.add("active");
});

//-------------------------------------------------------------------
/*Abrir y cerrar el modal*/

closeModal.addEventListener("click",()=>{
    //Add here the movement to another page.
    modal.classList.remove("active");
});

modal.addEventListener("click",(e)=>{
    if(e.target===modal){
        modal.classList.remove("active");
    }
});


//-------------------------------------------------------------------
/*Movement of the No button in case the mouse gets closer or clicks it*/

function moveNoButton(){
    const btnWidth = noButton.offsetWidth;
    const btnHeight = noButton.offsetHeight;

    const maxX = document.documentElement.clientWidth - btnWidth;
    const maxY = document.documentElement.clientHeight - btnHeight;
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;

    noButton.style.position = "fixed";
    noButton.style.width = btnWidth + "px";
    noButton.style.height = btnHeight + "px";
    noButton.style.left = x + "px";
    noButton.style.top = y + "px";
}

document.addEventListener("mousemove",(event)=>{
    const rect=noButton.getBoundingClientRect();

    const centerX=rect.left+rect.width/2;
    const centerY=rect.top+rect.height/2;

    const distance=Math.hypot(
        event.clientX-centerX,
        event.clientY-centerY
    );

    if(distance<140){
        moveNoButton();
    }
});

noButton.addEventListener("click",(e)=>{
    e.preventDefault();
    moveNoButton();
});

noButton.addEventListener("touchstart",(e)=>{
    e.preventDefault();
    moveNoButton();
});

//---------------------------------------------------------
/*Saluation animations*/

const salutations = [
    "Hermosa",
    "Preciosa",
    "Belleza",
    "Mi Princesa",
    "Mi Reina",
    "Mi Nico"
];

const salutationText = document.getElementById("salutationText");
let currentSalutation = 0;

function nextSalutation(){
    salutationText.classList.remove("show");
    salutationText.classList.add("hide");

    setTimeout(()=>{
        currentSalutation =
            (currentSalutation + 1) % salutations.length;
        salutationText.textContent =
            salutations[currentSalutation];
        salutationText.classList.remove("hide");
        salutationText.classList.add("show");
    },350);
}

salutationText.classList.add("show");
setInterval(nextSalutation,1800);

//---------------------------------------------------------
/*Modificacion de movimiento y creacion de carrusel en dates*/

document.addEventListener("DOMContentLoaded", () => {
    const track = document.getElementById("carouselTrack");
    const dotsContainer = document.getElementById("carouselDots");
    const slides = Array.from(track.children);
    const groupSize = 3;
    const totalGroups = Math.ceil(slides.length / groupSize);
    let currentGroup = 0;

    for (let i = 0; i < totalGroups; i++) {
        const dot = document.createElement("span");
        dot.className = "carousel-dot" + (i === 0 ? " active" : "");
        dot.addEventListener("click", () => goToGroup(i));
        dotsContainer.appendChild(dot);
    }

    function goToGroup(index){
        currentGroup = (index + totalGroups) % totalGroups;
        track.style.transform = `translateX(-${currentGroup * 100}%)`;

        dotsContainer.querySelectorAll(".carousel-dot").forEach((dot, i) => {
            dot.classList.toggle("active", i === currentGroup);
        });
    }

    setInterval(() => goToGroup(currentGroup + 1), 4000);
});