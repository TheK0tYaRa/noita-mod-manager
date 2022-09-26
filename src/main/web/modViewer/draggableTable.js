"use strict";

(function(tableElement) {
    const table = tableElement;
    const swappedBackgroundColor = "#555555";
    let refScreenY = null;
    let refRow = null;
    let refColor = null;

    let minimumYDistanceToDrag = 24;
    let multiplyDragSpeedEvery = 4;

    tableElement.addEventListener("dragstart", e => {
        // copy held row
        refScreenY = e.screenY;
        refRow = getClosestRowInTableBody(table, e.clientY);
        refRow.childNodes.forEach(td => {
            refColor = td.style.backgroundColor;
            td.style.backgroundColor = swappedBackgroundColor;
        });

    });

    tableElement.addEventListener("drag", e => {
        if (refScreenY != null && e.buttons != 0 && e.clientY < window.height - 1 && e.clientY > 1) {
            let difference = Math.abs(e.screenY - refScreenY);
            // determine direction relative to initial clientY
            let direction = e.screenY - refScreenY > 0 ? 1 : -1
            let multiplier = Math.floor((difference - minimumYDistanceToDrag) / multiplyDragSpeedEvery);
            window.scrollBy({
                top: direction * multiplier * 400,
                behavior: "smooth",
            });
        }
    });

    tableElement.addEventListener("dragenter", e => {
        // insert target row
        let closestRow = getClosestRowInTableBody(table, e.clientY);
        if (closestRow != null && refRow.getAttribute("modid") !== closestRow.getAttribute("modid")) {
            let rect = closestRow.getBoundingClientRect();
            refRow = table.removeChild(refRow);
            var nextSibling = closestRow.nextSibling;
            if (e.clientY - rect.y < rect.height / 2) { // insert before
                table.insertBefore(refRow, closestRow);
            } else { // insert after
                table.insertBefore(refRow, nextSibling);
            }
        }
    });

    tableElement.addEventListener("dragend", e => {
        try {
            // stop dragging
            refRow.childNodes.forEach(td => {
                td.style.backgroundColor = refColor;
            });

            // fire a custom event so others using this table might handle the change directly
            refRow.dispatchEvent(new Event("draggableTable:dragend", {bubbles: true, cancelable: true}));
            e.stopPropagation();

            refScreenY = null;
            refColor = null;
            refRow = null;
        } catch (err) {
            console.log(err);
        }
    });

    tableElement.addEventListener("selectstart", e => {
        // prevent highlighting descriptions, titles, etc
        // this blocks dragging unnecessarily.
        e.preventDefault();
    });
})(document.getElementById("mod-table"));

function getClosestRowInTableBody(modTable, yPos) {
    let closestChild = null;
    let closestValue = Number.MAX_VALUE;
    for (var child of modTable.childNodes) {
        let boundingBox = child.getBoundingClientRect();
        let distanceToMouseY = boundingBox.y + boundingBox.height - yPos;
        if (distanceToMouseY > 0 && Math.abs(distanceToMouseY) < closestValue) {
            closestValue = Math.abs(distanceToMouseY);
            closestChild = child;
        }
    }
    return closestChild;
}
