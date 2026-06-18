import { MaterialSupplier } from "./interfaces";

export function showDetailPrompt(materialName: string, materialNumber: string, offer: MaterialSupplier): void {
    // 1. Crear el contenedor del fondo oscuro (Overlay)
    const overlay = document.createElement("div");
    overlay.className = "spot-prompt-overlay";

    // 2. Crear la tarjeta blanca principal (Modal)
    const card = document.createElement("div");
    card.className = "spot-detail-card";

    // Formatear precio
    const formattedPrice = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(offer.price);

    // 3. Insertar la estructura exacta de tu diseño
    card.innerHTML = `
        <div class="spot-detail-header">
            <h2>Indicadores — ${materialName} · Cód. ${materialNumber}</h2>
            <span class="spot-badge-usd">USD</span>
        </div>

        <div class="spot-detail-grid">
            <div class="spot-detail-box">
                <span class="spot-detail-icon">📄</span>
                <div>
                    <div class="spot-box-label">Ficha técnica</div>
                    <div class="spot-box-value value-teal">Disponible</div>
                </div>
            </div>

            <div class="spot-detail-box">
                <span class="spot-detail-icon">🕒</span>
                <div>
                    <div class="spot-box-label">Entrega pendiente</div>
                    <div class="spot-box-value value-dark">Sí — OC 48291</div>
                </div>
            </div>

            <div class="spot-detail-box">
                <span class="spot-detail-icon">↩️</span>
                <div>
                    <div class="spot-box-label">Devolución activa</div>
                    <div class="spot-box-value value-gray">No</div>
                </div>
            </div>

            <div class="spot-detail-box">
                <span class="spot-detail-icon">👥</span>
                <div>
                    <div class="spot-box-label">Convenio vigente</div>
                    <div class="spot-box-value value-teal">Sí — hasta 12/2025</div>
                </div>
            </div>
        </div>

        <div class="spot-detail-box large">
            <span class="spot-detail-icon money">💲</span>
            <div>
                <div class="spot-box-label">Valor última compra</div>
                <div class="spot-box-value price-highlight">
                    ${formattedPrice} <span class="price-meta">· OC 45881 · 03/03/2025</span>
                </div>
            </div>
        </div>

        <div class="spot-detail-footer">
            <button class="spot-btn-close">Cerrar</button>
        </div>
    `;

    // 4. Lógica para cerrar el modal
    const closeButton = card.querySelector(".spot-btn-close");
    closeButton?.addEventListener("click", () => {
        document.body.removeChild(overlay);
    });

    // También cierra si hacen clic fuera de la tarjeta blanca
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    overlay.appendChild(card);
    document.body.appendChild(overlay);
}