import * as React from "react";
import { useState, useEffect } from "react";
import { TableDataRow, MaterialSupplier, TableStats, IBiddingDocument, CloseBiddingDataJson,CloseBiddingDataOffer } from "../interfaces";
import {showCloseBiddingPrompt} from "../closePrompt"
import { showValidationsPrompt } from "../validationsPrompt";

export interface ISPOTAppProps {
    gridTitle: string;
    rows: TableDataRow[];
    onDiscard: (result: string) => void;
    onValidation: (email: string) => void;
    onClose: (result: string) => void;
    onDetailUpdate: (result: string) => void;

    biddingDocuments: IBiddingDocument[];
    statusDocument ?: string;
    onDocumentChange?: (documentId: string) => void;
}

interface IUniqueSupplier {
    rut: string;
    name: string;
    avgDeliveryDays: string;
    PEP: string;
    PER: string;
    AR: string;
    hasOTIF: number;
    totalBidds: number;
}

export const SPOTApp: React.FC<ISPOTAppProps> = ({ 
    gridTitle, 
    rows, 
    onDiscard, 
    onValidation,
    onClose,    
    biddingDocuments,
    statusDocument,
    onDetailUpdate,
    onDocumentChange
}) => {
    const [filterActive, setFilterActive] = useState<Set<string>>(new Set());
    const [uniqueSuppliers, setUniqueSuppliers] = useState<IUniqueSupplier[]>([]);
    const [hasAttach, setHasAttach] = useState<boolean>(false); // Start with false
    const [documentsList, setBiddingDocumentsList] = useState<IBiddingDocument[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<string>(""); // Start with empty 
  //  const [showValidationButton, setShowValidationButton] = useState<boolean>(false);


    useEffect(() => {
        const suppliers = getUniqueSupplierRuts(rows);
        setUniqueSuppliers(suppliers);
        setFilterActive(new Set(suppliers.map(s => s.rut)));
        setHasAttach(hasAnyAttachment(rows));
    }, [rows]);

    useEffect(() => {
        let docs: IBiddingDocument[] = [];
        if (biddingDocuments) {
            try {
                const parsedDocs = biddingDocuments;// JSON.parse(biddingDocuments);
                if (Array.isArray(parsedDocs)) {
                    docs = parsedDocs;
                }
            } catch (e) {
                console.error("Failed to parse biddingDocuments", e);
            }
        }
        setBiddingDocumentsList(docs);

        if (selectedDoc && docs.some(d => d.value === selectedDoc)) {
            setSelectedDoc(selectedDoc);
        } else if (docs.length > 0) {
            const firstDocValue = docs[0].value;
            setSelectedDoc(firstDocValue);
            if (onDocumentChange) {
                onDocumentChange(firstDocValue);
            }
        } else {
            setSelectedDoc("");
        }
    }, [biddingDocuments, selectedDoc]);

    const hasAnyAttachment = (data: TableDataRow[]): boolean => {
        return data.some(row => 
            row.suppliers?.some(supplier => 
                !supplier.ruleOut &&
                Boolean(supplier.attachmentValueID && supplier.attachmentValueID.trim() !== "")
            )
        );
    };

    // Uso:
    //const tieneAdjuntos = hasAnyAttachment(rows);

    const getUniqueSupplierRuts = (dataRows: TableDataRow[]): IUniqueSupplier[] => {
        const safeRows = dataRows || [];
        const seen = new Set<string>();
        const unique: IUniqueSupplier[] = [];
        const priceSumMap: Record<string, number> = {};

        safeRows.forEach((row) => {
            if (row && row.suppliers && Array.isArray(row.suppliers)) {
                row.suppliers.forEach((supplier) => {
                    if (supplier && supplier.rutSupplier) {
                        const rut = supplier.rutSupplier;
                        const isDiscarded = !!supplier.ruleOut;
                        const offerPrice = typeof supplier.price === "number" ? supplier.price : 0;

                        if (!isDiscarded) {
                            priceSumMap[rut] = (priceSumMap[rut] || 0) + offerPrice;
                        }
                    }
                });
            }
        });

        safeRows.forEach((row) => {
            if (row && row.suppliers && Array.isArray(row.suppliers)) {
                row.suppliers.forEach((supplier) => {
                    if (supplier && supplier.rutSupplier && !seen.has(supplier.rutSupplier)) {
                        seen.add(supplier.rutSupplier);
                        const rut = supplier.rutSupplier;
                        
                        unique.push({ 
                            rut: rut, 
                            name: supplier.supplierName || "", 
                            avgDeliveryDays: supplier.avgDeliveryDays || "0", 
                            PEP: supplier.PEP || "", 
                            PER: supplier.PER || "", 
                            AR: supplier.AR || "",
                            hasOTIF: supplier.hasOTIF || 0,
                            totalBidds: priceSumMap[rut] || 0
                        });
                    }
                });
            }
        });
        return unique;
    };

    const buildCloseBiddingDataJson = (dataRows: TableDataRow[]): CloseBiddingDataJson => {
        const suppliersMap = new Map<string, { rut: string; name: string }>();
        
        const materials = (dataRows || []).map((row) => {
            const offers: Record<string, CloseBiddingDataOffer> = {};

            // Convertir la cantidad solicitada a número para cálculos de precio total
            const parsedQuantity = typeof row.quantityAmount === "number" 
                ? row.quantityAmount 
                : parseFloat(row.quantityAmount) || 0;

            (row.suppliers || []).forEach((supplier) => {
                if (!supplier.rutSupplier) {
                    return;
                }

                if (!suppliersMap.has(supplier.rutSupplier)) {
                    suppliersMap.set(supplier.rutSupplier, {
                        rut: supplier.rutSupplier,
                        name: supplier.supplierName || ""
                    });
                }

                const unitPrice = typeof supplier.price === "number" ? supplier.price : 0;
                const lastPrice = typeof row.lastPurchasePrice === "number" ? row.lastPurchasePrice : 0;

                offers[supplier.rutSupplier] = {
                    // Datos del Material / SOLPED (vienen de TableDataRow)
                    requisitionId: row.requisitionId || supplier.requisitionId || "",
                    materialName: row.materialName || "",
                    materialNumber: row.materialNumber || "",
                    quantityAmount: row.quantityAmount ?? 0,
                    quantityUnitCode: row.quantityUnitCode || "",
                    unit: row.quantityUnitCode || "", // Duplicado/Alias para no romper scripts previos

                    // Datos de la Oferta (vienen de MaterialSupplier)
                    price: unitPrice,
                    totalHomologatedPrice: unitPrice * parsedQuantity,
                    estimatedUnitPriceVariation: lastPrice > 0 ? unitPrice - lastPrice : 0,
                    deliveryDays: supplier.deliveryDays ?? 0,
                    incoterm: supplier.incoterm || "",
                    brandModel: supplier.brandModel || "",
                    isBestOffer: supplier.esMasBarato === 1 ? true : false
                };
            });

            return {
                materialNumber: row.materialNumber || "",
                materialName: row.materialName || "",
                offers
            };
        });

        return {
            suppliers: Array.from(suppliersMap.values()),
            materials
        };
    };

    const handleValidation = async () => {
    // Aquí puedes implementar la lógica para manejar la validación de fichas
    console.log("Validar fichas técnicas");

    try {
          // Filtrar solo los materiales (filas) que tengan al menos una oferta con ficha técnica válida
            const filteredOffers = rows.filter(row => 
                row.suppliers && 
                Array.isArray(row.suppliers) &&
                row.suppliers.some(supplier => {
                    const docType = (supplier.resultProcessAI || "").trim().toUpperCase();
                    const isTechnicalSheet = docType === "FICHA_TECNICA" || docType === "FICHA_TÉCNICA";
                    return !supplier.ruleOut && 
                        Boolean(supplier.attachmentValueID && supplier.attachmentValueID.trim() !== "") &&
                        isTechnicalSheet;
                })
            );
            const res = await showValidationsPrompt(filteredOffers, selectedDoc);//getMaterial(offers));
        
        if (res) {
            onValidation(JSON.stringify(res));
        }
    } catch (err) {
        console.warn("Descarte/Reincorporación cancelada:", err);
    }


    };

     const handleClosed = async () => {
        try {
            const selectedDocument = documentsList.find((doc) => doc.value === selectedDoc);
            const biddingName = gridTitle;
            const eventID = selectedDocument?.value || selectedDoc;
            const dataJson = buildCloseBiddingDataJson(rows);
            const res = await showCloseBiddingPrompt(eventID, biddingName, dataJson);
            
            if (res) {
                onClose(JSON.stringify(res));
            }
        } catch (err) {
            console.warn("Descarte/Reincorporación cancelada:", err);
        }
    };

    
    const toggleFilter = (rut: string) => {
        const newFilters = new Set(filterActive);
        if (newFilters.has(rut)) {
            newFilters.delete(rut);
        } else {
            newFilters.add(rut);
        }
        setFilterActive(newFilters);
    };

    const calculateStats = (): TableStats => {
        const materialsWithoutOffer = rows.filter((row) => row.suppliers.length === 0).length;
        return {
            totalSuppliers: uniqueSuppliers.length,
            qualifiedSuppliers: uniqueSuppliers.length,
            discardedSuppliers: 0,
            totalMaterials: rows.length,
            materialsWithoutOffer
        };
    };
    const handleDocChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = event.target.value;
        //setShowValidationButton(true);
        setSelectedDoc(newValue);
        if (onDocumentChange) {
            onDocumentChange(newValue);
        }
    };

    const stats = calculateStats();
    const activeSuppliersList = uniqueSuppliers.filter(s => filterActive.has(s.rut));

    return (
            <div className="spot-app">
              {/* ==========================================================================
               NUEVA CABECERA INSTITUCIONAL INTEGRADA DE CODELCO (Estilos Tailwind exactos)
               ========================================================================== */}
           {/* CABECERA NARANJA SIMPLIFICADA (Logo izquierda, Título centro, Selector derecha) */}
            <header className="spot-header">
                <div className="spot-header-left">
                    <img 
                        className="spot-header-logo" 
                        src="logo_codelco.png" 
                        alt="CODELCO" 
                        onError={(e) => {
                            e.currentTarget.onerror = null; 
                            e.currentTarget.src = "https://placehold.co/120x36/E35205/FFFFFF?text=CODELCO";
                        }}
                    />
                </div>
                <div className="spot-header-center">
                    <h1 className="spot-header-title">
                        Compra SPOT
                    </h1>
                </div>
                <div className="spot-header-right">
                    <div className="spot-control-group">

                        <span 
                        className="spot-btn-wrapper"
                        title={!hasAttach ? "No hay fichas adjuntas para validar" : ""}
                        >
                            <button 
                                className="spot-btn" 
                                disabled={!hasAttach || statusDocument?.toLowerCase() === 'en validación' || statusDocument?.toLowerCase() === 'cerrada'} 
                                onClick={handleValidation}
                            >
                                {statusDocument?.toLowerCase() === 'en validación' ? "Fichas EN VALIDACIÓN" : "Validar Fichas"} 
                            </button>
                        </span>
                         
                       
                        <button 
                            className="spot-btn" 
                            onClick={handleClosed}
                            disabled={statusDocument?.toLowerCase() === 'cerrada' || statusDocument?.toLowerCase() === 'en validación'}
                        >
                            {statusDocument?.toLowerCase() === 'cerrada' ? "Licitación CERRADA " : "Cerrar Licitación"} 
                        </button>
                         
                        { /*<div className="spot-select-wrapper">
                           <select 
                                id="docSelector" 
                                value={selectedDoc}
                                onChange={handleDocChange}
                                className="spot-header-selector"
                            >
                                {documentsList.length === 0 ? (
                                    <option value="">Sin documentos</option>
                                ) : (
                                    documentsList.map((doc) => (
                                        <option key={doc.value} value={doc.value}>
                                            {doc.label}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>*/}
                    </div>
                </div>
            </header>


            <section className="spot-card">  
                <div className="spot-stats">
                    <StatBox label="Total proveedores" value={stats.totalSuppliers.toString()} />
                    <StatBox label="Proveedores calificados" value={stats.qualifiedSuppliers.toString()} modifier="highlight" />
                    <StatBox label="Proveedores descartados" value={stats.discardedSuppliers.toString()} modifier="danger" />
                    <StatBox label="Materiales totales" value={stats.totalMaterials.toString()} />
                    <StatBox label="Materiales sin oferta" value={stats.materialsWithoutOffer.toString()} modifier="warning" />
                </div>
                
            </section>
            <section className="spot-title"> 
                <strong>ID: {selectedDoc}</strong>
                <strong>Nombre: {gridTitle}</strong>
            </section>
            <section className="spot-filters">
                <h3>Filtrar proveedores <small>{activeSuppliersList.length} / {uniqueSuppliers.length} visibles</small></h3>
                <div className="spot-pills">
                    {uniqueSuppliers.map(supplier => (
                        <button 
                            key={supplier.rut}
                            className={`spot-pill ${filterActive.has(supplier.rut) ? 'active' : ''}`}
                            onClick={() => toggleFilter(supplier.rut)}
                        >
                            {supplier.name}
                        </button>
                    ))}
                </div>
            </section>

            <Legend 
                selectedDoc={selectedDoc} 
                offers={rows} 
                hasAttach={hasAttach}
                onValidation={onValidation} />

            <section className="spot-matrix">
                <div className="spot-matrix-header">
                    <div className="spot-matrix-header-cell">Material</div>
                    {activeSuppliersList.map(supplier => {
                        const isPEP = supplier.PEP?.toLowerCase() === 'x';
                        const isPER = supplier.PER?.toLowerCase() === 'x';
                        const isAR = supplier.AR?.toLowerCase() === 'x';
                        const marks = [isAR ? 'AR' : '', isPEP ? 'PEP' : '', isPER ? 'PER' : ''].filter(Boolean);
                        const otifText = supplier.hasOTIF > 0
                            ? `${Number(supplier.hasOTIF).toFixed(2)} ⚠️` 
                            : 'Sin OTIF';

                        return (
                            <div key={supplier.rut} className="spot-matrix-header-cell spot-supplier-header-cell">
                                <div className="spot-supplier-header-list">
                                    <div className="spot-supplier-header-row">
                                        <span className="spot-supplier-header-label">Nombre:</span>
                                        <span className="spot-supplier-header-value spot-supplier-name">{supplier.name}</span>
                                    </div>
                                    <div className="spot-supplier-header-row">
                                        <span className="spot-supplier-header-label">RUT:</span>
                                        <span className="spot-supplier-header-value spot-supplier-rut">{supplier.rut}</span>
                                    </div>
                                    <div className="spot-supplier-header-row">
                                        <span className="spot-supplier-header-label">Marcas:</span>
                                        <div className="spot-supplier-header-value spot-pep-per-ar">
                                            {marks.length > 0 ? (
                                                <>
                                                    {isAR && <div className="spot-ar-box">AR</div>}
                                                    {isPEP && <div className="spot-pep-box">PEP</div>}
                                                    {isPER && <div className="spot-per-box">PER</div>}
                                                </>
                                            ) : (
                                                <span className="spot-no-marks">Sin marcas</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="spot-supplier-header-row">
                                        <span className="spot-supplier-header-label">OTIF:</span>
                                        <span className="spot-supplier-header-value spot-supplier-rut">{otifText}</span>
                                    </div>
                                    <div className="spot-supplier-header-row">
                                        <span className="spot-supplier-header-label">Entrega prom.:</span>
                                        <span className="spot-supplier-header-value spot-supplier-rut">{supplier.avgDeliveryDays}d</span>
                                        
                                    </div>
                                </div>
                                <div className="spot-supplier-header-total">
                                    <span className="spot-supplier-header-label">Total:</span>
                                    <span className="spot-supplier-header-value spot-supplier-name">USD {Number(supplier.totalBidds).toFixed(2)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {rows.length === 0 ? (
                    <div className="spot-matrix-row">
                        <div className="spot-material-cell">No hay datos disponibles para mostrar.</div>
                    </div>
                ) : (
                    rows.map((row, idx) => (
                        <MatrixRow 
                            key={idx} 
                            row={row} 
                            activeSuppliers={activeSuppliersList}  
                            isClosed={statusDocument?.toLowerCase() === 'cerrada'}
                            onDiscard={onDiscard}
                            onValidation={onValidation}
                            onDetailUpdate={onDetailUpdate}
                        />
                    ))
                )}
            </section>
        </div>
    );
};

const StatBox: React.FC<{ label: string; value: string; modifier?: string }> = ({ label, value, modifier }) => (
    <div className={`spot-stat ${modifier || ''}`}>
        <div className="spot-stat-number">{value}</div>
        <div className="spot-stat-label">{label}</div>
    </div>
);




const Legend: React.FC<{selectedDoc: string; offers: TableDataRow[]; hasAttach: boolean; onValidation: (res: string) => void }> = ({ selectedDoc, offers, hasAttach, onValidation }) => {

    /*const getMaterial = (offers: TableDataRow[]): MaterialSupplier[] => {
        const materials: MaterialSupplier[] = [];

        // Recorremos cada fila de material en la licitación
        offers.forEach((row) => {
            // Verificamos de forma segura que la propiedad suppliers exista y sea un arreglo
            if (row.suppliers && Array.isArray(row.suppliers)) {
                // Recorremos cada proveedor dentro de ese material y lo agregamos al arreglo plano
                row.suppliers.forEach((supplier) => {
                    materials.push(supplier);
                });
            }
        });

        return materials;
    };*/
    
    /*const handleValidation = async () => {
    // Aquí puedes implementar la lógica para manejar la validación de fichas
    console.log("Validar fichas técnicas");

    try {
          // Filtrar solo los materiales (filas) que tengan al menos una oferta con adjunto válido
            const filteredOffers = offers.filter(row => 
                row.suppliers && 
                Array.isArray(row.suppliers) &&
                row.suppliers.some(supplier => 
                    !supplier.ruleOut && 
                    Boolean(supplier.attachmentValueID && supplier.attachmentValueID.trim() !== "")
                )
            );
            const res = await showValidationsPrompt(filteredOffers, selectedDoc);//getMaterial(offers));
        
        if (res) {
            onValidation(JSON.stringify(res));
        }
    } catch (err) {
        console.warn("Descarte/Reincorporación cancelada:", err);
    }


    };*/
    return(

    
    <section className="spot-legend">
        <strong>LEYENDA:</strong>
        <span className="spot-chip best"> </span> <span>Mejor precio (1°)</span>
        <span className="spot-chip second"> </span> <span>mejor precio (2°)</span>
        <span className="spot-chip has-offer"> </span> <span>Con oferta (3°+)</span>
        <span> | </span>
        <span className="spot-chip no-offer"> </span> <span>Sin oferta</span>
        <span className="spot-chip discarded"> </span> <span>Descartado</span>
        <span> | </span>
        <div className="spot-per-box">PER</div> <span>PER</span>
        <div className="spot-pep-box">PEP</div> <span>PEP</span>
        <div className="spot-ar-box">AR</div> <span>AR</span>


       {/* <span 
            className="spot-btn-wrapper"
            title={!hasAttach ? "No hay fichas adjuntas para validar" : ""}
            >
            <button 
                className="spot-btn" 
                disabled={!hasAttach} 
                onClick={handleValidation}
            >
                Validar Fichas
            </button>
        </span>*/}
    </section>

)};

const MatrixRow: React.FC<{ 
    row: TableDataRow; 
    activeSuppliers: IUniqueSupplier[]; 
    isClosed: boolean;
    onDiscard: (res: string) => void;
    onValidation: (email: string) => void;
    onDetailUpdate: (res: string) => void;
}> = ({ row, activeSuppliers, isClosed, onDiscard, onValidation, onDetailUpdate }) => {
    return (
        <div className="spot-matrix-row">
            <div className="spot-material-cell">
                <div className="spot-material-title">{row.materialName}</div>
                <div className="spot-material-meta">Cód. {row.materialNumber} - {row.quantityAmount} {row.quantityUnitCode}</div>
                <div className="spot-last-purchase">
                    Últ. compra <strong>USD {Number(row.lastPurchasePrice).toFixed(2)}</strong> - {row.lastPurchaseDate}
                </div>
                <div className="spot-last-purchase">SOLPED: {row.requisitionId}</div>
                <div className="spot-last-purchase"> <strong> {row.agreement ? "Tiene un convenio que vence el " + row.agreementDate : ""}</strong></div>
                <div className="spot-last-purchase"> <strong> {row.agreement ? row.agreementDetails : ""}</strong></div>
            </div>
            {activeSuppliers.map(supplier => {
                const offer = row.suppliers.find(s => s.rutSupplier === supplier.rut);
                const cellClassName = offer?.esMasBarato === 1 && !offer.ruleOut
                    ? "spot-supplier-cell spot-supplier-cell-best"
                    : "spot-supplier-cell";
                return ( 
                    <div key={supplier.rut} className={cellClassName}>
                        {!offer ? (
                            <div className="spot-no-offer">Sin oferta</div>
                        ) : (
                            <OfferCell 
                                offer={offer} 
                                materialName={row.materialName} 
                                materialNumber={row.materialNumber}
                                isClosed={isClosed}
                                onDiscard={onDiscard}
                                onValidation={onValidation}
                                onDetailUpdate={onDetailUpdate}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const OfferCell: React.FC<{ 
    offer: MaterialSupplier; 
    materialName: string; 
    materialNumber: string;
    isClosed: boolean;
    onDiscard: (res: string) => void;
    onValidation: (email: string) => void;
    onDetailUpdate: (res: string) => void;
}> = ({ offer, materialName, materialNumber, isClosed, onDiscard, onValidation, onDetailUpdate }) => {
    const isBest = offer.esMasBarato === 1;
    const classBid = isBest && !offer.ruleOut ? 'spot-supplier-note-best' : 'spot-supplier-note'; 
    const docType = (offer.resultProcessAI || "").trim().toUpperCase();
    const isTechnicalSheet = docType === "FICHA_TECNICA" || docType === "FICHA_TÉCNICA";
    const validationStatus = offer.validationStatus.trim().toLowerCase();
    const validationIcon = validationStatus === "indeterminado"
        ? "⚠️"
        : validationStatus === "rechazado" || validationStatus === "rechazada"
            ? "❌"
            : "";
    const priceHom = offer.price * (1 + offer.incotermPerc / 100);
    const percHome = offer.price > 0 ? ((priceHom - offer.price) / offer.price) * 100 : 0;



    // SOLUCIÓN CON ASYNC/AWAIT: Código plano, seguro y mucho más legible
    const handleDiscard = async () => {
        try {
            const res = offer.ruleOut 
                ? await window.showDiscardPrompt(materialName, offer.rutSupplier, offer, offer.ruleOutReason, offer.ruleOutObservations)
                : await window.showDiscardPrompt(materialName, offer.rutSupplier, offer);
            
            if (res) {
                onDiscard(JSON.stringify(res));
            }
        } catch (err) {
            console.warn("Descarte/Reincorporación cancelada:", err);
        }
    };

   

    const handleDetail = async () => {
        try {

            const res = await window.showDetailPrompt(materialName, materialNumber, offer);
            
            if (res ) {
                onDetailUpdate(JSON.stringify(res));
            }
        } catch (err) {
            console.warn("Descarte/Reincorporación cancelada:", err);
        }
    };

    return (
        <>
            {/* ... Tu JSX se mantiene exactamente igual abajo ... */}
            <div className="spot-metric-box">{offer.esMasBarato}°</div>
           
            {!isClosed && isBest && offer.attachmentValueID && !offer.ruleOut && 
                <button
                    className="spot-btn-ver"
                    onClick={handleDetail}
                    title={validationIcon ? `Validación: ${offer.validationStatus}` : "Ver detalle de la ficha"}
                >
                    {validationIcon}🔍
                </button>
                
            }
            {!offer.attachmentValueID &&
                <div className={classBid}> "⚠️" SIN FICHA</div>
            }
            {offer.attachmentValueID && !isTechnicalSheet &&
                <div className={classBid}>⚠️ No tiene ficha técnica</div>
            }

         
            
            <div className={`spot-supplier-price ${isBest ? 'spot-supplier-price-best' : ''} 
                ${offer.ruleOut ? 'spot-supplier-price-ruleOut' : ''}`}>
                USD {offer.price.toFixed(2)}
            </div>
            
            <div className={classBid}>
                Prec. Hom.: USD {priceHom.toFixed(2)} - {percHome.toFixed(2)}%
            </div>
            <div className={classBid}>Modelo: {offer.brandModel || "-"}</div>
            <div className={classBid}>Entrega: {offer.deliveryDays} días -  {offer.incoterm || "-"}
            </div>
            <div className={classBid}>
                {offer.hasADD ? "⚠️ Existe un ADD" : ""}
            </div>
            
            {!isClosed && (isBest || offer.ruleOut) && (
                <div className="spot-buttons">
                    {!offer.ruleOut ? (
                        <button className="spot-btn descartar" onClick={handleDiscard}>Descartar</button>
                    ) : (
                        <button className="spot-btn reincorporar" onClick={handleDiscard}>Reincorporar</button>
                    )}
                </div>
            )}
        </>
    );
};
