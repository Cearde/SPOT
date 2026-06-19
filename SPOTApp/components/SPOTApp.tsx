import * as React from "react";
import { useState, useEffect } from "react";
import { TableDataRow, MaterialSupplier, TableStats, userTableRow } from "../interfaces";

export interface ISPOTAppProps {
    gridTitle: string;
    rows: TableDataRow[];
    onDiscard: (result: string) => void;
    onValidation: (email: string) => void;
}

interface IUniqueSupplier {
    rut: string;
    name: string;
    avgDeliveryDays: string;
    PEP: string;
    PER: string;
    AR: string;
    hasOTIF: boolean;
}

export const SPOTApp: React.FC<ISPOTAppProps> = ({ gridTitle, rows, onDiscard, onValidation }) => {
    const [filterActive, setFilterActive] = useState<Set<string>>(new Set());
    const [uniqueSuppliers, setUniqueSuppliers] = useState<IUniqueSupplier[]>([]);
   // const [users, setUsers] = useState<userTableRow[]>([]); // State to hold O365 users

    useEffect(() => {
        const suppliers = getUniqueSupplierRuts(rows);
        setUniqueSuppliers(suppliers);
        setFilterActive(new Set(suppliers.map(s => s.rut)));
    }, [rows]);

    const getUniqueSupplierRuts = (dataRows: TableDataRow[]): IUniqueSupplier[] => {
        const seen = new Set<string>();
        const unique: IUniqueSupplier[] = [];
        dataRows.forEach((row) => {
            row.suppliers.forEach((supplier) => {
                if (supplier.rutSupplier && !seen.has(supplier.rutSupplier)) {
                    seen.add(supplier.rutSupplier);
                    unique.push({ 
                        rut: supplier.rutSupplier, 
                        name: supplier.supplierName, 
                        avgDeliveryDays: supplier.avgDeliveryDays, 
                        PEP: supplier.PEP, 
                        PER: supplier.PER, 
                        AR: supplier.AR,
                        hasOTIF: supplier.hasOTIF
                    });
                }
            });
        });
        return unique;
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

    const stats = calculateStats();
    const activeSuppliersList = uniqueSuppliers.filter(s => filterActive.has(s.rut));

    return (
        <div className="spot-app">
            <section className="spot-card">
                <h1 className="spot-card-title">{gridTitle}</h1>
                <p className="spot-card-subtitle">Comparativa de ofertas de materiales y proveedores para la licitación 1.1.6</p>
                                    <div className="spot-stats">
                    <StatBox label="Total proveedores" value={stats.totalSuppliers.toString()} />
                    <StatBox label="Proveedores calificados" value={stats.qualifiedSuppliers.toString()} modifier="highlight" />
                    <StatBox label="Proveedores descartados" value={stats.discardedSuppliers.toString()} modifier="danger" />
                    <StatBox label="Materiales totales" value={stats.totalMaterials.toString()} />
                    <StatBox label="Materiales sin oferta" value={stats.materialsWithoutOffer.toString()} modifier="warning" />
                </div>
                <div className="spot-actions">
                    <select><option>Menor precio unitario</option></select>
                    <div className="spot-buttons">
                        <button className="spot-btn">Descargar informe</button>
                        <button className="spot-btn primary">Cerrar licitación</button>
                    </div>
                </div>
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

            <Legend />

            <section className="spot-matrix">
                <div className="spot-matrix-header">
                    <div className="spot-matrix-header-cell">Material</div>
                    {activeSuppliersList.map(supplier => (
                        <div key={supplier.rut} className="spot-matrix-header-cell">
                            <div className="spot-supplier-name">{supplier.name}</div>
                            <div className="spot-pep-per-ar">
                                {supplier.PEP.toLowerCase() === 'x' && <div className="spot-pep-box">PEP</div>}
                                {supplier.PER.toLowerCase() === 'x' && <div className="spot-per-box">PER</div>}
                                {supplier.AR.toLowerCase() === 'x' && <div className="spot-ar-box">AR</div>}
                            </div>
                            <div className="spot-supplier-rut">{supplier.rut}
                                {supplier.hasOTIF ? (
                                    <span className="spot-otif-indicator" title="Proveedor con OTIF existente"> ⚠️ Existe OTIF</span>
                                ):""
                                }

                            </div>
                            <div className="spot-supplier-metrics">
                                <div className="spot-metric-box">5/8</div>
                                <div className="spot-metric-box">{supplier.avgDeliveryDays}d prom.</div>
                            </div>
                        </div>
                    ))}
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
                            onDiscard={onDiscard}
                            onValidation={onValidation}
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

const Legend: React.FC = () => (
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
    </section>
);

const MatrixRow: React.FC<{ 
    row: TableDataRow; 
    activeSuppliers: IUniqueSupplier[]; 
    onDiscard: (res: string) => void;
    onValidation: (email: string) => void;
}> = ({ row, activeSuppliers,  onDiscard, onValidation }) => {
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
                let bgStyle = "spot-supplier-cell";
                if(offer) {
                    bgStyle = offer.esMasBarato ===1 && offer.ruleOut === false ? "spot-supplier-cell spot-supplier-price-best" : 
                                    offer.esMasBarato === 2 && offer.ruleOut === false? "spot-supplier-cell spot-supplier-price-second" :
                                         "spot-supplier-cell";
                }
               /* else {
                    bgStyle = "spot-supplier-cell";
                }*/
                return ( 
                    <div key={supplier.rut} className={bgStyle}>
                        {!offer ? (
                            <div className="spot-no-offer">Sin oferta</div>
                        ) : (
                            <OfferCell 
                                offer={offer} 
                                materialName={row.materialName} 
                                materialNumber={row.materialNumber}
                                onDiscard={onDiscard}
                                onValidation={onValidation}
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
    onDiscard: (res: string) => void;
    onValidation: (email: string) => void;
}> = ({ offer, materialName, materialNumber, onDiscard, onValidation }) => {
    const isBest = offer.esMasBarato === 1;
    const isSecond = offer.esMasBarato === 2;
    
    const priceHom = offer.price * (1 + offer.incotermPerc / 100);
    const percHome = offer.price > 0 ? ((priceHom - offer.price) / offer.price) * 100 : 0;

    // SOLUCIÓN CON ASYNC/AWAIT: Desaparece el error del .then()
    const handleValidations= async () => {
        try {
            const res = await window.showValidationsPrompt(materialName, offer.rutSupplier, offer);
            if (res && res.email) {
                onValidation(JSON.stringify(res));
            }
        } catch (err) {
            console.warn("Validación cancelada o fallida:", err);
        }
    };

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
            
            if (res && res.email) {
                onValidation(JSON.stringify(res));
            }
        } catch (err) {
            console.warn("Descarte/Reincorporación cancelada:", err);
        }
    };

    return (
        <>
            {/* ... Tu JSX se mantiene exactamente igual abajo ... */}
            <div className="spot-metric-box">{offer.esMasBarato || "-"}°</div>
            <button className="spot-btn-ver" onClick={handleDetail}>🔍</button>
            {offer.esMasBarato === 1 && !offer.ruleOut && <button className="spot-btn-aprobar" onClick={handleValidations}>📄</button>}
            
            
            <div className={`spot-supplier-price ${isBest ? 'spot-supplier-price-best' : isSecond ? 'spot-supplier-price-second' : ''} ${offer.ruleOut ? 'spot-supplier-price-ruleOut' : ''}`}>
                USD {offer.price.toFixed(2)}
            </div>
            
            <div className={isBest || isSecond ? 'spot-supplier-note-best' : 'spot-supplier-note'}>
                Prec. Hom.: USD {priceHom.toFixed(2)} - {percHome.toFixed(2)}%
            </div>
            <div className={isBest || isSecond ? 'spot-supplier-note-best' : 'spot-supplier-note'}>Modelo: {offer.brandModel || "-"}</div>
            <div className={isBest || isSecond ? 'spot-supplier-note-best' : 'spot-supplier-note'}>Entrega: {offer.deliveryDays} días -  {offer.incoterm || "-"}
                {offer.hasADD ? "⚠️ Existe un ADD" : ""}

            </div>
            
            <div className="spot-buttons">
                {!offer.ruleOut ? (
                    <button className="spot-btn descartar" onClick={handleDiscard}>Descartar</button>
                ) : (
                    <button className="spot-btn reincorporar" onClick={handleDiscard}>Reincorporar</button>
                )}
            </div>
        </>
    );
};
