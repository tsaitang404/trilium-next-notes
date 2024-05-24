/** @format */

import server from '../../../services/server.js';
import toastService from '../../../services/toast.js';
import OptionsWidget from './options_widget.js';

const TPL = `
<div class="options-section">
    <h2 class=""><b>What is Multi-Factor Authentication?</b></h2>
    <div class="">
        <i>
            Multi-Factor Authentication (MFA) adds an extra layer of security to your account. Instead
             of just entering a password to log in, MFA requires you to provide one or more additional 
             pieces of evidence to verify your identity. This way, even if someone gets hold of your 
             password, they still can't access your account without the second piece of information. 
             It's like adding an extra lock to your door, making it much harder for anyone else to 
             break in.</i>
    </div>
    <br>
    <div>
        <h3><b>OAuth/OpenID</b></h3>
        <span><i>OpenID is a standardized way to let you log into websites using an account from another service, like Google, to verify your identity.</i></span>
        <div>
            <label>
            <b>Enable OAuth</b>
            </label>
            <input type="checkbox" class="oauth-enabled-checkbox" />
        </div>
        <div>
            <button class="authenticate-user-button" > Login to conigured OAuth service </button>
        </div>
    </div>
    <br>
    <h3><b>Time-based One-Time Password</b></h3>
    <div>
        <label>
        <b>Enable TOTP</b>
        </label>
        <input type="checkbox" class="totp-enabled"  />
    </div>
    <div>
        <span><i>TOTP (Time-Based One-Time Password) is a security feature that generates a unique, temporary 
        code which changes every 30 seconds. You use this code, along with your password to log into your 
        account, making it much harder for anyone else to access it.</i></span>
    </div>
    <br>
    <h4> Generate TOTP Secret </h4>
    <div>
        <span class="totp-secret" > TOTP Secret Key </span>
        <br>
        <button class="regenerate-totp" disabled="true"> Regenerate TOTP Secret </button>
    </div>
    <br>
    <h4> Single Sign-on Recovery Keys </h4>
    <div>
        <span ><i>Single sign-on recovery keys are used to login in the event you cannot access your Authenticator codes. Keep them somewhere safe and secure. </i></span>
        <br><br>
        <span class="alert alert-warning" role="alert" style="font-weight: bold; color: red !important;">After a recovery key is used it cannot be used again.</span>
        <br><br>
        <table style="border: 0px solid white">
            <tbody>
                <tr>
                    <td class="key_0">Recover Key 1</td>
                    <td style="width: 20px" />
                    <td class="key_1">Recover Key 2</td>
                </tr>
                <tr>
                    <td class="key_2">Recover Key 3</td>
                    <td />
                    <td class="key_3">Recover Key 4</td>
                </tr>
                <tr>
                    <td class="key_4">Recover Key 5</td>
                    <td />
                    <td class="key_5">Recover Key 6</td>
                </tr>
                <tr>
                    <td class="key_6">Recover Key 7</td>
                    <td />
                    <td class="key_7">Recover Key 8</td>
                </tr>
            </tbody>
        </table>
        <br>
        <button class="generate-recovery-code" disabled="true"> Generate Recovery Keys </button>
    </div>
</div>
`;

export default class MultiFactorAuthenticationOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);

        this.$regenerateTotpButton = this.$widget.find('.regenerate-totp');
        this.$totpDetails = this.$widget.find('.totp-details');
        this.$totpEnabled = this.$widget.find('.totp-enabled');
        this.$totpSecret = this.$widget.find('.totp-secret');
        this.$totpSecretInput = this.$widget.find('.totp-secret-input');
        this.$authenticatorCode = this.$widget.find('.authenticator-code');
        this.$generateRecoveryCodeButton = this.$widget.find('.generate-recovery-code');
        this.$oAuthEnabledCheckbox = this.$widget.find('.oauth-enabled-checkbox');
        this.$authenticateuserButton = this.$widget.find('.authenticate-user-button');
        this.$recoveryKeys = [];

        for (let i = 0; i < 8; i++) this.$recoveryKeys.push(this.$widget.find('.key_' + i));

        this.$totpEnabled.on('change', async () => {
            this.updateSecret();
        });

        this.$oAuthEnabledCheckbox.on('change', async () => {
            this.updateOAuthStatus();
        });

        this.$generateRecoveryCodeButton.on('click', async () => {
            this.setRecoveryKeys();
        });

        this.$regenerateTotpButton.on('click', async () => {
            this.generateKey();
        });

        this.$authenticateuserButton.on('click', (async) => {
            server.get('oauth/authenticate');
        });

        this.$protectedSessionTimeout = this.$widget.find('.protected-session-timeout-in-seconds');
        this.$protectedSessionTimeout.on('change', () =>
            this.updateOption('protectedSessionTimeout', this.$protectedSessionTimeout.val())
        );

        this.displayRecoveryKeys();
    }

    async updateSecret() {
        if (this.$totpEnabled.prop('checked')) server.post('totp/enable');
        else server.post('totp/disable');
    }

    async updateOAuthStatus() {
        if (this.$oAuthEnabledCheckbox.prop('checked')) server.post('oauth/enable');
        else server.post('oauth/disable');
    }

    async setRecoveryKeys() {
        server.get('totp_recovery/generate').then((result) => {
            if (!result.success) {
                toastService.showError('Error in revevery code generation!');
                return;
            }
            this.keyFiller(result.recoveryCodes);
            server.post('totp_recovery/set', {
                recoveryCodes: result.recoveryCodes,
            });
        });
    }

    async keyFiller(values) {
        // Forces values to be a string so it doesn't error out when I split.
        // Will be a non-issue when I update everything to typescript.
        const keys = (values + '').split(',');
        for (let i = 0; i < keys.length; i++) this.$recoveryKeys[i].text(keys[i]);
    }

    async generateKey() {
        server.get('totp/generate').then((result) => {
            if (result.success) {
                this.$totpSecret.text(result.message);
            } else {
                toastService.showError(result.message);
            }
        });
    }

    optionsLoaded(options) {
        server.get('oauth/status').then((result) => {
            if (result.success) {
                this.$oAuthEnabledCheckbox.prop('checked', result.message);
                this.$authenticateuserButton.prop('disabled', !result.message);
            } else {
                toastService.showError(result.message);
            }
        });
        server.get('totp/status').then((result) => {
            if (result.success) {
                this.$totpEnabled.prop('checked', result.message);
                this.$totpSecretInput.prop('disabled', !result.message);
                this.$totpSecret.prop('disapbled', !result.message);
                this.$regenerateTotpButton.prop('disabled', !result.message);
                this.$authenticatorCode.prop('disabled', !result.message);
                this.$generateRecoveryCodeButton.prop('disabled', !result.message);
            } else {
                toastService.showError(result.message);
            }
        });

        this.$protectedSessionTimeout.val(options.protectedSessionTimeout);
    }

    displayRecoveryKeys() {
        server.get('totp_recovery/enabled').then((result) => {
            if (!result.success) {
                this.keyFiller(Array(8).fill('Error generating recovery keys!'));
                return;
            }

            if (!result.keysExist) {
                this.keyFiller(Array(8).fill('No key set'));
                this.$generateRecoveryCodeButton.text('Generate Recovery Codes');
                return;
            }
        });
        server.get('totp_recovery/used').then((result) => {
            this.keyFiller((result.usedRecoveryCodes + '').split(','));
            this.$generateRecoveryCodeButton.text('Regenerate Recovery Codes');
        });
    }
}
