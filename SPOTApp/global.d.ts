import { showDiscardPrompt } from "./discardPrompt";
import { showDetailPrompt } from "./detailPrompt";
import { showValidationsPrompt } from "./validationsPrompt";
import {showCloseBiddingPrompt} from "./closePrompt"

declare global {
    interface Window {
        showDiscardPrompt: typeof showDiscardPrompt;
        showDetailPrompt: typeof showDetailPrompt;
        showValidationsPrompt: typeof showValidationsPrompt;
       // showCloseBiddingPrompt: typeof showCloseBiddingPrompt;
    }
}
