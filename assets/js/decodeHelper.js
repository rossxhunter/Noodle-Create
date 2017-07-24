//Object constructors

function variable(type, name, value) {
    this.type = type;
    this.name = name;
    this.value = value;
}

function whileCounter(line, end, ended, count) {
    this.line = line;
    this.end = end;
    this.ended = ended;
    this.count = count;
}

//Helper functions

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function addArgsToDecodeVars(args) {
    args = getArrayLengths(args);
    for (var i = 0; i < args.length; i++) {
        var oldVar = findVar(args[i].name);
        if (oldVar == null) {
            variables.push(new variable(args[i].type, args[i].name, passedArgs[i]));
        }
        else {
            updateVarVal(args[i].name, passedArgs[i]);
        }
    }
}

function getArrayLengths(args) {
    for (var i = 0; i < args.length; i++) {
        if (args[i].type.match(/.*\[\]/) != null) {
            args[i].type = args[i].type.replace(/\[\]/, '[');
            args[i].type = args[i].type.concat(passedArgs[i].length).concat("]");
        }
    }
    return args;
}

function getTargetAndEquality(end) {
    if (end.charAt(0) == "<" || end.charAt(0) == ">" || end.charAt(0) == "!" || end.charAt(0) == "=") {
        var eq = end.charAt(0);
        end = end.substr(1, end.length - 1);
        if (end.charAt(0) == "=") {
            eq = eq.concat(end.charAt(0));
            end = end.substr(1, end.length - 1);
        }
        equalityStack.push(eq);
    }
    return end;
}

function getDefaultValue(varType) {
    switch (varType) {
        case "int":
            return 0;
        case "float":
            return 0.0;
        case "string":
            return "";
        case "char":
            return 'a';
        case "bool":
            return 'false';
        default : return getArrayOrStructDefaultValue(varType);
    }
}

function getArrayOrStructDefaultValue(varType) {
    if (varType.match(/.*\[\]/) != null) {
        return [];
    }
    else if (varType.match(/.*\[.*/) != null) {
        var elementType = varType.substr(0, varType.indexOf("["));
        var size = varType.substr(varType.indexOf("["));
        size = size.substr(1, size.length - 2);
        if (!isStructType(elementType)) {
            var defaultArray = [];
            for (var i = 0; i < size; i++) {
                defaultArray.push(getDefaultValue(elementType));
            }
            return defaultArray;
        }
        else {
            var defaultArray = [];
            for (var i = 0; i < size; i++) {
                defaultArray.push(getStructDefaultValue(elementType));
            }
            return defaultArray;
        }
    }
    else {
        return getStructDefaultValue(varType);
    }
}

function getStructDefaultValue(varType) {
    var types = findStruct(varType).memberTypes;
    var defaultArray = [];
    for (var i = 0; i < types.length; i++) {
        defaultArray.push(getDefaultValue(types[i]));
    }
    return defaultArray;
}

function removeOldVar(varName) {
    for (var i = 0; i < variables.length; i++) {
        if (variables[i].name == varName) {
            variables.splice(i, 1);
        }
    }
}

function isOperator(char) {
    for (var i = 0; i < operatorList.length; i++) {
        if (char == operatorList[i]) {
            return true;
        }
    }
    return false;
}

function isOperand(char) {
    if (char == null) {
        return true;
    }
    if (char.toString().match(/^(-?[0-9]+(\.[0-9]+)?|"[^]*"|'[^]+'|true|false|\[.*\])$/) != null) {
        return true;
    }
    return false;
}

function getLiteralExpList(expList, isBool, lineNumber) {
    var litExpList = [];
    for (var i = 0; i < expList.length; i++) {
        if (isOperator(expList[i]) || isOperand(expList[i]) || expList[i] == "(" || expList[i] == ")" || expList[i] == "@fc") {
            litExpList.push(expList[i]);
        } else if (expList[i].match(/.*\..*/) != null) {
            var structName = expList[i].substr(0, expList[i].indexOf("."))
            var s = getVarVal(structName, isBool, lineNumber);
            var type = findVar(structName).type;
            var struct = findStruct(type);
            var memberName = expList[i].substr(expList[i].indexOf(".") + 1);
            var m = getMemberVal(s, struct, memberName);
            litExpList.push(m);
        }
        else {
            var val = getVarVal(expList[i], isBool, lineNumber);

            litExpList.push(val);
        }
    }
    return litExpList;
}

function getMemberVal(s, struct, m) {
    for (var i = 0; i < s.length; i++) {
        if (m == struct.memberNames[i]) {
            return s[i];
        }
    }
}

function getVarVal(v, isBool, lineNumber) {
    var varEntry;
    var val;
    if (v.match(/.*\[.*\]/) != null) {
        var varWithoutIndex = v.substr(0, v.indexOf("["));
        var index = v.substr(v.indexOf("["));
        index = index.substr(1, index.length - 2);
        index = evaluateExpression(index, "int", lineNumber);
        varEntry = findVar(varWithoutIndex);
        var type = varEntry.type;
        if (type == "string") {
            val = varEntry.value.charAt(index);
        }
        else {
            val = varEntry.value[index];
        }
        if (varEntry.type.match(/.*\[\]/) == null) {
            if (!isBool && (index < 0 || index >= varEntry.value.length)) {
                addRuntimeError("Array index out of bounds");
            }
            else if (isBool && (index < 0 || index >= varEntry.value.length)) {
                val = null;
            }
        }
        else {
            if (!isBool && (index < 0 || index >= varEntry.value.length)) {
                val = null;
            }
            else {
                val = varEntry.value[index];
            }
        }
    }
    else {
        varEntry = findVar(v);
        val = varEntry.value;
    }
    if (val != null) {
        if (varEntry.type == "string") {
            val = "\"" + val + "\"";
        } else if (varEntry.type == "char") {
            val = "\'" + val + "\'";
        }
    }

    return val;
}

function removeSpaces(expList) {
    for (var i = 0; i < expList.length; i++) {
        expList[i] = expList[i].trim();
    }
    return expList;
}

function getNegativesAndSubraction(expList) {
    for (var i = 0; i < expList.length; i++) {
        if (expList[i] == '-') {
            if (i != 0 && (isOperator(expList[i - 1]) || expList[i - 1] == '(')) {
                expList[i] = expList[i].concat(expList[i + 1]);
                expList.splice(i + 1, 1);
            }
            if (i == 0) {
                expList[i] = expList[i].concat(expList[i + 1]);
                expList.splice(i + 1, 1);
            }
        }
    }
    return expList;
}

function castOp(op) {
    if (op == null) {
        return op;
    }
    /*
    if (getTypeOfVarsAndLits([op.toString()])[0] == "int") {
        return parseFloat(op);
    } else if (getTypeOfVarsAndLits([op.toString()])[0] == "char") {
        op = op.replace(/\'/g, '');
        return "\"".concat(op).concat("\"");
    }
    */
    return op;
}

function getFuncReturnVal(name, args, fs, lineNumber) {
    var func = findFuncByName(name, fs, lineNumber);
    passedArgs = args;
    execute(linesArray, func.start - 1, func.end - 1);
    if (func.type == "string") {
        val = "\"" + val + "\"";
    } else if (func.type == "char") {
        val = "\'" + val + "\'";
    }
    return returnV;
}

function replaceFuncsWithVals(expList, funcNames, funcs, lineNumber) {
    var j = 0;
    for (var i = 0; i < expList.length; i++) {
        if (expList[i] == "@fc") {
            var args = getArgsFromCall(funcs[j]);
            var f = findFuncByName(funcNames[j], funcs, lineNumber);
            args = evaluateArgs(args, f.args, lineNumber);
            expList[i] = getFuncReturnVal(funcNames[j], args, funcs, lineNumber);
            j += 1;
        }
    }
    return expList;
}

function evaluateArgs(args, reqArgs, lineNumber) {
    for (var i = 0; i < args.length; i++) {
        args[i] = evaluateExpression(args[i], reqArgs[i].type, lineNumber);
    }
    return args;
}

function getArgsFromCall(line) {
    var args = line;
    args = args.substr(args.indexOf("("));
    args = args.substr(1, args.length - 2);
    args = args.trim();
    args = args.split(/,/);
    args = removeBlankEntries(args);
    if (args == null) {
        args = [];
    }
    return args;
}

function replaceEscapes(str) {
    var i = 0;
    while (i < str.length) {
        if (i < str.length - 1 && str.charAt(i) == '\\') {
            if (str.charAt(i + 1) == 'n') {
                var line1 = str.substr(0, i);
                var line2 = str.substr(i + 2, str.length - i - 2);
                str = line1 + '\n' + line2;
            }
            i += 1;
        }
        i += 1;
    }
    str = str.replace(/\\\\/g, '\\');
    return str;
}

function findVar(varName) {
    for (var i = variables.length - 1; i >= 0; i--) {
        if (variables[i].name == varName) {
            return variables[i];
        }
    }
    return null;
}

function removeSpacesAndParseType(varValue, varType) {
    //varValue = varValue.toString().replace(/\s/g, '');
    if (varType == "int") {
        return parseInt(varValue);
    } else if (varType == "float") {
        return parseFloat(varValue);
    } else {
        return varValue;
    }
}

function updateVarVal(varName, varValue) {
    for (var i = 0; i < variables.length; i++) {
        if (variables[i].name == varName) {
            variables[i].value = varValue;
        }
    }
}

function getVarsFromExp(expList) {
    var varList = [];
    for (var i = 0; i < expList.length; i++) {
        if (!isOperator(expList[i]) && expList[i] != "(" && expList[i] != ")" && !isOperand(expList[i])) {
            varList.push(expList[i]);
        }
    }
    return varList;
}

function addRuntimeError(error) {
    document.getElementById('noodleOutputBox').value += "\nRUNTIME ERROR: " + error;
}

function checkArrayLength(len, line) {
    if (len < 1) {
        addRuntimeError("Array length must be at least 1 on line " + line);
    }
}

function putArraysBackInExpList(expList, arrays) {
    var j = 0;
    for (var i = 0; i < expList.length; i++) {
        if (expList[i] == "@a") {
            expList[i] = arrays[j];
            j += 1;
        }
    }
    return expList;
}

function updateStructMem(s, m, v) {
    var structV = findVar(s);
    var struct = findStruct(structV.type);
    for (var i = 0; i < struct.memberNames.length; i++) {
        if (struct.memberNames[i] == m) {
            structV.value[i] = v;
        }
    }
    updateVarVal(s, structV.value);
}

String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}

function removeQuotes(str) {
    return str.substr(1, str.length - 2);
}
