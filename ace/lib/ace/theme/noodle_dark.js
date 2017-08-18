//Created by Ross Hunter Copyright (c) 2017

define(function(require, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-noodle_dark";
exports.cssText = require("../requirejs/text!./noodle_dark.css");

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
