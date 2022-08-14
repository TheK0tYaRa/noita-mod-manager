"use strict";

// on mouse down
/**
 * copy the row to the hand
 * make a phantom row to hold where the held row should go
 *      This phantom row should still take space
 *      and signal to the user that the held row will land there.
 */
// mouse move
/**
 * if closest row is not held row // do some math to find index in table?
 *      "swap" closest row with phantom row
 */
// on mouse up
/**
 * set phantom row to held row
 * delete hand contents
 */

function bindMouse() {
    const modTable = document.getElementById("mod-table");
    const swappedBackgroundColor = "#555555";
    let refScreenY = null;
    let refRow = null;
    let refColor = null;

    let minimumYDistanceToDrag = 24;
    let multiplyDragSpeedEvery = 4;

    document.addEventListener("drag", e => {
        if (refScreenY != null && e.buttons != 0) {
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
    document.addEventListener("dragstart", e => {
        // copy held row
        refScreenY = e.screenY;
        refRow = getClosestRowInTableBody(modTable, e.clientY);
        refRow.childNodes.forEach(td => {
            refColor = td.style.backgroundColor;
            td.style.backgroundColor = swappedBackgroundColor;
        });

    });
    document.addEventListener("dragenter", e => {
        // insert target row
        let closestRow = getClosestRowInTableBody(modTable, e.clientY);
        if (closestRow != null && refRow.getAttribute("modid") !== closestRow.getAttribute("modid")) {
            let rect = closestRow.getBoundingClientRect();
            refRow = modTable.removeChild(refRow);
            var nextSibling = closestRow.nextSibling;
            if (e.clientY - rect.y < rect.height / 2) { // insert before
                modTable.insertBefore(refRow, closestRow);
            } else { // insert after
                modTable.insertBefore(refRow, nextSibling);
            }
        }
    }, true);
    document.addEventListener("dragend", e => {
        // stop dragging
        refRow.childNodes.forEach(td => {
            td.style.backgroundColor = refColor;
        });
        refScreenY = null;
        refColor = null;
        refRow = null;
    });

    document.addEventListener("selectstart", e => {
        e.preventDefault();
        // window.getSelection().removeAllRanges();
        // document.dispatchEvent("dragstart")
    })
}

function dragTimeStepElapsed(timeFirst, timeStep) {
    return timeFirst && new Date().getTime - timeFirst > timeStep;
}

function dragScollOnRange(e, ranges) {
    let y = e.clientY;
    for (let range of ranges) {
        let to = range.to * window.innerHeight;
        let from = range.from * window.innerHeight;
        if (y >= from && y < to) {
            range.call(e);
            break;
        }
    }
}

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

function isDirectChildOf(parent, child) {
    return indexOfChild(parent, child) > -1;
}

function indexOfChild(parent, child) {
    let nodes = parent.childNodes;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i] === child) return i;
    }
    return -1;
}

bindMouse();