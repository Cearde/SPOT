import { MaterialSupplier, DiscardPromptResult} from "./interfaces";



export function showDiscardPrompt( 
    materialName: string,
    rutSupplier: string,
    offer: MaterialSupplier,
    initialReasons: string[]  = [],
    initialObservations: string | null = null
): Promise<DiscardPromptResult | null> {
    return new Promise((resolve) => {
        const modalId = "spot-discard-modal";
        let modal = document.getElementById(modalId) as HTMLDivElement;
        if (modal) {
            modal.remove();
        }

        modal = document.createElement("div");
        modal.id = modalId;
        modal.className = "spot-modal";
        modal.innerHTML = `
            <div class="spot-modal-overlay"></div>
            <div class="spot-modal-content spot-discard-content">
                <h3 class="spot-modal-title">${offer.ruleOut ? "Reincomporar Oferta" : "Descartar Oferta"}</h3>
                <p><strong>Material:</strong> ${materialName}</p>
                <p><strong>Proveedor:</strong> ${offer.supplierName} (${rutSupplier})</p>
                
                <div class="spot-offer-details-box">
                    <h4>Detalles de la Oferta</h4>
                    <p><strong>Precio:</strong> USD ${offer.price.toFixed(2)}</p>
                    <p><strong>Entrega:</strong> ${offer.deliveryDays} días</p>
                    <p><strong>Incoterm:</strong> ${offer.incoterm || "N/A"}</p>
                </div>

                <p><strong>Selecciona los motivos de descarte:</strong></p>
                <div class="spot-checkbox-group">
                    <label><input type="checkbox" name="discardReason" value="Precio fuera de rango" ${initialReasons.includes("Precio fuera de rango") ? "checked" : ""}> Precio fuera de rango</label>
                    <label><input type="checkbox" name="discardReason" value="Plazo de entrega excesivo" ${initialReasons.includes("Plazo de entrega excesivo") ? "checked" : ""}> Plazo de entrega excesivo</label>
                    <label><input type="checkbox" name="discardReason" value="Incoterms no aceptados" ${initialReasons.includes("Incoterms no aceptados") ? "checked" : ""}> Incoterms no aceptados</label>
                    <label><input type="checkbox" name="discardReason" value="ADD exsitentes" ${initialReasons.includes("ADD exsitentes") ? "checked" : ""}> ADD exsitentes</label>
                    <label><input type="checkbox" name="discardReason" value="OTIF existente" ${initialReasons.includes("OTIF existente") ? "checked" : ""}> OTIF existente</label>
                    <label><input type="checkbox" name="discardReason" value="No cumple validación técnica" ${initialReasons.includes("No cumple validación técnica") ? "checked" : ""}> No cumple validación técnica</label>
                    
                </div>

                <p><strong>Observaciones:</strong></p>
                <textarea id="spot-discard-observations" class="spot-textarea" rows="4" maxlength="250" placeholder="Escribe aquí tus observaciones...">${initialObservations || ""}</textarea>
                <div style="text-align: right; font-size: 11px; color: #666; margin-top: 4px;">
                    <span id="spot-char-count">${(initialObservations || "").length}</span>/250
                </div>

                <div class="spot-modal-actions">
                    <button id="spot-discard-cancel" class="spot-btn">Cancelar</button>
                    <button id="spot-discard-confirm" class="spot-btn primary">${offer.ruleOut ? "Reincorporar" : "Descartar"}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const confirmButton = modal.querySelector("#spot-discard-confirm") as HTMLButtonElement;
        const cancelButton = modal.querySelector("#spot-discard-cancel") as HTMLButtonElement;
        const overlay = modal.querySelector(".spot-modal-overlay") as HTMLDivElement;
        const observationsTextArea = modal.querySelector("#spot-discard-observations") as HTMLTextAreaElement;

        // 1. Obtener las referencias de los elementos
        const textarea = document.getElementById("spot-discard-observations") as HTMLTextAreaElement;
        const charCount = document.getElementById("spot-char-count");

        // 2. Escuchar el evento 'input' para actualizar el contador en tiempo real
        if (textarea && charCount) {
            textarea.addEventListener("input", () => {
                charCount.textContent = textarea.value.length.toString();
            });
        }

        const cleanup = () => {
            modal.remove();
            document.body.style.overflow = "";
        };

        document.body.style.overflow = "hidden"; // Prevent scrolling background

        confirmButton.onclick = () => {
            const checkboxes = modal.querySelectorAll<HTMLInputElement>('input[name="discardReason"]:checked');
            const reasons = Array.from(checkboxes).map((cb) => cb.value);
            const observations = observationsTextArea.value.trim();

            if (reasons.length === 0 || observations === "") {
                alert("Por favor, selecciona al menos un motivo de descarte o escribe una observación.");
                return;
            }

            cleanup();
            resolve({
                id: offer.id,
                materialName,
                rutSupplier,
                supplierName: offer.supplierName, // Include supplierName
                offer,
                reasons,
                observations: observations === "" ? null : observations,
            });
        };

        cancelButton.onclick = () => {
            cleanup();
            resolve(null);
        };

        overlay.onclick = () => {
            cleanup();
            resolve(null);
        };
    });
}
