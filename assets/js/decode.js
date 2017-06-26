function variable(type, name, value) {
    this.type = type;
    this.name = name;
    this.value = value;
}

var variables = [];

function escapeRegExp(string){
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function decode(line) {
    if (line.search("print ") == 0) {
        decodePrint(line);
    } else if (line.search(/int |float |string |char |bool/) == 0) {
        decodeVarDec(line);
    } else if (line.match(/^[a-zA-Z][a-zA-Z0-9_]*\s*=\s*.*$/) != null) {
        decodeVarAss(line);
    }
}

function decodePrint(line) {
    var output = line.substr(6, line.length - 6).replace(/^\s+/, '');
    if (isValid("printVar", line)) {
        output = findVar(output).value;
    }
    else {
        output = output.substr(1, output.length - 2);
        var i = 0;
        while (i < output.length) {
            if (output.charAt(i) == '$') {
                i += 1;
                var varName = output.substr(i, output.length - i);
                varName = varName.match(/^(.*?)\$/)[1];
                while (output.charAt(i) != '$') {
                    i += 1;
                }
                var varValue = findVar(varName).value;
                var replace = "$" + varName + "$";
                var re = new RegExp(escapeRegExp(replace),"g");
                output = output.replace(re, varValue.toString());
            }
            else if (i < output.length - 1 && output.charAt(i) == '\\') {
                if (output.charAt(i+1) == 'n') {
                    var line1 = output.substr(0, i);
                    var line2 = output.substr(i+2, output.length - i - 2);
                    output = line1 + '\n' + line2;
                }
                else if (output.charAt(i+1) == '$') {
                    var part1 = output.substr(0, i);
                    var part2 = output.substr(i+1, output.length - i - 1);
                    output = part1 + part2;
                }
                i += 1;
            }
            i += 1;
        }
    }
    output = output.toString();
    output = output.replace(/\\\\/g, '\\');
    document.getElementById('noodleOutputBox').value += output;
}

function decodeVarDec(line) {
    var varType = line.match(/[^\s]+/)[0];
    var varName = line.substr(varType.length + 1, line.length - varType.length + 1).match(/[a-zA-Z][a-zA-Z0-9_]*[^=\s]*/)[0];
    var varValue = line.match(/=\s*(.*)$/);
    if (varValue != null) {
        varValue = evaluateExpression(varValue[1], varType);
        varValue = removeSpacesAndParseType(varValue, varType);
    } else {
        varValue = getDefaultValue(varType);
    }
    var newVar = new variable(varType, varName, varValue);
    variables.push(newVar);
    document.getElementById('noodleOutputBox').value += newVar.name;
    document.getElementById('noodleOutputBox').value += newVar.value;
}

function decodeVarAss(line) {
    var varName = line.match(/^[a-zA-Z][a-zA-Z0-9_]*[^=\s]*/)[0];
    var varValue = line.match(/=\s*(.*)$/);
    var varType = findVar(varName).type;
    varValue = evaluateExpression(varValue[1], varType);
    varValue = removeSpacesAndParseType(varValue, varType);
    updateVarVal(varName, varValue);
    var newVar = findVar(varName);
    document.getElementById('noodleOutputBox').value += newVar.name;
    document.getElementById('noodleOutputBox').value += newVar.value;
}

function getDefaultValue(varType) {
    switch (varType) {
        case "int" : return 0; break;
        case "float" : return 0.0; break;
        case "string" : return ""; break;
        case "char" : return 'a'; break;
        case "bool" : return 'false'; break;
    }
}

var operatorList = ["+", "-", "*", "/", "&&", "||"];

function isOperator(char) {
    for (var i = 0; i < operatorList.length; i++) {
        if (char == operatorList[i]) {
            return true;
        }
    }
    return false;
}

function isOperand(char) {
    if (char.toString().match(/^([0-9]+(\.[0-9]+)?|"[^]*"|'[^]+'|true|false)$/) != null) {
        return true;
    }
    return false;
}

function getLiteralExpList(expList) {
    var litExpList = [];
    for (var i = 0; i < expList.length; i++) {
        if (isOperator(expList[i]) || isOperand(expList[i]) || expList[i] == "(" || expList[i] == ")") {
            litExpList.push(expList[i]);

        } else {
            litExpList.push(getVarVal(expList[i]));
        }
    }
    return litExpList;
}

function getVarVal(v) {
    var varEntry = findVar(v);
    var val = varEntry.value;
    if (varEntry.type == "string") {
        val = "\""+ val + "\"";
    }
    else if (varEntry.type == "char") {
        val = "\'" + val + "\'";
    }
    return val;
}

var operatorPrecedences = {
    "-": 0,
    "+": 1,
    "*": 2,
    "/": 3
};

function removeSpaces(expList) {
    for (var i = 0; i < expList.length; i++) {
        expList[i] = expList[i].trim();
    }
    return expList;
}

function evaluateExpression(exp, type) {
    var expList = exp.split(/(\+|-|\*|\/|\(|\)|&&|\|\|)/g);
    expList = removeSpaces(expList);
    expList = removeBlankEntries(expList);
    var literalExpList = getLiteralExpList(expList);
    var i = 0;
    var operandStack = [];
    var operatorStack = [];
    while (i < literalExpList.length) {
        if (isOperand(literalExpList[i])) {
            operandStack.push(literalExpList[i]);
        } else if (literalExpList[i] == "(") {
            operatorStack.push(literalExpList[i]);
        } else if (isOperator(literalExpList[i])) {
            while (operatorPrecedences[operatorStack[operatorStack.length - 1]] >=
                operatorPrecedences[literalExpList[i]]) {
                var op = operatorStack.pop();
                var op1 = operandStack.pop();
                var op2 = operandStack.pop();
                operandStack.push(evaluateSingleExpression(op, op1, op2, type));
            }
            operatorStack.push(literalExpList[i]);
        } else if (literalExpList[i] == ")") {
            while (operatorStack[operatorStack.length - 1] != "(") {
                op = operatorStack.pop();
                op1 = operandStack.pop();
                op2 = operandStack.pop();
                operandStack.push(evaluateSingleExpression(op, op1, op2, type));
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
        operandStack.push(evaluateSingleExpression(op, op1, op2, type));
    }
    result = operandStack.pop();
    if (type == "string") {
        result = result.replace(/\"/g, '');
        result = replaceEscapes(result);
    }
    else if (type == "char") {
        result = result.replace(/\'/g, '');
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
    } else if (type == "string") {
        op1 = op1.replace(/(\"|\')/g, '');
        op2 = op2.replace(/(\"|\')/g, '');
        switch (op) {
            case "+":
                return op2.concat(op1);
        }
    }
    else if (type == "bool") {
        op1 = (op1 == "true") || (op1 == true);
        op2 = (op2 == "true") || (op2 == true);
        switch (op) {
            case "&&" : return op1 && op2;
            case "||" : return op1 || op2;
        }
    }

}

function replaceEscapes(str) {
    var i = 0;
    while (i < str.length) {
        if (i < str.length - 1 && str.charAt(i) == '\\') {
            if (str.charAt(i+1) == 'n') {
                var line1 = str.substr(0, i);
                var line2 = str.substr(i+2, str.length - i - 2);
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
    for (var i = 0; i < variables.length; i++) {
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
