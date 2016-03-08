require("shelljs/make")

var archiver = require("archiver");
var fs = require("fs");
var path = require("path");

var WIDGETNAME = "CameraWidgetForPhoneGap";

target.all = function() {
    target.mpk();
};

target.mpk = function() {
    var zipStream = fs.createWriteStream(path.join("dist", WIDGETNAME + ".mpk"));
    var archive = archiver("zip", {});

    zipStream.on("close", function() {
        console.log("Written %d bytes to %s", archive.pointer(), zipStream.path);
    });

    zipStream.on("error", function(e) {
        console.error("Error: %s", err.toString());
    });

    archive.pipe(zipStream);

    archive
        .glob("**", {
            cwd: "src",
            ignore: "**/*.swp"
        })
        .finalize();
};
