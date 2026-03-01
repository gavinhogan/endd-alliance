const fs = require("fs");
const path = require("path");

module.exports = function () {
    const versionPath = path.resolve(__dirname, "../../VERSION");
    try {
        return fs.readFileSync(versionPath, "utf8").trim();
    } catch (e) {
        return "1.0.0";
    }
};
