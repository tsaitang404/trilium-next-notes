/** @format */

// /** @format */

// import server from '../../../services/server.js';
// import protectedSessionHolder from '../../../services/protected_session_holder.js';
// import toastService from '../../../services/toast.js';
// import OptionsWidget from './options_widget.js';

// import {Issuer, Strategy} from 'openid-client';
// import {generators} from 'openid-client';

// const TPL = `
// <div class="options-section">
//     <h4 class="">OIDC</h4>
//     <button class="oidcButton" > Launch OIDC </button>
// </div>`;

// export default class MultiFactorAuthenticationOptions extends OptionsWidget {
//     doRender() {
//         this.$widget = $(TPL);
//         this.$oidcButton = this.$widget.find('.oidcButton');

//         this.$protectedSessionTimeout = this.$widget.find('.protected-session-timeout-in-seconds');
//         this.$protectedSessionTimeout.on('change', () =>
//             this.updateOption('protectedSessionTimeout', this.$protectedSessionTimeout.val())
//         );

//         this.$oidcButton.on('click', (async) => {
//             server.get('oidc/initiate').then((result) => {
//                 console.log('Initiated');
//                 console.log(result);
//                 console.log('done');
//             });
//         });
//     }

//     async authenticate() {}

//     optionsLoaded(options) {
//         this.$protectedSessionTimeout.val(options.protectedSessionTimeout);
//     }
// }
