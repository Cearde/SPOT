import { CloseBiddingDataJson, CloseBiddingResult } from "./interfaces";

/**
 * Muestra un modal interactivo para confirmar el cierre de una licitación.
 * Retorna una Promesa que se resuelve con un objeto JSON con la decisión y el correo de destino.
 * * @param biddingName Nombre de la licitación que se cerrará.
 * @param biddingId Identificador único o código de la licitación.
 */
export function showCloseBiddingPrompt(
    eventID: string,
    biddingName: string,
    dataJson: CloseBiddingDataJson
): Promise<CloseBiddingResult | null> {
    return new Promise((resolve) => {
        // 1. Crear el contenedor del fondo oscuro (Overlay)
        const overlay = document.createElement("div");
        overlay.className = "spot-prompt-overlay";
        // Estilos básicos integrados para asegurar que el modal se posicione correctamente
        overlay.setAttribute("style", `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 16px;
            box-sizing: border-box;
        `);

        // 2. Crear la tarjeta blanca principal (Modal)
        const card = document.createElement("div");
        card.className = "spot-detail-card-simple";
        card.setAttribute("style", `
            background: #ffffff;
            border-radius: 16px;
            padding: 28px;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1e293b;
            box-sizing: border-box;
            animation: spotModalFadeIn 0.25s ease-out;
        `);

        // Estilos para la animación de entrada
        const styleSheet = document.createElement("style");
        styleSheet.textContent = `
            @keyframes spotModalFadeIn {
                from { transform: scale(0.96); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(styleSheet);

        // 3. Inyectar la estructura HTML interna del prompt
        card.innerHTML = `
            <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.4;">
                    ⚠️ Confirmación de Cierre de Licitación
                </h2>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
                    Licitación: ${biddingName} (ID: ${eventID})
                </p>
            </div>

            <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.5; color: #334155;">
                    ¿Estás seguro de que deseas cerrar esta licitación? Esta acción finalizará la recepción de ofertas y generará el informe consolidado correspondiente.
                </p>
            </div>

            <!-- Sección obligatoria: Enviar informe generado -->
            <div style="margin-bottom: 24px; background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 14px; border-radius: 8px;">
                <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.05em;">
                    Enviar informe consolidado a:
                </label>
                <input type="text" class="spot-close-email-input" 
                    placeholder="ejemplo@empresa.com" 
                    style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; font-size: 13px; outline: none; transition: border-color 0.15s ease;" />
                <div class="spot-close-email-error" style="color: #dc2626; font-size: 12px; margin-top: 6px; display: none; font-weight: 600;"></div>
            </div>

            <!-- Botones de acción del Modal -->
            <div style="display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <button class="spot-btn-cancel-close" style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background-color 0.15s ease;">
                    Cancelar
                </button>
                <button class="spot-btn-confirm-close" style="background-color: #dc2626; color: #ffffff; border: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background-color 0.15s ease;">
                    Aceptar y Cerrar
                </button>
            </div>
        `;

        // 4. Lógica de validación del correo (si es que se ingresó uno)
        const validateAndResolve = (decision: boolean) => {
            if (!decision) {
                // Si la decisión es Cancelar, solo cerramos el modal
                document.body.removeChild(overlay);
                resolve(null);
                return;
            }

            const emailInput = card.querySelector(".spot-close-email-input") as HTMLInputElement;
            const errorDiv = card.querySelector(".spot-close-email-error") as HTMLDivElement;

            if (!emailInput || !errorDiv) return;

            const emailValue = emailInput.value.trim();

            if (emailValue === "") {
                errorDiv.textContent = "Debes ingresar un correo electrónico.";
                errorDiv.style.display = "block";
                emailInput.style.borderColor = "#dc2626";
                return;
            }

            // Expresión regular para validar formato estándar de correo
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!emailRegex.test(emailValue)) {
                errorDiv.textContent = "Por favor, ingresa un correo electrónico con formato válido.";
                errorDiv.style.display = "block";
                emailInput.style.borderColor = "#dc2626";
                return; // Detener flujo para corregir error
            }

            // Si el correo es válido, limpiamos los estilos y resolvemos
            errorDiv.style.display = "none";
            emailInput.style.borderColor = "#cbd5e1";

            resolve(
                {
                    decision: true,
                    email: emailValue,
                    dataJson :dataJson,
                    eventID,
                    bindinName: biddingName
                }
            );
            document.body.removeChild(overlay);
        };

        // 5. Asignación de manejadores de eventos (Events)
        const cancelBtn = card.querySelector(".spot-btn-cancel-close");
        cancelBtn?.addEventListener("click", () => validateAndResolve(false));

        const confirmBtn = card.querySelector(".spot-btn-confirm-close");
        confirmBtn?.addEventListener("click", () => validateAndResolve(true));

        // Limpiar errores visuales al escribir en el input
        const emailInput = card.querySelector(".spot-close-email-input") as HTMLInputElement;
        emailInput?.addEventListener("input", () => {
            const errorDiv = card.querySelector(".spot-close-email-error") as HTMLDivElement;
            if (errorDiv) {
                errorDiv.style.display = "none";
                emailInput.style.borderColor = "#cbd5e1";
            }
        });

        // Permitir cerrar/cancelar el modal haciendo clic fuera de la tarjeta blanca
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                validateAndResolve(false);
            }
        });

        overlay.appendChild(card);
        document.body.appendChild(overlay);
    });
}