import { showDiscardPrompt } from "./discardPrompt";
import { showDetailPrompt } from "./detailPrompt";
import { showValidationsPrompt } from "./validationsPrompt";

declare global {
    interface Window {
        showDiscardPrompt: typeof showDiscardPrompt;
        showDetailPrompt: typeof showDetailPrompt;
        showValidationsPrompt: typeof showValidationsPrompt;
    }
}
