/*
Title: salutation.js (home)
Author: R. Hurtado
Date: 09/26/2026
Description:
Behavior of the greeting of the home page.
- Movement of the names in salutation ("Hola <name> ♡").
*/

//---------------------------------------------------------------------
// FUNCTIONS

/*homeNextSalutation
Function responsible for changing the actual salutation every few seconds*/
function homeNextSalutation(){
    homeSalutationText.classList.remove("show");
    homeSalutationText.classList.add("hide");

    setTimeout(()=>{
        homeCurrentSalutation =
            (homeCurrentSalutation + 1) % homeSalutations.length;
        homeSalutationText.textContent =
            homeSalutations[homeCurrentSalutation];
        homeSalutationText.classList.remove("hide");
        homeSalutationText.classList.add("show");
    },350);
}


//---------------------------------------------------------------------
//VARIABLES DECLARATION

const homeSalutations = [
    "Hermosa",
    "Preciosa",
    "Belleza",
    "Mi Princesa",
    "Mi Reina",
    "Mi Nico"
];

const homeSalutationText = document.getElementById("salutationText");
let homeCurrentSalutation = 0;


//---------------------------------------------------------------------
//REACTIONS TO EVENTS

/*Saluation animations*/

homeSalutationText.classList.add("show");
setInterval(homeNextSalutation,1800);
