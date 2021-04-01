"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exec = void 0;
const Exec = require("@actions/exec");
function exec(command, args) {
    return __awaiter(this, void 0, void 0, function* () {
        let execOptions = {
            ignoreReturnCode: true
        };
        let stdOutput = '';
        let stdError = '';
        execOptions.listeners = {
            stdout: (data) => {
                stdOutput += data.toString();
            },
            stderr: (data) => {
                stdError += data.toString();
            }
        };
        const exitCode = yield Exec.exec(command, args, execOptions);
        const result = {
            exitcode: exitCode,
            stdout: stdOutput.trim(),
            stderr: stdError.trim()
        };
        return result;
    });
}
exports.exec = exec;
