/** Manages the Python server lifecycle */

import * as cp from 'child_process';
import * as path from 'path';

let pythonProcess: cp.ChildProcess | undefined;

export async function startPythonServer(): Promise<boolean> {
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

export function stopPythonServer(): void {
    if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = undefined;
    }
}
