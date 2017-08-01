//Global variables

var equalityList = ["=", ">", "<"];

//Object constructors

function uninitialisedVariable(type, name, start, level, end) {
    this.type = type;
    this.name = name;
    this.start = start;
    this.level = level;
    this.end = end;
}

function codeBlock(type, line) {
    this.type = type;
    this.line = line;
}

function arg(type, name) {
    this.type = type;
    this.name = name;
}

function mainFunc(start, end) {
    this.start = start;
    this.end = end;
}

function func(name, type, start, end, args, returned) {
    this.name = name;
    this.type = type;
    this.start = start;
    this.end = end;
    this.args = args;
    this.returned = returned;
}

function struct(name, memberTypes, memberNames) {
    this.name = name;
    this.memberTypes = memberTypes;
    this.memberNames = memberNames;
}

//Helper functions

function addRedLine(line) {
    var Range = ace.require('ace/range').Range;
    if (currentMarker != null) {
        editor.session.removeMarker(currentMarker);
    }
    currentMarker = editor.session.addMarker(new Range(line - 1, 0, line - 1, 1), "syntaxError", "fullLine");
    $("#errorIndicator").attr("src", "assets/images/cross.png");
}

function unendedBlockError(blockStack) {
    for (var i = 0; i < blockStack.length; i++) {
        if (blockStack[i].type == "if") {
            addError("Unended if statement on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "else if") {
            addError("Unended else if statement on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "else") {
            addError("Unended else statement on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "for") {
            addError("Unended for loop on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "while") {
            addError("Unended while loop on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "do while") {
            addError("Unended do while loop on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "struct") {
            addError("Unended struct on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "define") {
            addError("Unended define on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "main") {
            addError("Unended main function on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        } else if (blockStack[i].type == "func") {
            addError("Unended function on line " + blockStack[i].line);
            addRedLine(blockStack[i].line);
            return;
        }
    }
}

function addError(error) {
    document.getElementById('noodleOutputBox').value += "ERROR: " + error + "\n";
}

function findFuncByLine(line) {
    for (var i = 0; i < funcList.length; i++) {
        if ((funcList[i].end == 0 || funcList[i].end > line) && funcList[i].start <= line) {
            return funcList[i];
        }
    }
}

function updateVarScope(lineNumber, isEnd) {
    for (var i = 0; i < uninitialisedVariables.length; i++) {
        if (uninitialisedVariables[i].level == currentLevel && uninitialisedVariables[i].end == 0) {
            uninitialisedVariables[i].end = lineNumber - 1;
            uninitialisedVariables.splice(i, 1);

        }
    }
    if (isEnd) {
        currentLevel -= 1;
    }
}

function getArgs(line) {
    var args = line;
    if (line.search(/func\s+[a-zA-Z_]/) != 0) {
        args = args.substr(line.indexOf(")"));
    }
    args = args.substr(args.indexOf("("));
    args = args.substr(1, args.length - 2);
    args = args.trim();
    args = args.split(/,/);
    if (args != "") {
        args = getArgsTypeAndName(args);
    } else {
        args = [];
    }
    return args;
}

function addArgsToVars(args, line) {
    for (var i = 0; i < args.length; i++) {
        uninitialisedVariables.push(new uninitialisedVariable(args[i].type, args[i].name, line, 1, 0));
    }
}

function getArgsTypeAndName(args) {
    var argsReturn = [];
    for (var i = 0; i < args.length; i++) {
        var singleArg = args[i].split(/\s/);
        singleArg = removeSpaces(singleArg);
        singleArg = removeBlankEntries(singleArg);
        argsReturn.push(new arg(singleArg[0], singleArg[1]));
    }
    return argsReturn;
}

function funcExists(name, args) {
    for (var i = 0; i < funcList.length; i++) {
        if (name == funcList[i].name && sameArgTypes(funcList[i].args, args)) {
            return true
        }
    }
    return false;
}

function sameArgTypes(oldFuncArgs, newFuncArgs) {
    if (oldFuncArgs.length != newFuncArgs.length) {
        return false;
    }
    for (var i = 0; i < oldFuncArgs.length; i++) {
        if (oldFuncArgs[i].type != newFuncArgs[i].type) {
            return false;
        }
    }
    return true;
}

function findFunc() {
    for (var i = 0; i < funcList.length; i++) {
        if (funcList[i].end == 0) {
            return funcList[i];
        }
    }
}

function findFuncByName(name, fs, lineNumber) {
    for (var i = 0; i < funcList.length; i++) {
        if (funcList[i].name == name) {
            var args = findFuncInVar(funcList[i].name, fs);
            if (getTypeOfArgs(args, funcList[i].args, lineNumber)) {
                return funcList[i];
            }
        }
    }
}

function isKeyword(name) {
    for (var i = 0; i < keywordList.length; i++) {
        if (name == keywordList[i]) {
            return true;
        }
    }
    return false;
}

function isValid(type, line) {
    switch (type) {
        case "print":
            return line.match(/^print\s+(".*"|[a-zA-Z_][a-zA-Z0-9_]*((\[.*\])?)?)|[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\s*$/) != null;
        case "printVar":
            return line.match(/^print\s+[a-zA-Z_][a-zA-Z0-9_]*((\[.*\])?)?|[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\s*$/) != null;
        case "var":
            return line.match(/^([a-zA-Z][a-zA-Z0-9_]*((\[.*\])?)?|[a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z][a-zA-Z0-9_]*)\s*=\s*.*$/) != null;
        case "if":
            return line.match(/^(if|else\s+if|else)\s*\(.+\)\s*$/) != null;
        case "for":
            return line.match(/^for\s*\(+\s*.*\s*\)+\s*$/) != null;
        case "while":
            return line.match(/^(do\s+)?while\s*\(.+\)\s*$/) != null;
        case "struct":
            return line.match(/^struct\s+[a-zA-Z_][a-zA-Z0-9_]*\s*$/) != null;
        case "member":
            return line.match(/^(int|float|string|char|bool)((\[.*\])?)?\s+[a-zA-Z_][a-zA-Z0-9_]*\s*$/) != null;
        case "func":
            var start = /^func\s*/;
            if (validTypes == undefined) {
                validTypes = /(int|float|string|char|bool|T)((\[\])?)?/;
            }
            var p1 = /\(\s*/;
            var p2 = /\s*\)/;
            var p3 = /\s+/;
            var returnType = new RegExp("(" + p1.source + validTypes.source + p2.source + ")?" + p3.source);
            var name = /[a-zA-Z_][a-zA-Z0-9_]*\s*/;
            var param = new RegExp(validTypes.source + /\s+[a-zA-Z_][a-zA-Z0-9_]*/.source);
            p1 = /\(\s*/;
            p2 = /\s*,\s*/;
            p3 = /\s*\)\s*$/;
            var paramList = new RegExp(p1.source + "(" + param.source + "(" + p2.source + param.source + ")*)?" + p3.source);
            var reg = new RegExp(start.source + returnType.source + name.source + paramList.source);
            return line.match(reg) != null;
        case "funcCall":
            var param = new RegExp(/.*/.source);
            var p1 = /\(\s*/;
            var p2 = /\s*,\s*/;
            var p3 = /\s*\)\s*$/;
            var paramList = new RegExp(p1.source + param.source + "((" + p2.source + param.source + ")*)?" + p3.source);
            var reg = new RegExp(/^[a-zA-Z_][a-zA-Z0-9_]*/.source + paramList.source);
            window.alert(line);
            return line.match(reg) != null;
        case "return":
            return line.match(/^return\s*.*$/) != null;
        case "returnVoid":
            return line.match(/^return\s*$/) != null;
    }
}

function isCorrectFormat(line) {
    var start = /^/;
    var partAfterType = /[a-zA-Z_][a-zA-Z0-9_]*\s*(=\s*.*\s*)?$/;
    var format = new RegExp(start.source + validTypes.source + partAfterType.source);
    return (line.match(format) != null);
}

function isDefaultValueDeclaring(line) {
    var start = /^/;
    var partAfterType = /[a-zA-Z_][a-zA-Z0-9_]*\s*$/;
    var format = new RegExp(start.source + validTypes.source + partAfterType.source);
    return (line.match(format) != null);
}

function isEquality(char) {
    for (var i = 0; i < equalityList.length; i++) {
        if (char == equalityList[i]) {
            return true;
        }
    }
    return false;
}

function removeMinusSigns(exp) {
    var i = 0;
    while (i < exp.length) {
        if (exp[i] == '-') {
            if (i != 0 && (isOperator(exp[i - 1]) || exp[i - 1] == "(") || isEquality(exp[i - 1])) {
                var part1 = exp.substr(0, i);
                var part2 = exp.substr(i + 1, exp.length - i - 1);
                exp = part1 + part2;
                i -= 1;
            } else if (i == 0) {
                var part1 = exp.substr(0, i);
                var part2 = exp.substr(i + 1, exp.length - i - 1);
                exp = part1 + part2;
                i -= 1;
            }
        }
        i += 1;
    }
    return exp;
}

function castNumbersAndText(list) {
    for (var i = 0; i < list.length; i++) {
        if (list[i] == "@i") {
            list[i] = "@f";
        } else if (list[i] == "@c") {
            list[i] = "@s";
        }
    }
    return list;
}

function getTypeFromAtSymbol(atSym) {
    switch (atSym) {
        case "@s":
            return "string";
            break;
        case "@i":
            return "int";
            break;
        case "@f":
            return "float";
            break;
        case "@c":
            return "char";
            break;
        case "@b":
            return "bool";
            break;
    }
}

function replaceNegativesAndConcat(expList) {
    for (var i = 0; i < expList.length; i++) {
        if (expList[i].match(/-.+/)) {
            expList[i] = '@';
        }
    }
    return expList.join('');
}

function getLiteralExpListWithoutOperatorsAndVars(expList) {
    var litExpList = [];
    for (var i = 0; i < expList.length; i++) {
        if (isOperand(expList[i])) {
            litExpList.push(expList[i]);

        }
    }
    return litExpList;
}

function removeArgs(funcs) {
    var fs = []
    for (var i = 0; i < funcs.length; i++) {
        fs.push(funcs[i].substr(0, funcs[i].indexOf("(")));
    }
    return fs;
}

function checkEscape(str, lineNumber) {
    var i = 0;
    str = str.substr(1, str.length - 2);
    while (i < str.length) {
        if (str.charAt(i) == '\\') {
            if (i >= str.length - 1) {
                addError("Invalid escape character on line " + lineNumber);
                return false;
            }
            i += 1;
        }
        i += 1;
    }
    return true;
}

function getTypeOfArgs(args, reqArgs, lineNumber) {
    if (args.length != reqArgs.length) {
        return false;
    }
    for (var i = 0; i < args.length; i++) {
        if (!getTypeOfSingleArg(args[i], reqArgs[i].type, lineNumber)) {
            return false;
        }
    }
    return true;
}

function getTypeOfSingleArg(arg, reqType, lineNumber) {
    var funcs = arg.match(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*((-?[0-9]+(\.[0-9]+)?|"[^]*"|'[^]+'|true|false|[a-zA-Z_][a-zA-Z0-9_]*((\[.*\])?)?)(\s*,\s*(-?[0-9]+(\.[0-9]+)?|"[^]*"|'[^]+'|true|false|[a-zA-Z_][a-zA-Z0-9_]*((\[.*\])?)?))*)?\s*\)/g);
    if (funcs == null) {
        funcs = [];
    }
    var funcNames = removeArgs(funcs);
    var expWithoutFuncs = arg.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*(([0-9]+(\.[0-9]+)?|".*"|'.*'|true|false|[a-zA-Z_][a-zA-Z0-9_]*((\[.*\])?)?)(\s*,\s*([0-9]+(\.[0-9]+)?|".*"|'.*'|true|false|[a-zA-Z_][a-zA-Z0-9_]*((\[.*\])?)?))*)?\s*\)/g, '');
    var expList = expWithoutFuncs.toString().split(/\+|-|\*|\/|\(|\)|&&|\|\|/);
    expList = removeBlankEntries(expList);
    expList = getNegativesAndSubraction(expList);
    expList = expList.concat(funcNames);
    var varList = getVarsFromExp(expList);
    if (!allDeclared(varList, funcs, lineNumber)) {
        return false;
    }
    return checkTypesMatch(expList, reqType, funcs, lineNumber);
}

function argTypesMatch(name, args) {
    for (var i = 0; i < funcList.length; i++) {
        if (funcList[i].name == name) {
            if (checkEachArgMatches(funcList[i].args, args)) {
                return true;
            }
        }
    }
    return false;
}

function checkEachArgMatches(args1, args2) {
    if (args1.length != args2.length) {
        return false;
    }
    for (var i = 0; i < args1.length; i++) {
        if (args1[i].type != args2[i]) {
            return false;
        }
    }
    return true;
}

function findFuncInVar(v, fs) {
    for (var i = 0; i < fs.length; i++) {
        var args = fs[i].substr(fs[i].indexOf("("));
        args = args.substr(1, args.length - 2);
        args = args.split(/,/g);
        args = removeSpaces(args);
        if (v == fs[i].substr(0, fs[i].indexOf("(")).trim()) {
            if (args != "") {
                return args;
            }
            return [];
        }
    }
}

function getTypeOfVarsAndLits(es, fs, lineNumber) {
    var evaluatedList = [];
    for (var i = 0; i < es.length; i++) {
        if (isOperand(es[i])) {
            if (es[i].match(/^.*(==|!=|<|>|<=|>=).*$/) != null) {
                evaluatedList.push("pred");
            } else if (es[i].match(/^[0-9]+$/) != null) {
                evaluatedList.push("int");
            } else if (es[i].match(/^[0-9]+(\.[0-9]+)?$/) != null) {
                evaluatedList.push("float");
            } else if (es[i].match(/^".*"$/) != null) {
                evaluatedList.push("string");
            } else if (es[i].match(/^'.*'$/) != null) {
                evaluatedList.push("char");
            } else if (es[i].match(/^(true|false)$/) != null) {
                evaluatedList.push("bool");
            }
        } else {
            var varWithoutIndex = es[i];
            if (es[i].match(/.*\[.*\]/) != null) {
                varWithoutIndex = es[i].substr(0, es[i].indexOf("["));
            } else if (es[i].match(/.*\..*/) != null) {
                varWithoutIndex = es[i].substr(0, es[i].indexOf("."));
            }
            var varEntry = findUnVar(varWithoutIndex);
            if (varEntry == null) {
                varEntry = findVar(varWithoutIndex);
            }
            if (varEntry == null) {
                varEntry = findFuncByName(es[i], fs, lineNumber);
            }
            if (varEntry == null) {
                return;
            }
            var type = varEntry.type;
            if (es[i].match(/.*\[.*\]/) != null) {
                if (type == "string") {
                    type = "char";
                } else {
                    type = type.substr(0, type.indexOf("["));
                }
            } else if (es[i].match(/.*\..*/) != null) {
                var m = es[i].substr(es[i].indexOf(".") + 1);
                type = getMemberType(varWithoutIndex, m);
            }
            evaluatedList.push(type);
        }
    }
    return evaluatedList;
}

function getMemberType(s, m) {
    var structVar = findUnVar(s);
    var struct = findStruct(structVar.type);
    for (var i = 0; i < struct.memberNames.length + 1; i++) {
        if (m == struct.memberNames[i]) {
            return struct.memberTypes[i];
        }
    }
}

function removeArrayLengths(types) {
    for (var i = 0; i < types.length; i++) {
        if (types[i].match(/.*\[.*\]/) != null) {
            types[i] = types[i].replace(/\[.*\]/, '\[\]');
        }
    }
    return types;
}

function isPrimitiveName(name) {
    var primitives = ["int", "float", "string", "char", "bool"];
    for (var i = 0; i < primitives.length; i++) {
        if (name == primitives[i]) {
            return true;
        }
    }
    return false;
}

function isStructNameTaken(name) {
    for (var i = 0; i < structs.length; i++) {
        if (name == structs[i].name) {
            return true;
        }
    }
    return false;
}

function getStructTypes() {
    var types;
    if (structs.length == 0) {
        return null;
    } else {
        types = new RegExp(structs[0].name);
    }
    var types;
    for (var i = 1; i < structs.length; i++) {
        var sep = /|/;
        types = new RegExp(types.source + sep.source);
        var newType = new RegExp(structs[i].name)
        types = new RegExp(types.source + newType.source);
    }
    return types;
}

function isStructType(type) {
    for (var i = 0; i < structs.length; i++) {
        if (type == structs[i].name) {
            return true;
        }
    }
    return false;
}

function findStruct(name) {
    for (var i = 0; i < structs.length; i++) {
        if (structs[i].name == name) {
            return structs[i];
        }
    }
}

function isMember(member, struct) {
    for (var i = 0; i < struct.memberNames.length; i++) {
        if (member == struct.memberNames[i]) {
            return true;
        }
    }
    return false;
}

function findMemberType(s, m) {
    var struct = findStruct(s);
    for (var i = 0; i < struct.memberTypes.length; i++) {
        if (m == struct.memberNames[i]) {
            return struct.memberTypes[i];
        }
    }
}
