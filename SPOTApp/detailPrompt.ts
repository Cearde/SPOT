import { MaterialSupplier, validationsPromptResult, userTableRow } from "./interfaces";

/**
 * Muestra un modal detallado de la Ficha Técnica analizada por la IA.
 * Permite descargar el documento y enviarlo a una lista de validadores.
 * * @param materialName Nombre del material/producto.
 * @param materialNumber Código o número identificador del material.
 * @param offer Objeto con la información de la oferta y del análisis de IA.
 * @param onSend Callback opcional que se ejecuta al presionar "Enviar" con la cadena de correos validados.
 */
export function showDetailPrompt(
    materialName: string, 
    materialNumber: string, 
    offer: MaterialSupplier,
   // onSend?: (emails: string) => void
): Promise<validationsPromptResult | null> {
    return new Promise((resolve) => {
    // 1. Crear el contenedor del fondo oscuro (Overlay)
    const overlay = document.createElement("div");
    overlay.className = "spot-prompt-overlay";

    // 2. Crear la tarjeta blanca principal (Modal)
    const card = document.createElement("div");
    card.className = "spot-detail-card-simple";

    // 3. Procesar datos dinámicos del análisis de la Inteligencia Artificial
    const docTypeRaw = (offer.resultProcessAI || "DESCONOCIDO").toUpperCase();
    const confidenceRaw = offer.confidenceRating || 0;
    const justification = offer.summaryJustification || "No se proporcionó una justificación detallada por parte de la IA.";

    // Convertir el factor de confianza a un string porcentual legible
    const percentStr = confidenceRaw <= 1 
        ? `${Math.round(confidenceRaw * 100)}%` 
        : `${Math.round(confidenceRaw)}%`;

    // Configurar los estilos dinámicos del banner de estado según el veredicto de la IA
    let bannerBgColor = "#f1f5f9";
    let statusText = "Sin Análisis";
    let badgeHTML = `<span class="spot-status-badge" style="background-color: #cbd5e1; color: #334155;">N/A</span>`;
    let statusIcon = "📄";

    if (docTypeRaw === "FICHA_TECNICA" || docTypeRaw === "FICHA_TÉCNICA") {
        bannerBgColor = "#f0fdf4"; // Fondo verde claro
        statusText = "Ficha Técnica Validada por IA";
        badgeHTML = `<span class="spot-status-badge" style="background-color: #dcfce7; color: #15803d;">${percentStr} Seguro</span>`;
        statusIcon = "🟢";
    } else if (docTypeRaw === "OFERTA_COMERCIAL") {
        bannerBgColor = "#fffbeb"; // Fondo amarillo claro
        statusText = "Oferta Comercial Detectada";
        badgeHTML = `<span class="spot-status-badge" style="background-color: #fef3c7; color: #b45309;">${percentStr} Alerta</span>`;
        statusIcon = "⚠️";
    } else if (docTypeRaw === "DESCARTADO" || docTypeRaw === "RECHAZADO") {
        bannerBgColor = "#fff1f2"; // Fondo rojo claro
        statusText = "Documento Descartado";
        badgeHTML = `<span class="spot-status-badge" style="background-color: #ffe4e6; color: #b91c1c;">${percentStr} Rechazo</span>`;
        statusIcon = "🚫";
    }

    // 4. Inyectar la estructura HTML interna del modal (incluyendo el campo de correos)
    card.innerHTML = `
        <div class="spot-detail-header-simple">
            <h2>Ficha Técnica IA</h2>
            <p>${materialName} · Cód. ${materialNumber}</p>
        </div>

        <!-- Banner dinámico del estado del análisis -->
        <div class="spot-ai-status-banner" style="background-color: ${bannerBgColor};">
            <span style="font-size: 24px; line-height: 1;">${statusIcon}</span>
            <div style="flex-grow: 1;">
                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${statusText}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Proveedor: ${offer.supplierName || "No identificado"}</div>
            </div>
            ${badgeHTML}
        </div>

        <!-- Sección informativa del análisis de la IA -->
        <div class="spot-ai-info-section">
            <div class="spot-ai-info-title">Justificación del Análisis</div>
            <p class="spot-ai-info-content">${justification}</p>
        </div>

        <!-- Entrada de Correos Electrónicos separados por ';' -->
        <div class="spot-ai-info-section">
            <div class="spot-ai-info-title">Destinatarios de Validación</div>
            <input type="text" class="spot-email-input" 
                placeholder="ejemplo1@empresa.com; ejemplo2@empresa.com" 
                style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; font-size: 13px;" />
            <div class="spot-email-error" style="color: #dc2626; font-size: 12px; margin-top: 6px; display: none; font-weight: 600;"></div>
        </div>

        <!-- Botones de acción del Modal -->
        <div class="spot-detail-actions-layout">
            <button class="spot-btn-close-simple">Cerrar</button>
            <button class="spot-btn-download">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Descargar
            </button>
            <button class="spot-btn-send" style="background-color: #0284c7; color: #ffffff; border: none; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background-color 0.15s ease;">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 10l9 6 9-6"></path>
                </svg>
                Enviar
            </button>
        </div>
    `;

    // 5. Lógica de decodificación y descarga del documento en formato Base64
    const handleDownload = () => {
        const rawBase64 = offer.fileBase64 //|| offer.documentBase64 || offer.base64;
        
        if (!rawBase64) {
            alert("No se encontró el contenido del documento en Base64 para descargar.");
            return;
        }

        try {
            // Remueve cualquier prefijo de Data URI en caso de que esté presente
            const cleanBase64 = rawBase64.replace(/^data:[^;]+;base64,/, "");
            
            // Convertir la cadena Base64 en datos binarios decodificados
            const byteCharacters = atob(cleanBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            
            // Asignar el tipo MIME predeterminado para documentos PDF
            let mimeType = "application/pdf";
            let extension = "pdf";
            
            // Detectar si el Base64 corresponde a una imagen para asignar su formato correcto
            if (rawBase64.startsWith("data:image/png")) {
                mimeType = "image/png";
                extension = "png";
            } else if (rawBase64.startsWith("data:image/jpeg") || rawBase64.startsWith("data:image/jpg")) {
                mimeType = "image/jpeg";
                extension = "jpg";
            }

            const blob = new Blob([byteArray], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            
            // Generar un nombre limpio para el archivo a descargar
            const sanitizedDocName = docTypeRaw.replace(/\s+/g, "_");
            const fileName = `Doc_${sanitizedDocName}_${materialNumber}.${extension}`;

            // Crear y gatillar un enlace invisible en el navegador para iniciar la descarga
            const downloadLink = document.createElement("a");
            downloadLink.href = blobUrl;
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            
            // Limpiar memoria
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(blobUrl);
            resolve(null);
        } catch (error) {
            console.error("Error al decodificar y descargar el Base64:", error);
            alert("Ocurrió un error al intentar procesar y descargar el archivo.");
        }
    };

    // 6. Lógica para procesar, validar y enviar los correos
    const handleSendEmails = () => {
        const emailInput = card.querySelector(".spot-email-input") as HTMLInputElement;
        const errorDiv = card.querySelector(".spot-email-error") as HTMLDivElement;

        if (!emailInput || !errorDiv) return;

        const rawValue = emailInput.value;

        if (!rawValue || !rawValue.trim()) {
            errorDiv.textContent = "Por favor, ingresa al menos un correo electrónico.";
            errorDiv.style.display = "block";
            emailInput.style.borderColor = "#dc2626";
            return;
        }

        // Dividir por ";" y filtrar correos vacíos
        const emailList = rawValue.split(";").map(email => email.trim()).filter(Boolean);
        
        // Expresión regular para validar formato de email estándar
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emailList.filter(email => !emailRegex.test(email));

        if (invalidEmails.length > 0) {
            errorDiv.textContent = `Formato inválido en: ${invalidEmails.join(", ")}`;
            errorDiv.style.display = "block";
            emailInput.style.borderColor = "#dc2626";
            return;
        }

        // Si todo es correcto, limpiar errores visuales
        errorDiv.style.display = "none";
        emailInput.style.borderColor = "#cbd5e1";

        // Asignar el valor verificado al campo de salida 'correoValidacion' en el objeto de la oferta (Output)
       // (offer as any).correoValidacion = rawValue;

        // Ejecutar callback si existe y cerrar el modal
        if (rawValue) {
            //onSend(rawValue);
            resolve({ id: offer.id, materialName,  email: rawValue });
        }
        else
        {
            resolve(null);
        }
        document.body.removeChild(overlay);


    };

    // 7. Asignación de manejadores de eventos (Events)
    const closeBtn = card.querySelector(".spot-btn-close-simple");
    closeBtn?.addEventListener("click", () => {
        resolve(null);
        document.body.removeChild(overlay);
    });

    const downloadBtn = card.querySelector(".spot-btn-download");
    downloadBtn?.addEventListener("click", handleDownload);

    const sendBtn = card.querySelector(".spot-btn-send");
    sendBtn?.addEventListener("click", handleSendEmails);

    // Limpiar errores inline al escribir en el input
    const emailInput = card.querySelector(".spot-email-input") as HTMLInputElement;
    emailInput?.addEventListener("input", () => {
        const errorDiv = card.querySelector(".spot-email-error") as HTMLDivElement;
        if (errorDiv) {
            errorDiv.style.display = "none";
            emailInput.style.borderColor = "#cbd5e1";
        }
    });

    // Permitir cerrar el modal si se hace clic fuera de la tarjeta de contenido
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    overlay.appendChild(card);
    document.body.appendChild(overlay);
});
}