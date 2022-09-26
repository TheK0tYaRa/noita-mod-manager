"use strict";

(function () {
    // theme handler
    const button = document.getElementById("toggle-dark-mode");
    const imgOpen = document.createElement("img");
    imgOpen.src = "./resources/brightness-high.svg";
    const imgClosed = document.createElement("img");
    imgClosed.src = "./resources/brightness-high-fill.svg";

    // starts set to imgOpen
    let nextImage = imgOpen;

    document.getElementById("toggle-dark-mode").addEventListener("click", _e => {
        window.darkMode.toggle();
        nextImage = (nextImage === imgOpen) ? imgClosed : imgOpen;
        button.removeChild(button.firstChild);
        button.appendChild(nextImage);
    });
})();