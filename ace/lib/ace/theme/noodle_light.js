define(function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-noodle_light";
exports.cssText = require("../requirejs/text!./noodle_light.css");

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
