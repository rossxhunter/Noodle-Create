//Global variables

var variables = [];
var shouldReturn = false;
var returnV;
var passedArgs = [];
var shouldSkip = false;
var satisfied = false;
var codeBlockStack = [];
var endStack = [];
var finishStack = [];
var stepperVar = [];
var currentStepper = [];
var target = [];
var increment = [];
var equalityStack = [];
var funcBlockCount = 0;
var whileCount = [];
var operatorList = ["+", "-", "*", "/", "&&", "||", "==", "<=", ">=", "!=", "<", ">"];
var operatorPrecedences = {
    "||": 0,
    "&&": 1,
    "==": 2,
    "!=": 2,
    "<=": 2,
    ">=": 2,
    "<": 2,
    ">": 2,
    "-": 3,
    "+": 3,
    "*": 4,
    "/": 4,
};

//Main logic

function decode(line, lineNumber) {
    line = line.trim();
    if (!shouldSkip) {
        if (line.search("print ") == 0) {
            decodePrint(line, lineNumber + 1);
        } else if (line.search(validTypes) == 0) {
            decodeVarDec(line, lineNumber + 1);
        } else if (line.match(/^([a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*((\[.*\])?)?|[a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z][a-zA-Z0-9_]*)\s*=\s*.*$/) != null) {
            decodeVarAss(line, lineNumber + 1);
        } else if (line.search(/if\s*\(/) == 0) {
            shouldSkip = !decodeIf(line, lineNumber);
            satisfied = !shouldSkip;
            codeBlockStack.push("if");
            funcBlockCount += 1;
        } else if (line.search(/else\s+if\s*\(/) == 0) {
            shouldSkip = true;
            codeBlockStack.pop();
            codeBlockStack.push("else if");
        } else if (line.search("else") == 0) {
            shouldSkip = true;
            codeBlockStack.pop();
            codeBlockStack.push("else");
        } else if (line.match(/for\s*\(/) != null) {
            decodeFor(line, lineNumber);
            endStack.push(false);
            finishStack.push(true);
            codeBlockStack.push("for");
            funcBlockCount += 1;
        } else if (line.match(/(do\s+)?while\s*\(/) != null) {
            shouldSkip = !decodeWhile(line, lineNumber);
            endStack.push(false);
            codeBlockStack.push("while");
            funcBlockCount += 1;
            if (firstWhile(lineNumber)) {
                whileCount.push(new whileCounter(lineNumber, 0, false, 0));
                if (line.match(/do\s+while\s*\(/) != null) {
                    shouldSkip = false;
                }
            }
            if (shouldSkip) {
                whileCount[whileCount.length - 1].ended = true;
            }
        } else if (line.trim().match(/^(return|return\s.*)$/) != null) {
            for (var i = 0; i < funcBlockCount; i++) {
                codeBlockStack.pop();
            }
            decodeReturn(line, lineNumber);
        } else if (line.search(/\s*func\s+main\s*\(\s*\)\s*/) == 0) {

        } else if (line.replace(/^\s+/, '').search(/func(\s*\(|\s)/) == 0) {
            decodeFunc(line);
        } else if (line.trim().search(/^.*\(.*\)$/) == 0 && line.trim().match(/^\/\/.*$/) == null) {
            decodeFuncCall(line, lineNumber);
        } else if (line.trim().match(/^end$/) != null) {
            if (codeBlockStack[codeBlockStack.length - 1] == "for") {
                endStack.pop();
                endStack.push(true);

            } else if (codeBlockStack[codeBlockStack.length - 1] == "while") {
                endStack.pop();
                endStack.push(true);
            } else if (codeBlockStack[codeBlockStack.length - 1] == "func") {
                shouldReturn = true;
            } else {
                codeBlockStack.pop();
            }
        }
    } else if (line.trim().match(/^end$/) != null) {
        if (codeBlockStack[codeBlockStack.length - 1] == "for") {
            endStack.pop();
            endStack.push(true);
        } else if (codeBlockStack[codeBlockStack.length - 1] == "while") {
            shouldSkip = false;
            endStack.pop();
            endStack.push(true);
        } else if (codeBlockStack[codeBlockStack.length - 1] == "func") {
            shouldReturn = true;
        } else {
            codeBlockStack.pop();
            if (codeBlockStack.length == 0) {
                shouldSkip = false;
            }
        }
    } else if (line.search(/if\s*\(/) == 0) {
        codeBlockStack.push("if");
    } else if (line.search(/else\s+if\s*\(/) == 0) {
        shouldSkip = !decodeIf(line, lineNumber);
        satisfied = !shouldSkip;
        codeBlockStack.pop();
        codeBlockStack.push("else if");
    } else if (line.trim().match(/^else$/) != null && !satisfied) {
        shouldSkip = false;
        codeBlockStack.pop();
        codeBlockStack.push("else");
    }
}

function decodePrint(line, lineNumber) {
    var output = line.substr(6, line.length - 6).replace(/^\s+/, '');
    if (isValid("printVar", line)) {
        if (output.match(/.*\[.*\]/) != null) {
            var varWithoutIndex = output.substr(0, output.indexOf("["));
            var index = output.substr(output.indexOf("["));
            index = evaluateExpression(index.substr(1, index.length - 2), "int", lineNumber);
            var array = findVar(varWithoutIndex).value;
            var v = findVar(varWithoutIndex);
            if (v.type.match(/.*\[\]/) == null && index >= array.length) {
                addRuntimeError("Array index out of bounds on line " + lineNumber);
            }
            if (v.type.match(/.*\[\]/) == null) {
                output = array[index];
            } else {
                if (array[index] == undefined || array[index] == null) {
                    output = "null";
                } else {
                    output = array[index];
                }
            }
            var indexType = v.type.substr(0, v.type.indexOf("["));
            if (findStruct(indexType) != null) {
                var s = findStruct(indexType);
                varValue = addStructBraces(varValue, s.memberTypes);
            }
        } else if (output.match(/.*\..*/) != null) {
            var s = output.substr(0, output.indexOf("."));
            var v = findVar(s);
            var struct = findStruct(v.type);
            var mem = output.substr(output.indexOf(".") + 1)
            var m = getMemberVal(v.value, struct, mem);
            var memType = getMemberTypeDec(struct, mem);
            output = m;
            if (isStructType(memType)) {
                output = addStructBraces(output, memType);
            }
        } else {
            if (output.match(/.*\(\s*.*?\s*\)/) != null) {
                var f = output.substr(0, output.indexOf("("));
                var func = findFuncByName(f, [output], lineNumber);
                output = evaluateExpression(output, func.type, lineNumber);
            } else {
                var v = findVar(output);
                output = v.value;
                if (v.type.match(/.*\[.*\]/) != null) {
                    output = "[".concat(output).concat("]");
                } else if (isStructType(v.type)) {
                    var s = findStruct(v.type);
                    output = addStructBraces(output, s.memberTypes);
                }
            }
        }
    } else {
        output = output.substr(1, output.length - 2);
        var i = 0;
        while (i < output.length) {
            if (output.charAt(i) == '{') {
                i += 1;
                var varName = output.substr(i, output.length - i);
                varName = varName.match(/^(.*?)\}/)[1];
                while (output.charAt(i) != '}') {
                    i += 1;
                }

                if (varName.match(/.*\[.*\]/) != null) {
                    var varWithoutIndex = varName.substr(0, varName.indexOf("["));
                    var index = varName.substr(varName.indexOf("["));
                    index = index.substr(1, index.length - 2);
                    index = evaluateExpression(index, "int", lineNumber);
                    var array = findVar(varWithoutIndex).value;
                    var v = findVar(varWithoutIndex);
                    if (v.type.match(/.*\[\]/) == null && index >= array.length) {
                        addRuntimeError("Array index out of bounds on line " + lineNumber);
                    }
                    if (v.type.match(/.*\[\]/) == null) {
                        var varValue = array[index];
                    } else {
                        if (array[index] == undefined || array[index] == null) {
                            var varValue = "null";
                        } else {
                            var varValue = array[index];
                        }
                    }
                    var indexType = v.type.substr(0, v.type.indexOf("["));
                    if (findStruct(indexType) != null) {
                        var s = findStruct(indexType);
                        varValue = addStructBraces(varValue, s.memberTypes);
                    }
                } else if (varName.match(/.*\..*/) != null) {
                    var s = varName.substr(0, varName.indexOf("."));
                    var v = findVar(s);
                    var struct = findStruct(v.type);
                    var mem = output.substr(output.indexOf(".") + 1);
                    mem = mem.substr(0, mem.length - 1);
                    var m = getMemberVal(v.value, struct, mem);
                    var memType = getMemberTypeDec(struct, mem);
                    varValue = m;
                    if (isStructType(memType)) {
                        varValue = addStructBraces(varValue, memType);
                    }
                } else {
                    if (varName.match(/.*\(\s*.*?\s*\)/) != null) {
                        var f = varName.substr(0, varName.indexOf("("));
                        var func = findFuncByName(f, [varName], lineNumber);
                        varValue = evaluateExpression(varName, func.type, lineNumber);
                    } else {
                        var v = findVar(varName);
                        var varValue = v.value;
                        if (v.type.match(/.*\[.*\]/) != null) {
                            varValue = "[".concat(varValue).concat("]");
                        } else if (isStructType(v.type)) {
                            var s = findStruct(v.type);
                            varValue = addStructBraces(varValue, s.memberTypes);
                        }
                    }
                }

                var replace = "{" + varName + "}";
                var re = new RegExp(escapeRegExp(replace), "g");
                output = output.replace(re, varValue.toString());
                i = i - 2 - varName.length + varValue.toString().length;
            } else if (i < output.length - 1 && output.charAt(i) == '\\') {
                if (output.charAt(i + 1) == 'n') {
                    var line1 = output.substr(0, i);
                    var line2 = output.substr(i + 2, output.length - i - 2);
                    output = line1 + '\n' + line2;
                    i -= 2;
                } else if (output.charAt(i + 1) == '{' || output.charAt(i + 1) == '}') {
                    var part1 = output.substr(0, i);
                    var part2 = output.substr(i + 1, output.length - i - 1);
                    output = part1 + part2;
                    i -= 1;
                }
                i += 1;

            }
            i += 1;
        }
    }
    output = output.toString();
    output = output.replace(/\\\\/g, '\\');
    document.getElementById(outputBox).value += output;
}

function decodeVarDec(line, lineNumber) {
    var varType = line.match(/[^\s]+/)[0];
    var varName = line.substr(varType.length + 1, line.length - varType.length + 1).match(/[^=\s]*/)[0];
    var varValue = line.match(/=\s*(.*)$/);
    if (varValue != null) {
        varValue = varValue[1];
    }
    if (varType.match(/.*\[/) != null) {
        var arrayLength = varType.substr(varType.indexOf("["));
        arrayLength = arrayLength.substr(1, arrayLength.length - 2);
        if (arrayLength == "") {
            arrayLength = 0;
        } else {
            arrayLength = evaluateExpression(arrayLength, "int", lineNumber);
            checkArrayLength(arrayLength, lineNumber);
        }
        if (varValue != null) {
            if (varValue.match(/\[.*/) != null) {
                var arrayType = varType.substr(0, varType.indexOf("["));
                varValue = createArray(varValue, arrayType, arrayLength, lineNumber);
            } else {
                varValue = evaluateExpression(varValue, varType, lineNumber);
            }
        } else {
            varValue = getDefaultValue(varType);
        }
    } else {
        if (varValue != null) {
            if (isStructType(varType)) {
                varValue = decodeStruct(varType, varName, varValue, lineNumber);
            } else {
                varValue = evaluateExpression(varValue, varType, lineNumber);
                varValue = removeSpacesAndParseType(varValue, varType);
            }
        } else {
            varValue = getDefaultValue(varType);
        }
    }
    var newVar = new variable(varType, varName, varValue);
    removeOldVar(varName);
    variables.push(newVar);
    document.getElementById(outputBox).value += newVar.name;
    document.getElementById(outputBox).value += newVar.value;
}

function decodeStruct(varType, varName, varValue, lineNumber) {
    varValue = varValue.trim();
    if (varValue.match(/^\(\s*(.*)\s*(,\s*(.*))*\s*\)$/) != null) {
        varValue = varValue.substr(1, varValue.length - 2);
        var mems = getMembersFromDec(varValue);
        var struct = findStruct(varType);
        for (var i = 0; i < mems.length; i++) {
            mems[i] = evaluateExpression(mems[i], struct.memberTypes[i], lineNumber);
        }
        return mems;
    } else {
        var mems = evaluateExpression(varValue, varType, lineNumber);
        return mems;
    }
}

function createArray(array, type, length, line) {
    array = array.substr(1, array.length - 2);
    array = array.split(/,/);
    if (length != 0 && array.length != length) {
        addRuntimeError("Expected " + length + " elements in array but got " + array.length + " on line " + line);
        return;
    }
    var retArray = []
    for (var i = 0; i < array.length; i++) {
        retArray.push(evaluateExpression(array[i], type, line));
    }
    return retArray;
}

function decodeVarAss(line, lineNumber) {
    var varName = line.match(/^[^=\s]*/)[0];
    var varValue = line.match(/=\s*(.*)$/)[1];
    if (varName.match(/.*\[/) != null) {
        var varWithoutIndex = varName.substr(0, varName.indexOf("["));
        var index = varName.substr(varName.indexOf("["));
        index = index.substr(1, index.length - 2);
        index = evaluateExpression(index, "int", lineNumber);
        if (varWithoutIndex.match(/.*\..*/) != null) {
            var m = varWithoutIndex.substr(varWithoutIndex.indexOf(".") + 1);
            var s = varWithoutIndex.substr(0, varWithoutIndex.indexOf("."));
            var struct = findVar(s);
            var t = findMemberType(struct.type, m);
            varWithoutIndex = s;
            var oldVar = findVar(varWithoutIndex);
            if (t.match(/.*\[\]/) == null && index >= t.length) {
                addRuntimeError("Array index out of bounds on line " + lineNumber);
            }
            var varType = t;
            var isString = false
            if (varType == "string") {
                varType = "char";
                isString = true;
            } else {
                varType = varType.substr(0, varType.indexOf("["));
            }
            varValue = evaluateExpression(varValue, varType, lineNumber);
            varValue = removeSpacesAndParseType(varValue, varType);
            var str = findStruct(struct.type);
            var oldVarValue = getMemberVal(struct.value, str, m);
            if (isString) {
                oldVarValue = oldVarValue.replaceAt(index, varValue);
            } else {
                oldVarValue[index] = varValue;
            }
            updateStructMem(varWithoutIndex, m, oldVarValue);
            var newVar = getMemberVal(findVar(varWithoutIndex).value, str, m);
            //document.getElementById(outputBox).value += newVar.name + index;
            document.getElementById(outputBox).value += newVar[index];
        } else {
            var oldVar = findVar(varWithoutIndex);
            if (oldVar.type.match(/.*\[\]/) == null && index >= oldVar.value.length) {
                addRuntimeError("Array index out of bounds on line " + lineNumber);
            }
            var varType = findVar(varWithoutIndex).type;
            var isString = false
            if (varType == "string") {
                varType = "char";
                isString = true;
            } else {
                varType = varType.substr(0, varType.indexOf("["));
            }
            varValue = evaluateExpression(varValue, varType, lineNumber);
            varValue = removeSpacesAndParseType(varValue, varType);
            var oldVarValue = oldVar.value;
            if (isString) {
                oldVarValue = oldVarValue.replaceAt(index, varValue);
            } else {
                oldVarValue[index] = varValue;
            }
            updateVarVal(varWithoutIndex, oldVarValue);
            var newVar = findVar(varWithoutIndex);
            document.getElementById(outputBox).value += newVar.name + index;
            document.getElementById(outputBox).value += newVar.value[index];
        }
    } else {
        if (varName.match(/.*\..*/) != null) {
            var m = varName.substr(varName.indexOf(".") + 1);
            var s = varName.substr(0, varName.indexOf("."));
            var struct = findVar(s);
            var t = findMemberType(struct.type, m);
            varName = s;
        }
        var varType = findVar(varName).type;
        if (t != null) {
            varType = t;
        }
        if (varType.match(/.*\[/) != null) {
            var arrayLength = varType.substr(varType.indexOf("["));
            arrayLength = arrayLength.substr(1, arrayLength.length - 2);
            arrayLength = evaluateExpression(arrayLength, "int", lineNumber);
            checkArrayLength(arrayLength, lineNumber);
            if (varValue != null) {
                varValue = createArray(varValue, arrayLength, lineNumber);
            }
        } else {
            if (varValue != null) {
                if (isStructType(varType)) {
                    varValue = decodeStruct(varType, varName, varValue, lineNumber);
                } else {
                    varValue = evaluateExpression(varValue, varType, lineNumber);
                    varValue = removeSpacesAndParseType(varValue, varType);
                }
            } else {
                varValue = getDefaultValue(varType);
            }
        }
        if (t != null) {
            updateStructMem(varName, m, varValue);
        } else {
            updateVarVal(varName, varValue);
        }
        var newVar = findVar(varName);
        document.getElementById(outputBox).value += newVar.name;
        document.getElementById(outputBox).value += newVar.value;
    }


}

function decodeIf(line, lineNumber) {
    var pred = line.substr(line.indexOf("("));
    var evaluatedPred = evaluateExpression(pred, "bool", lineNumber);
    evaluatedPred = evaluatedPred == true || evaluatedPred == "true";
    document.getElementById(outputBox).value += evaluatedPred;
    return evaluatedPred;
}

function decodeFor(line, lineNumber) {
    var loopCond = line.substr(line.indexOf("("));
    var loopParts = loopCond.split(/,/g);
    loopParts = removeSpaces(loopParts);
    if (loopParts.length == 1) {
        currentStepper.push(0);
        target.push(evaluateExpression(loopParts[0], "int", lineNumber));
        increment.push(1);
        stepperVar.push("");
    } else if (loopParts.length == 2) {
        currentStepper.push(0);
        var end = loopParts[1].substr(0, loopParts[1].length - 1);
        end = getTargetAndEquality(end);
        end = evaluateExpression(end, "int", lineNumber);
        target.push(end);
        increment.push(1);
        stepperVar.push(loopParts[0].replace(/\(/, ''));
        variables.push(new variable("int", loopParts[0].substr(1, loopParts[0].length - 1), 0));
    } else if (loopParts.length == 3) {
        stepperVar.push(loopParts[0].replace(/\(/, ''));
        var start = evaluateExpression(loopParts[1], "int", lineNumber);
        var end = loopParts[2].substr(0, loopParts[2].length - 1);
        end = getTargetAndEquality(end);
        end = evaluateExpression(end, "int", lineNumber);
        currentStepper.push(start);
        target.push(end);
        if (parseInt(start) <= parseInt(end)) {
            increment.push(1);
        } else {
            increment.push(-1);
        }
        variables.push(new variable("int", loopParts[0].substr(1, loopParts[0].length - 1), parseInt(start)));
    } else {
        var start = evaluateExpression(loopParts[1], "int", lineNumber);
        currentStepper.push(start);
        var end = loopParts[2];
        end = getTargetAndEquality(end);
        end = evaluateExpression(end, "int", lineNumber);
        target.push(end);
        var inc = evaluateExpression(loopParts[3].substr(0, loopParts[3].length - 1), "int", lineNumber);
        increment.push(inc);
        stepperVar.push(loopParts[0].replace(/\(/, ''));
        variables.push(new variable("int", loopParts[0].substr(1, loopParts[0].length - 1), parseInt(start)));
    }
}

function decodeWhile(line, lineNumber) {
    var pred = line.substr(line.indexOf("("));
    var evaluatedPred = evaluateExpression(pred, "bool", lineNumber);
    evaluatedPred = evaluatedPred == true || evaluatedPred == "true";
    document.getElementById(outputBox).value += evaluatedPred;
    return evaluatedPred;
}

function decodeFunc(line) {
    var args = getArgs(line);
    addArgsToDecodeVars(args);
}

function decodeFuncCall(line, lineNumber) {
    evaluateExpression(line, "void", lineNumber);
}

function decodeReturn(line, lineNumber) {
    var returnValue = line.substr(line.indexOf("n") + 1).trim();
    var func = findFuncByLine(lineNumber + 1);
    returnValue = evaluateExpression(returnValue, func.type, lineNumber);
    returnValue = removeSpacesAndParseType(returnValue, func.type);
    returnV = returnValue;
    shouldReturn = true;
}

function evaluateExpression(exp, type, lineNumber) {
    var funcs = exp.match(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*?\s*\)/g);
    if (funcs == null) {
        funcs = [];
    }
    var funcNames = removeArgs(funcs);
    var arrays = exp.match(/[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*\[.*?\]/g);
    if (arrays == null) {
        arrays = [];
    }
    var expWithoutFuncsAndArrays = exp.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*\s*\)/g, '');
    expWithoutFuncsAndArrays = expWithoutFuncsAndArrays.replace(/[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*\[.*?\]/g, '');
    var expList = exp.replace(/[a-zA-Z_][a-zA-Z0-9_]*\(\s*.*?\s*\)/g, '@fc');
    expList = expList.replace(/[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*\[.*?\]/g, '@a');
    expList = expList.split(/(\+|-|\*|\/|\(|\)|&&|\|\||==|<=|>=|!=|<|>)/g);
    expList = removeSpaces(expList);
    expList = removeBlankEntries(expList);
    expList = putArraysBackInExpList(expList, arrays);
    expList = getNegativesAndSubraction(expList);
    var literalExpList = getLiteralExpList(expList, type == "bool", lineNumber);
    literalExpList = replaceFuncsWithVals(literalExpList, funcNames, funcs, lineNumber);
    if (literalExpList.length == 1) {
        var res = literalExpList[0];
        if (type == "string" && literalExpList[0] != null) {
            //res = removeQuotes(res);
            res = replaceEscapes(res);
        } else if (type == "char" && literalExpList[0] != null) {
            //res = removeQuotes(res);
            if (res == "\\n") {
                res = '\n';
            }
        }
        return res;
    }
    var i = 0;
    var operandStack = [];
    var operatorStack = [];
    while (i < literalExpList.length) {
        if (isOperand(literalExpList[i])) {
            if (literalExpList[i] != null && literalExpList[i].toString().match(/\".*\"/) != null && !isStruct(literalExpList[i])) {
                literalExpList[i] = removeQuotes(literalExpList[i]);
            }
            operandStack.push(literalExpList[i]);
        } else if (literalExpList[i] == "(") {
            operatorStack.push(literalExpList[i]);
        } else if (isOperator(literalExpList[i])) {
            while (operatorPrecedences[operatorStack[operatorStack.length - 1]] >=
                operatorPrecedences[literalExpList[i]]) {
                var op = operatorStack.pop();
                var op1 = operandStack.pop();
                var op2 = operandStack.pop();
                op1 = castOp(op1);
                op2 = castOp(op2);
                if (op == "==" || op == "<=" || op == ">=" || op == "!=" || op == "<" || op == ">") {
                    operandStack.push(evaluateSingleExpression(op, op1, op2, "pred"));
                } else {
                    if (op1 == null || op2 == null) {
                        var l = lineNumber + 1
                        addRuntimeError("Cannot use a null value as part of an expression on line " + l);
                        return;
                    }
                    if (type == "bool" && op != "&&" && op != "||") {
                        var expType = getTypeOfVarsAndLits([op1.toString()])[0];
                        operandStack.push(evaluateSingleExpression(op, op1, op2, expType));
                    } else {
                        operandStack.push(evaluateSingleExpression(op, op1, op2, type));
                    }
                }
            }
            operatorStack.push(literalExpList[i]);
        } else if (literalExpList[i] == ")") {
            while (operatorStack[operatorStack.length - 1] != "(") {
                op = operatorStack.pop();
                op1 = operandStack.pop();
                op2 = operandStack.pop();
                op1 = castOp(op1);

                op2 = castOp(op2);
                if (op == "==" || op == "<=" || op == ">=" || op == "!=" || op == "<" || op == ">") {
                    operandStack.push(evaluateSingleExpression(op, op1, op2, "pred"));
                } else {
                    if (op1 == null || op2 == null) {
                        var l = lineNumber + 1
                        addRuntimeError("Cannot use a null value as part of an expression on line " + l);
                        return;
                    }
                    if (type == "bool" && op != "&&" && op != "||") {
                        var expType = getTypeOfVarsAndLits([op1.toString()])[0];
                        operandStack.push(evaluateSingleExpression(op, op1, op2, expType));
                    } else {
                        operandStack.push(evaluateSingleExpression(op, op1, op2, type));
                    }
                }
            }
            if (operatorStack[operatorStack.length - 1] == "(") {
                operatorStack.pop();
            }
        }
        i += 1;
    }
    while (operatorStack.length > 0) {
        var op = operatorStack.pop();
        var op1 = operandStack.pop();
        var op2 = operandStack.pop();
        op1 = castOp(op1);
        op2 = castOp(op2);
        if (op == "==" || op == "<=" || op == ">=" || op == "!=" || op == "<" || op == ">") {
            operandStack.push(evaluateSingleExpression(op, op1, op2, "pred"));
        } else {
            if (op1 == null || op2 == null) {
                var l = lineNumber + 1
                addRuntimeError("Cannot use a null value as part of an expression on line " + l);
                return;
            }
            if (type == "bool" && op != "&&" && op != "||") {
                var expType = getTypeOfVarsAndLits([op1.toString()])[0];
                operandStack.push(evaluateSingleExpression(op, op1, op2, expType));
            } else {
                operandStack.push(evaluateSingleExpression(op, op1, op2, type));
            }
        }
    }
    result = operandStack.pop();
    if (type == "string") {
        result = replaceEscapes(result);
    } else if (type == "char") {
        if (result == "\\n") {
            result = '\n';
        }
    }

    return result;
}

function evaluateSingleExpression(op, op1, op2, type) {
    switch (type) {
        case "int":
            op1 = parseInt(op1);
            op2 = parseInt(op2);
            break;
        case "float":
            op1 = parseFloat(op1);
            op2 = parseFloat(op2);
            break;
    }
    if (type == "int" || type == "float") {
        switch (op) {
            case "+":
                return op1 + op2;
            case "-":
                return op2 - op1;
            case "/":
                return op2 / op1;
            case "*":
                return op1 * op2;
        }
    } else if (type == "string" || type == "char") {
        op1 = op1.replace(/(\"|\')/g, '');
        op2 = op2.replace(/(\"|\')/g, '');
        switch (op) {
            case "+":
                return op2.concat(op1);
        }
    } else if (type == "bool") {
        op1 = (op1 == "true") || (op1 == true);
        op2 = (op2 == "true") || (op2 == true);
        switch (op) {
            case "&&":
                return op1 && op2;
            case "||":
                return op1 || op2;
        }
    } else if (type == "pred") {
        if (op1 != null && getTypeOfVarsAndLits([op1.toString()]) == "string") {
            op1 = op1.replace(/(\"|\')/g, '');
            op2 = op2.replace(/(\"|\')/g, '');
        }
        if (op1 == "\"undefined\"") {
            op1 = null;
        }
        if (op2 == "\"undefined\"") {
            op2 = null;
        }
        switch (op) {
            case "==":
                return op1 == op2;
            case "!=":
                return op1 != op2;
            case "<=":
                return op2 <= op1;
            case ">=":
                return op2 >= op1;
            case "<":
                return op2 < op1;
            case ">":
                return op2 > op1;
        }
    }

}
