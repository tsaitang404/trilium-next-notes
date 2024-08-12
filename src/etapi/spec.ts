import { Router } from "express";

import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";
const specPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'etapi.openapi.yaml');
let spec: string | null = null;

function register(router: Router) {
    router.get('/etapi/etapi.openapi.yaml', (req, res, next) => {
        if (!spec) {
            spec = fs.readFileSync(specPath, 'utf8');
        }

        res.header('Content-Type', 'text/plain'); // so that it displays in browser
        res.status(200).send(spec);
    });
}

export default {
    register
};
