"use strict";
/** Manages the Python server lifecycle */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPythonServer = startPythonServer;
exports.stopPythonServer = stopPythonServer;
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
let pythonProcess;
async function startPythonServer() {
    if (pythonProcess) {
        return true;
    }
    const serverPath = path.join(__dirname, '..', '..', '..', 'server.py');
    return new Promise((resolve) => {
        pythonProcess = cp.spawn('python', [serverPath], {
            detached: false
        });
        pythonProcess.stdout?.on('data', (data) => {
            console.log(`Python server: ${data}`);
        });
        pythonProcess.stderr?.on('data', (data) => {
            console.error(`Python server error: ${data}`);
        });
        // Wait for server to start
        setTimeout(() => {
            resolve(true);
        }, 2000);
    });
}
function stopPythonServer() {
    if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = undefined;
    }
}
//# sourceMappingURL=python-server.js.map