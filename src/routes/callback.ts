/** @format */

'use strict';

import {Request, Response} from 'express';

function callback(req: Request, res: Response) {
    console.log('GOT CALLBACK');
    console.log(req.body);
}

export = {
    callback,
};
