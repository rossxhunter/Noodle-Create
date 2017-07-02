define(function(require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var MyNewHighlightRules = function() {

        // regexp must not have capturing parentheses. Use (?:) instead.
        // regexps are ordered -> the first match is used

        var keywords = (
            "func|if|else|end|for|print"
        );

        var typeList = (
            "int|float|bool|char|string"
        );


        var keywordMapper = this.createKeywordMapper({
            //"variable.language": "this",
            "keyword.control": keywords,
            //"constant.language": buildinConstants,
            //"support.function": langClasses
            "support.type": typeList,
        }, "identifier");

        this.$rules = {
            "start" : [
                {
                    token : keywordMapper,
                    // TODO: Unicode escape sequences
                    // TODO: Unicode identifiers
                    regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
                },
                {
                    token: "string",
                    regex: '".*"' //
                },
                {
                    token: "string",
                    regex: "'.*'"
                },
                {
                    token: "constant.numeric",
                    regex: "-?[0-9]+"
                },
                {
                    token: "constant.language.boolean",
                    regex: "(?:true|false)"
                },
                {
                    token: "comment",
                    regex: "//.*"
                },
                {
                    token : "keyword.operator",
                    regex : "!|\\$|%|&|\\*|\\-\\-|\\-|\\+\\+|\\+|~|===|==|=|!=|!==|<=|>=|<<=|>>=|>>>=|<>|<|>|!|&&|\\|\\||\\?\\:|\\*=|%=|\\+=|\\-=|&=|\\^=|\\b(?:in|instanceof|new|delete|typeof|void)"
                }
            ]
        };
    };

    oop.inherits(MyNewHighlightRules, TextHighlightRules);

    exports.MyNewHighlightRules = MyNewHighlightRules;

});
