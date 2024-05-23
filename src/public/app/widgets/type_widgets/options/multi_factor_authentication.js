/** @format */

import server from '../../../services/server.js';
import protectedSessionHolder from '../../../services/protected_session_holder.js';
import toastService from '../../../services/toast.js';
import OptionsWidget from './options_widget.js';

const TPL = `
<div class="options-section">
    <h2 class=""><b>What is Multi-Factor Authentication?</b></h2>

    <div class="">
        <i>MFA description</i>
    </div>
    <br>

    <div>
        <h3><b>OAuth</b></h3>
        <span>This is what OAuth is</span>

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
    <h3><b>Time-based One-Time Password<b></h3>
    <div>
        <label>
           <b>Enable TOTP</b>
        </label>
        <input type="checkbox" class="totp-enabled"  />
    </div>
    <div>
        <span>This is what TOTP is</span>
    </div>
    <br>
    <div class="totp-details">
        <div>
            <div class="form-group">
                <label>Authenticator Code</label>
                <input class="authenticator-code" type="text">
            </div>
            <div class="options-section">
                <label>
                TOTP Secret
                </label>
                <input class="totp-secret-input form-control" disabled="true" type="text">
                <button class="save-totp" disabled="true"> Save TOTP Secret </button>
            </div>
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
            <span >Single sign-on recovery keys are used to login in the event you cannot access your Authenticator codes. Keep them somewhere safe and secure. </span>
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
</div>`;

export default class MultiFactorAuthenticationOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);

        this.$mfaHeadding = this.$widget.find('.mfa-heading');
        this.$regenerateTotpButton = this.$widget.find('.regenerate-totp');
        this.$totpDetails = this.$widget.find('.totp-details');
        this.$totpEnabled = this.$widget.find('.totp-enabled');
        this.$totpSecret = this.$widget.find('.totp-secret');
        this.$totpSecretInput = this.$widget.find('.totp-secret-input');
        this.$saveTotpButton = this.$widget.find('.save-totp');
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

        this.$saveTotpButton.on('click', async () => {
            this.saveTotpSecret();
        });

        this.$authenticateuserButton.on('click', (async) => {
            server.get('oidc/authenticate');
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
                this.$saveTotpButton.prop('disabled', !result.message);
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

    saveTotpSecret() {
        const key = this.$totpSecretInput.val().trim();
        const regex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

        if (key.length != 52) {
            toastService.showError('Invalid Secret', 2000);
            return;
        }
        if (regex.test(key)) {
            toastService.showError('Invalid Secret', 2000);
            return;
        }

        server
            .post('totp/set', {
                secret: this.$totpSecretInput.val(),
                authenticatorCode: this.$authenticatorCode.val(),
            })
            .then((result) => {
                if (result.success) {
                    toastService.showError('TOTP Secret has been set');

                    // password changed so current protected session is invalid and needs to be cleared
                    protectedSessionHolder.resetProtectedSession();
                } else {
                    toastService.showError(result.message);
                }
            });

        return false;
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
