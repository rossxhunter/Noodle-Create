define(function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-noodle";
exports.cssText = require("../requirejs/text!./noodle.css");

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
