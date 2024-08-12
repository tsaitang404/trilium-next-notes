import { Router } from 'express';
import appInfo from "../services/app_info.js";
import eu from "./etapi_utils.js";

function register(router: Router) {
    eu.route(router, 'get', '/etapi/app-info', (req, res, next) => {
        res.status(200).json(appInfo);
    });
}

export default {
    register
};
