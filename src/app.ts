import express = require('express');
import path = require('path');
import favicon = require('serve-favicon');
import cookieParser = require('cookie-parser');
import helmet = require('helmet');
import compression = require('compression');
import sessionParser = require('./routes/session_parser');
import utils = require('./services/utils');
import oidc = require('express-openid-connect');
import openID = require('./services/open_id');

require('./services/handlers');
require('./becca/becca_loader');
require('dotenv').config();

const app = express();

const scriptDir = dirname(fileURLToPath(import.meta.url));

// Initialize DB
sql_init.initializeDb();

// view engine setup
app.set('views', path.join(scriptDir, 'views'));
app.set('view engine', 'ejs');

if (!utils.isElectron()) {
    app.use(compression()); // HTTP compression
}

app.use(helmet({
    hidePoweredBy: false, // errors out in electron
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(express.text({ limit: '500mb' }));
app.use(express.json({ limit: '500mb' }));
app.use(express.raw({ limit: '500mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(scriptDir, 'public/root')));
app.use(`/manifest.webmanifest`, express.static(path.join(scriptDir, 'public/manifest.webmanifest')));
app.use(`/robots.txt`, express.static(path.join(scriptDir, 'public/robots.txt')));
app.use(sessionParser);
app.use(favicon(`${scriptDir}/../images/app-icons/icon.ico`));

<<<<<<< HEAD
if (openID.checkOpenIDRequirements()) 
    app.use(oidc.auth(openID.generateOAuthConfig()));

require('./routes/assets').register(app);
require('./routes/routes').register(app);
require('./routes/custom').register(app);
require('./routes/error_handlers').register(app);
=======
assets.register(app);
routes.register(app);
custom.register(app);
error_handlers.register(app);
>>>>>>> develop

// triggers sync timer
await import("./services/sync.js");

// triggers backup timer
await import('./services/backup.js');

// trigger consistency checks timer
await import('./services/consistency_checks.js');

await import('./services/scheduler.js');

startScheduledCleanup();

if (utils.isElectron()) {
    (await import('@electron/remote/main/index.js')).initialize();
}

export default app;
