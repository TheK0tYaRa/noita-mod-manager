var fs = require('fs');
var fsp = require('fs/promises');
var path = require('path');

async function getSubfolders(dir) {
    return await fsp.readdir(dir);
}

function parallelWalk(dir, fn) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return fn(err);
        parallelWalkHelper(dir, fn, list, results);
    });
};

function parallelWalkHelper(dir, fn, list, results) {
    var pending = list.length;
    if (!pending) return fn(null, results);
    list.forEach(fi => {
        fi = path.resolve(dir, fi);
        if (fi.indexOf(dir) !== 0) {
            console.warn(`possible injection attempt ${fi}`);
        } else {
            fs.stat(fi, function (err, statRes) {
                if (statRes && statRes.isDirectory()) {
                    parallelWalk(fi, function (err, res) {
                        results = results.concat(res);
                        if (!--pending) fn(null, results);
                    });
                } else {
                    results.push(fi);
                    if (!--pending) fn(null, results);
                }
            });
        }
    });
}

function serialWalk(dir, fn) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return fn(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) return fn(null, results);
            file = path.resolve(dir, file);
            if (file.indexOf(dir) !== 0) {
                console.warn("possible injection attempt");
            } else {
                fs.stat(file, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        serialWalk(file, function (err, res) {
                            results = results.concat(res);
                            next();
                        });
                    } else {
                        results.push(file);
                        next();
                    }
                });
            }
        })();
    });
};

module.exports = {
    "serialWalk": serialWalk,
    "parallelWalk": parallelWalk,
    "getSubfolders": getSubfolders
}