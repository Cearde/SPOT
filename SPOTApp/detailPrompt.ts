import { MaterialSupplier } from "./interfaces";

/**
 * Muestra un modal detallado de la Ficha Técnica analizada por la IA.
 * Permite descargar el documento, ver los estados y modificarlos directamente.
 * * @param materialName Nombre del material/producto.
 * @param materialNumber Código o número identificador del material.
 * @param offer Objeto con la información de la oferta y del análisis de IA.
 * @returns Promesa que se resuelve con el objeto modificado o null si se cancela.
 */
export function showDetailPrompt(
    materialName: string, 
    materialNumber: string, 
    offer: MaterialSupplier
): Promise<{    id: number,
                validationStatus: string; 
                validationComment: string; 
                validationAlert: boolean, 
                eventID: string, 
                requisitionId: string, 
                rutSupplier: string,
                materialNumber:string } | null> {
    return new Promise((resolve) => {
        // 1. Crear el contenedor del fondo oscuro (Overlay)
        const overlay = document.createElement("div");
        overlay.className = "spot-prompt-overlay";

        // 2. Crear la tarjeta blanca principal (Modal)
        const card = document.createElement("div");
        card.className = "spot-detail-card-simple";

        // 3. Obtener valores iniciales seguros
        const docTypeRaw = (offer.resultProcessAI || "DESCONOCIDO").toUpperCase();
        const justification = offer.summaryJustification || "No se proporcionó una justificación detallada por parte de la IA.";
        const confidenceRaw = offer.confidenceRating || 0;
        const percentStr = confidenceRaw <= 1 
            ? `${Math.round(confidenceRaw * 100)}%` 
            : `${Math.round(confidenceRaw)}%`;

        // Determinar estado de selección inicial mapeándolo de forma segura
        const currentStatus = (offer.validationStatus || "").trim().toLowerCase();
        let initialSelectValue = "Indeterminado";
        if (currentStatus === "aprobado" || currentStatus === "aprobada") {
            initialSelectValue = "Aprobado";
        } else if (currentStatus === "rechazado" || currentStatus === "rechazada") {
            initialSelectValue = "Rechazado";
        }

        const initialComment = offer.validationComment || offer.ruleOutReason || "";
        const initialAlert = typeof offer.validationAlert === "boolean" 
            ? offer.validationAlert 
            : !!offer.hasADD;

        // 4. Inyectar la estructura HTML interna del modal
        card.innerHTML = `
            <div class="spot-detail-header-simple">
                <h2>Ficha Técnica IA — Gestión de Calificación</h2>
                <p>${materialName} · Cód. ${materialNumber}</p>
            </div>

            <!-- Banner dinámico del estado del análisis (Se actualizará mediante JS reactivo) -->
            <div id="spot-ai-status-banner-el" class="spot-ai-status-banner">
                <span id="spot-banner-icon" style="font-size: 24px; line-height: 1;">📄</span>
                <div style="flex-grow: 1;">
                    <div id="spot-banner-title" style="font-size: 14px; font-weight: 700; color: #0f172a;">Cargando...</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Proveedor: ${offer.supplierName || "No identificado"}</div>
                </div>
                <div id="spot-banner-badge"></div>
            </div>

            <!-- Sección informativa del análisis de la IA -->
            <div class="spot-ai-info-section">
                <div class="spot-ai-info-title">Justificación del Análisis de IA</div>
                <p class="spot-ai-info-content">${justification}</p>
            </div>

            <!-- FORMULARIO DE EDICIÓN DE LA VALIDACIÓN -->
            <div class="spot-ai-info-section" style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <div class="spot-ai-info-title" style="margin-bottom: 12px; color: #0f172a;">Formulario de Calificación</div>
                
                <!-- 1. Selector de Estado de Validación -->
                <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.05em;">
                        Estado de Validación:
                    </label>
                    <select class="spot-validation-status-select" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-weight: 600; color: #1e293b; background-color: #ffffff; outline: none; cursor: pointer; box-sizing: border-box;">
                        <option value="Aprobado" ${initialSelectValue === "Aprobado" ? "selected" : ""}>Aprobado ✅</option>
                        <option value="Rechazado" ${initialSelectValue === "Rechazado" ? "selected" : ""}>Rechazado ❌</option>
                        <option value="Indeterminado" ${initialSelectValue === "Indeterminado" ? "selected" : ""}>Indeterminado ⚠️</option>
                    </select>
                </div>

                <!-- 2. Textarea para Comentarios -->
                <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.05em;">
                        Comentario de Validación:
                    </label>
                    <textarea class="spot-validation-comment-textarea" rows="3" placeholder="Escribe aquí los motivos, detalles u observaciones sobre la ficha..." 
                        style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-family: inherit; outline: none; box-sizing: border-box; resize: vertical;">${initialComment}</textarea>
                </div>

                <!-- 3. Checkbox para validación de Alerta -->
                <div style="display: flex; align-items: center; gap: 8px; background-color: #f8fafc; padding: 10px; border: 1px solid #f1f5f9; border-radius: 8px;">
                    <input type="checkbox" id="spot-validation-alert-cb" class="spot-validation-alert-checkbox" 
                        style="width: 16px; height: 16px; cursor: pointer; margin: 0;" ${initialAlert ? "checked" : ""} />
                    <label for="spot-validation-alert-cb" style="font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; user-select: none; margin: 0;">
                        Establecer Alerta Activa para este Item
                    </label>
                </div>
            </div>

            <!-- Botones de acción del Modal -->
            <div class="spot-detail-actions-layout" style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 12px;">
                <button class="spot-btn-close-simple">Cancelar</button>
                <button class="spot-btn-download" style="margin-right: auto;">
                    
                    🔍 Ver Ficha
                </button>
                <button class="spot-btn-save-validations" style="background-color: #106470; color: #ffffff; border: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background-color 0.15s ease;">
                    💾 Guardar Cambios
                </button>
            </div>
        `;

        // Elementos interactivos del DOM
        const statusBanner = card.querySelector("#spot-ai-status-banner-el") as HTMLDivElement;
        const bannerIcon = card.querySelector("#spot-banner-icon") as HTMLSpanElement;
        const bannerTitle = card.querySelector("#spot-banner-title") as HTMLDivElement;
        const bannerBadge = card.querySelector("#spot-banner-badge") as HTMLDivElement;
        
        const statusSelect = card.querySelector(".spot-validation-status-select") as HTMLSelectElement;
        const commentTextarea = card.querySelector(".spot-validation-comment-textarea") as HTMLTextAreaElement;
        const alertCheckbox = card.querySelector(".spot-validation-alert-checkbox") as HTMLInputElement;

        // 5. Función para actualizar reactivamente la apariencia del banner superior
        const updateBannerStyle = (docTypeRaw: string, confidenceRaw: number) => {
            if (!statusBanner || !bannerIcon || !bannerTitle || !bannerBadge) return;

            if (docTypeRaw === "FICHA_TECNICA" || docTypeRaw === "FICHA_TÉCNICA") {
                //statusBanner.style.backgroundColor = "#f0fdf4"; // Fondo verde claro
               // bannerIcon.textContent = "✅";
                bannerTitle.textContent = "Ficha Técnica Validada por IA";
               // bannerBadge.innerHTML = `<span class="spot-status-badge" style="background-color: #dcfce7; color: #15803d;">${percentStr} Seguro</span>`;
            } else if (docTypeRaw === "OFERTA_COMERCIAL") {
                //statusBanner.style.backgroundColor = "#fff1f2"; // Fondo rojo claro
                //bannerIcon.textContent = "❌";
                bannerTitle.textContent = "Oferta Comercial Detectada";
               // bannerBadge.innerHTML = `<span class="spot-status-badge" style="background-color: #ffe4e6; color: #b91c1c;">${percentStr} Rechazo</span>`;
            } else {
               // statusBanner.style.backgroundColor = "#fffbeb"; // Fondo amarillo claro
               // bannerIcon.textContent = "⚠️";
                bannerTitle.textContent = "Calificación Indeterminada";
                //bannerBadge.innerHTML = `<span class="spot-status-badge" style="background-color: #fef3c7; color: #b45309;">${percentStr} Alerta</span>`;
            }

            if(confidenceRaw >= 0.8) {
                 bannerBadge.innerHTML  = `<span class="spot-status-badge" style="background-color: #dcfce7; color: #15803d;">${percentStr} Seguro</span>`;
                statusBanner.style.backgroundColor = "#f0fdf4"; // Fondo verde claro
                bannerIcon.textContent = "✅";
            }else if (confidenceRaw >= 0.5 && confidenceRaw < 0.8) {
                 bannerBadge.innerHTML  = `<span class="spot-status-badge" style="background-color: #fef3c7; color: #b45309;">${percentStr} Alerta</span>`;
                statusBanner.style.backgroundColor = "#fffbeb"; // Fondo amarillo claro
                bannerIcon.textContent = "⚠️";
            } else {
                bannerBadge.innerHTML = `<span class="spot-status-badge" style="background-color: #ffe4e6; color: #b91c1c;">${percentStr} Rechazo</span>`;
                statusBanner.style.backgroundColor = "#fff1f2"; // Fondo rojo claro
                bannerIcon.textContent = "❌";
            }

        };

        // Escuchar el evento de cambio para redibujar el banner en tiempo real
       /* statusSelect?.addEventListener("change", (e) => {
            const target = e.target as HTMLSelectElement;
            updateBannerStyle(target.value);
        });
*/
        // Inicializar por primera vez el estilo del banner
        updateBannerStyle(docTypeRaw, confidenceRaw);

        // 6. Lógica de decodificación y descarga del documento en formato Base64
        const handleDownload = () => {

            const sharePointUrl = `https://codelcochile.sharepoint.com/teams/CompraSpotInteligente/Shared%20Documents/spotdocs/${offer.eventID}/${offer.rutSupplier}/${offer.attachmentFileName}`;
            window.open(sharePointUrl, '_blank', 'noopener,noreferrer');
           /* const base64 = offer.fileBase64;
            
            if (!base64) {
                alert("No se encontró el contenido del documento en Base64 para descargar.");
                return;
            }

            try {
                const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");
                const byteCharacters = atob(cleanBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                
                let mimeType = "application/pdf";
                let extension = "pdf";
                
                if (base64.startsWith("data:image/png")) {
                    mimeType = "image/png";
                    extension = "png";
                } else if (base64.startsWith("data:image/jpeg") || base64.startsWith("data:image/jpg")) {
                    mimeType = "image/jpeg";
                    extension = "jpg";
                }

                const blob = new Blob([byteArray], { type: mimeType });
                const blobUrl = URL.createObjectURL(blob);
                
                const sanitizedDocName = docTypeRaw.replace(/\s+/g, "_");
                const fileName = `Doc_${sanitizedDocName}_${materialNumber}.${extension}`;

                const downloadLink = document.createElement("a");
                downloadLink.href = blobUrl;
                downloadLink.download = fileName;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(blobUrl);
            } catch (error) {
                console.error("Error al decodificar y descargar el Base64:", error);
                alert("Ocurrió un error al intentar procesar y descargar el archivo.");
            }*/
        };

        // 7. Eventos de confirmación y cierre del prompt
        const closeBtn = card.querySelector(".spot-btn-close-simple");
        closeBtn?.addEventListener("click", () => {
            resolve(null);
            document.body.removeChild(overlay);
        });

        const downloadBtn = card.querySelector(".spot-btn-download");
        downloadBtn?.addEventListener("click", handleDownload);

        const saveBtn = card.querySelector(".spot-btn-save-validations");
        saveBtn?.addEventListener("click", () => {
            const finalStatus = statusSelect.value;
            const finalComment = commentTextarea.value.trim();
            const finalAlert = alertCheckbox.checked;

            // Retornar los datos modificados al proceso de React para actualizar los estados
            resolve({
                id: offer.id,
                validationStatus: finalStatus,
                validationComment: finalComment,
                validationAlert: finalAlert,
                eventID: offer.eventID || "",
                requisitionId: offer.requisitionId || "",
                rutSupplier : offer.rutSupplier || "",
                materialNumber : materialNumber,
            });
            document.body.removeChild(overlay);
        });

        // Permitir cerrar el modal si se hace clic fuera de la tarjeta de contenido
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                resolve(null);
                document.body.removeChild(overlay);
            }
        });

        overlay.appendChild(card);
        document.body.appendChild(overlay);
    });
}