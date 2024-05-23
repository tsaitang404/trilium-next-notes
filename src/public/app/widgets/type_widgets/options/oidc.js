/** @format */

/** @format */

import server from '../../../services/server.js';
// import protectedSessionHolder from '../../../services/protected_session_holder.js';
// import toastService from '../../../services/toast.js';
import OptionsWidget from './options_widget.js';

// import {Issuer, Strategy} from 'openid-client';
// import {generators} from 'openid-client';

const TPL = `
<div class="options-section">
    <div>
        <h4>Login</h4>
        <span class="loginResult"><i>No data loaded</i></span>
        <br>
        <button class="loginButton" > Launch OIDC </button>
    </div>

    <div>
        <h4>Data</h4>
        <span class="info-dump"><i>No data loaded</i></span>
        <br>
        <button class="infoButton" > Launch OIDC </button>
    </div>

    <div>
        <h4>Validate Current User</h4>
        <span class="current-user-dump"><i>No data loaded</i></span>
        <br>
        <button class="currentUserButton" > Launch OIDC </button>
    </div>
</div>`;

export default class OpenIDOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.$infoText = this.$widget.find('.info-dump');
        this.$infoButton = this.$widget.find('.infoButton');
        this.$currentUserText = this.$widget.find('.current-user-dump');
        this.$currentUserButton = this.$widget.find('.currentUserButton');
        this.$loginButton = this.$widget.find('.loginButton');
        this.$loginText = this.$widget.find('.loginResult');

        this.$protectedSessionTimeout = this.$widget.find('.protected-session-timeout-in-seconds');
        this.$protectedSessionTimeout.on('change', () =>
            this.updateOption('protectedSessionTimeout', this.$protectedSessionTimeout.val())
        );

        this.$infoButton.on('click', (async) => {
            server.get('oidc/info').then((result) => {
                this.$infoText.text(JSON.stringify(result));
            });
        });

        this.$currentUserButton.on('click', (async) => {
            server.get('oidc/verify').then((result) => {
                this.$currentUserText.text(result.message);
            });
        });

        this.$loginButton.on('click', (async) => {
            server.get('oidc/login').then((result) => {
                this.$loginText.text(JSON.stringify(result));
            });
        });
    }

    optionsLoaded(options) {
        server.get('oidc/check').then((result) => {
            console.log(result);
            if (result.message === true) {
                this.$loginText.text('User logged in');
                this.$loginButton.text('Reset');
            } else {
                this.$loginText.text('No user logged in');
                this.$loginButton.text('Set');
            }
        });
        this.$protectedSessionTimeout.val(options.protectedSessionTimeout);
    }
}
