//Created by Ross Hunter Copyright (c) 2017

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
        } else {
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
        default:
            return getArrayOrStructDefaultValue(varType);
    }
}

function getArrayOrStructDefaultValue(varType) {
    if (varType.match(/.*\[\]/) != null) {
        return [];
    } else if (varType.match(/.*\[.*/) != null) {
        var elementType = varType.substr(0, varType.indexOf("["));
        var sizes = getArrayLengthsDec(varType);
        var overallDefaultArray = [];
        if (sizes.length == 1) {
            var reps = 1;
            var reps2 = sizes[0];
        } else {
            reps = sizes[0];
            var reps2 = sizes[1];
        }
        for (var j = 0; j < reps; j++) {
            if (!isStructType(elementType)) {
                var defaultArray = [];
                for (var i = 0; i < reps2; i++) {
                    defaultArray.push(getDefaultValue(elementType));
                }
                overallDefaultArray.push(defaultArray);
            } else {
                var defaultArray = [];
                for (var i = 0; i < reps2; i++) {
                    defaultArray.push(getStructDefaultValue(elementType));
                }
                overallDefaultArray.push(defaultArray);
            }
            if (reps == 1) {
                overallDefaultArray = defaultArray;
            }
        }
        return overallDefaultArray;
    } else {
        return getStructDefaultValue(varType);
    }
}

function getStructDefaultValue(varType) {
    var types = findStruct(varType).memberTypes;
    var defaultArray = [];
    for (var i = 0; i < types.length; i++) {
        if (isStructType(types[i])) {
            defaultArray.push(null);
        } else {
            defaultArray.push(getDefaultValue(types[i]));
        }
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
    if (char.toString().match(/^(-?[0-9]+(\.[0-9]+)?|"[^]*"|'[^]+'|true|false|\[.*\])(,(-?[0-9]+(\.[0-9]+)?|"[^]*"|'[^]+'|true|false|\[.*\]))*$/) != null) {
        return true;
    }
    return false;
}

function getLiteralExpList(expList, type, lineNumber) {
    var litExpList = [];
    for (var i = 0; i < expList.length; i++) {
        if (expList[i].match(/^\[.*\]$/) != null) {
            var arrayWithoutBs = expList[i].substr(1, expList[i].length - 2);
            var sp = arrayWithoutBs.split(/,/);
            var type = getTypeOfVarsAndLits([sp[0]]);
            expList[i] = createArray(expList[i], type, sp.length, lineNumber);
        }
        if (expList[i] == "null") {
            litExpList.push(null);
        } else if (expList[i] == "read") {
            var input = decodeRead();
            if (type == "string") {
                input = '"' + input + '"';
            } else if (type == "char") {
                if (input.length != 1 && input.match(/^\\.$/) == null) {
                    addRuntimeError("Invalid read input. Expected char on line " + lineNumber);
                    return;
                }
            } else if (type == "int") {
                if (input.match(/^-?[0-9]*$/) == null) {
                    addRuntimeError("Invalid read input. Expected int on line " + lineNumber);
                    return;
                }
            } else if (type == "float") {
                if (input.match(/^-?[0-9]*(.[0-9]*)?$/) == null) {
                    addRuntimeError("Invalid read input. Expected float on line " + lineNumber);
                    return;
                }
            } else if (type == "bool") {
                if (input != "true" && input != "false") {
                    addRuntimeError("Invalid read input. Expected bool on line " + lineNumber);
                    return;
                }
            }
            litExpList.push(input);
        } else if (isOperator(expList[i]) || isOperand(expList[i]) || expList[i] == "(" || expList[i] == ")" || expList[i] == "@fc") {
            litExpList.push(expList[i]);
        } else if (expList[i].match(/.*\..*/) != null) {
            var structName = expList[i].substr(0, expList[i].indexOf("."))
            var s = getVarVal(structName, type == "bool", lineNumber);
            var type = findVar(structName).type;
            var struct = findStruct(type);
            if (expList[i].match(/.*\[/) != null) {
                var index = expList[i].substr(expList[i].indexOf("["));
                index = index.substr(1, index.length - 2);
                index = evaluateExpression(index, "int", lineNumber);

                expList[i] = expList[i].substr(0, expList[i].indexOf("["));
                var memberName = expList[i].substr(expList[i].indexOf(".") + 1);

                var m = getMemberVal(s, struct, memberName);
                litExpList.push(m[index]);
            } else {
                var memberName = expList[i].substr(expList[i].indexOf(".") + 1);
                var m = getMemberVal(s, struct, memberName);
                litExpList.push(m);
            }
        } else {
            var val = getVarVal(expList[i], type == "bool", lineNumber);

            litExpList.push(val);
        }
    }
    return litExpList;
}

function decodeRead(callback) {
    var input = prompt("Input required", "");
    return input;
}

function sleep(milliSeconds) {
    var startTime = new Date().getTime(); // get the current time
    while (new Date().getTime() < startTime + milliSeconds); // hog cpu until time's up
}



function getArrayElem(a, i) {
    var elems = a.toString().split(/,/g);
    for (var j = 0; j < elems.length; j++) {
        if (elems[j].charAt(0) == "[") {
            elems[j] = elems[j].substr(1, elems[j].length - 1);
        } else if (elems[j].charAt(elems[j].length - 1) == "]") {
            elems[j] = elems[j].substr(0, elems[j].length - 1);
        }
    }
    return elems[i];
}

function getMemberVal(s, struct, m) {
    for (var i = 0; i < s.length; i++) {
        if (m == struct.memberNames[i]) {
            if (struct.memberTypes[i] == "string") {
                s[i] = "\"" + s[i] + "\"";
            } else if (struct.memberTypes[i] == "char") {
                s[i] = "\'" + s[i] + "\'";
            }
            return s[i];
        }
    }
}

function getMemberTypeDec(s, m) {
    for (var i = 0; i < s.memberNames.length; i++) {
        if (s.memberNames[i] == m) {
            return s.memberTypes[i];
        }
    }
}

function getVarVal(v, isBool, lineNumber) {
    var varEntry;
    var val;
    if (v.match(/.*\[.*\]/) != null) {
        var varWithoutIndex = v.substr(0, v.indexOf("["));
        var indexes = getArrayLengthsDec(v);
        for (var i = 0; i < indexes.length; i++) {
            indexes[i] = evaluateExpression(indexes[i], "int", lineNumber);
        }
        var index = indexes[0];
        varEntry = findVar(varWithoutIndex);
        var type = varEntry.type;
        if (type == "string") {
            val = varEntry.value.charAt(index);
        } else {
            if (indexes.length == 1) {
                val = varEntry.value[index];
            } else {
                val = varEntry.value[index][indexes[1]];
            }
        }
        if (varEntry.type.match(/.*\[\]/) == null) {
            if (!isBool && (index < 0 || index >= varEntry.value.length)) {
                addRuntimeError("Array index out of bounds");
            } else if (isBool && (index < 0 || index >= varEntry.value.length)) {
                val = null;
            }
        } else {
            if (!isBool && (index < 0 || index >= varEntry.value.length)) {
                val = null;
            } else {
                if (indexes.length == 1) {
                    val = varEntry.value[index];
                } else {
                    val = varEntry.value[index][indexes[1]];
                }
            }
        }
    } else {
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
    execute(linesArray, func.start - 1, func.end);
    if (returnV != null && func.type == "string") {
        returnV = "\"" + returnV + "\"";
    } else if (returnV != null && func.type == "char") {
        returnV = "\'" + returnV + "\'";
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
    args = splitArgs(args);
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
    if (varValue == null) {
        return null;
    }
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
    document.getElementById(outputBox).value += "\nRUNTIME ERROR: " + error;
    throw new Error("Runtime Error");
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

String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

function removeQuotes(str) {
    return str.substr(1, str.length - 2);
}

function isStruct(v) {
    return v.toString().match(/^(-?[0-9]+(\.[0-9]+)?|"[^]*"|'[^]+'|true|false|\[.*\])(,(-?[0-9]+(\.[0-9]+)?|"[^]*"|'[^]+'|true|false|\[.*\]))+$/) != null;
}

function addStructBraces(output, types) {
    for (var i = 0; i < types.length; i++) {
        if (types[i].match(/.*\[\]/) != null) {
            output[i] = "[".concat(output[i]).concat("]");
        } else if (isStructType(types[i])) {
            output[i] = "{".concat(output[i]).concat("}");
        }
    }
    output = "{".concat(output).concat("}");
    return output;
}

function addArrayBrackets(value, array, indexes) {
    if (Object.prototype.toString.call( array[0] ) === '[object Array]') {
        var numDims = 2
    }
    else {

        var numDims = 1
    }
    var numLevels = numDims - indexes.length;
    if (numLevels == 0) {
        return value;
    } else if (numLevels == 1) {
        return "[".concat(value).concat("]");
    } else if (numLevels == 2) {
        for (var i = 0; i < value.length; i++) {
            value[i] = "[".concat(value[i]).concat("]");
        }
        return "[".concat(value).concat("]");
    }
}
