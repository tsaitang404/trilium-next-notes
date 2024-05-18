/** @format */

'use strict';

import {NextFunction, Request, Response} from 'express';

function explain(req: Request, res: Response, next: NextFunction){
    
    if ( req.oidc.user)
        res.send( req.oidc.user?.name )
    else
        res.send( "User is not logged in")
}

export = {
    explain,
};
