import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { SPOTApp as SPOTAppGrid, ISPOTAppProps } from "./components/SPOTApp";
import { TableDataRow, MaterialSupplier, userTableRow } from "./interfaces";

// Import existing prompt functions
import { showDiscardPrompt } from "./discardPrompt";
import { showDetailPrompt } from "./detailPrompt";
import { showValidationsPrompt } from "./validationsPrompt";

// Expose prompts to window
window.showDiscardPrompt = showDiscardPrompt;
window.showDetailPrompt = showDetailPrompt;
window.showValidationsPrompt = showValidationsPrompt;

export class SPOTApp implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _notifyOutputChanged: () => void;
    private _props: ISPOTAppProps;
    private _discardData: string | undefined;
    private _validationEmail: string | undefined;
    private _closeData: string | undefined;

    //constructor() {}

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._container = container;
        this._notifyOutputChanged = notifyOutputChanged;
        this._container.style.height = "100%";
        this._container.style.overflow = "hidden";  
        
        this._props = {
            gridTitle: context.parameters.gridTitle?.raw || "Matriz SPOT",
            rows: this.parseTableData(context.parameters.tableData?.raw),
           // user365Users: this.parseUsuariosTable(context.parameters.usuariosEmpresa?.raw),
            onDiscard: (result: string) => {
                this._discardData = result;
                this._validationEmail = ""; // Clear validation email if discard action is taken
                this._notifyOutputChanged();
            },
            onValidation: (email: string) => {
                this._validationEmail = email;
                this._discardData = ""; // Clear discard data if validation action is taken
                this._notifyOutputChanged();
            },
            onClose:(result: string) => {
                this._closeData = result;
                this._discardData = "";
                this._validationEmail = ""; // Clear validation email if discard action is taken
                this._notifyOutputChanged();
            }
        };

        this.render();
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this._props.gridTitle = context.parameters.gridTitle?.raw || "Matriz SPOT";
        this._props.rows = this.parseTableData(context.parameters.tableData?.raw);
        //this._props.user365Users = this.parseUsuariosTable(context.parameters.usuariosEmpresa?.raw),
       // this._props.onDiscard = this.handleOnDiscard.bind(this);

        this.render();
    }

    public getOutputs(): IOutputs {
        return {
            datosDescarte: this._discardData,
            correoValidacion: this._validationEmail,
            cerrarOferta: this._closeData
        };
    }

    public destroy(): void {
        ReactDOM.unmountComponentAtNode(this._container);
    }

    private render(): void {
        ReactDOM.render(
            React.createElement(SPOTAppGrid, this._props),
            this._container
        );
    }

    private parseUsuariosTable(raw: string | null | undefined): userTableRow[] {
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            const retur = parsed.map((u: userTableRow) => ({
                DisplayName: u.DisplayName,
                Mail: u.Mail
            }));
            return retur;
        } catch (e) {
            console.error("Error parsing usuarios table data", e);
            return [];
        }
    }

    private parseTableData(raw: string | null | undefined): TableDataRow[] {
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed.map((item: { 
                materialName?: string; 
                requisitionId?: string; 
                materialNumber?: string; 
                quantityAmount?: string | number; 
                quantityUnitCode?: string; 
                id?: number; 
                lastPurchasePrice?: number; 
                lastPurchaseDate?: string; 
                suppliers?: unknown[]; 
                agreement: boolean;
                agreementDate: string;
                agreementDetails: string;
            }) => ({
                materialName: String(item.materialName ?? ""),
                requisitionId: String(item.requisitionId ?? ""),
                materialNumber: String(item.materialNumber ?? ""),
                quantityAmount: item.quantityAmount ?? "",
                quantityUnitCode: String(item.quantityUnitCode ?? ""),
                id: Number(item.id ?? 0),
                lastPurchasePrice: Number(item.lastPurchasePrice ?? 0),
                lastPurchaseDate: String(item.lastPurchaseDate ?? "N/A"),
                agreement: Boolean(item.agreement),
                agreementDate: String(item.agreementDate ?? "") || null,
                agreementDetails: String(item.agreementDetails ?? "") || null,                
                suppliers: Array.isArray(item.suppliers)
                    ? item.suppliers
                        .map((s) => this.normalizeSupplier(s as Record<string, unknown>))
                        .filter((s): s is MaterialSupplier => s !== null)
                    : []
            }));
        } catch (e) {
            console.error("Error parsing table data", e);
            return [];
        }
    }

    private normalizeSupplier(supplier: Record<string, unknown>): MaterialSupplier | null {
        if (!supplier || typeof supplier !== "object") return null;
        return {
            rutSupplier: String(supplier.rutSupplier ?? ""),
            PEP: String(supplier.PEP ?? ""),
            PER: String(supplier.PER ?? ""),
            AR: String(supplier.AR ?? ""),
            supplierName: String(supplier.supplierName ?? ""),
            brandModel: String(supplier.brandModel ?? ""),
            deliveryDays: Number(supplier.deliveryDays) || 0,
            avgDeliveryDays: String(supplier.avgDeliveryDays ?? ""),
            price: Number(supplier.price) || 0,
            esMasBarato: Number(supplier.esMasBarato) || 0,
            incoterm: String(supplier.incoterm ?? ""),
            incotermPerc: Number(supplier.incotermPerc) || 0,
            ruleOut: Boolean(supplier.ruleOut ?? false),
            ruleOutReason: Array.isArray(supplier.ruleOutReason) ? supplier.ruleOutReason.map(String) : [],
            ruleOutObservations: String(supplier.ruleOutObservations ?? "") || null,
            id: Number(supplier.id ?? 0),
            hasADD: Boolean(supplier.hasADD),
            hasOTIF: Boolean(supplier.hasOTIF),
            resultProcessAI: String(supplier.resultProcessAI ?? ""),
            confidenceRating: Number(supplier.confidenceRating) || 0,
            summaryJustification: String(supplier.summaryJustification ?? ""),
            fileBase64: String(supplier.fileBase64 ?? ""),
            mimeType:String(supplier.mimeType ?? ""),
            onValidation: Boolean(supplier.onValidation ?? false),
            validationStatus: String(supplier.validationStatus ?? ""),
            attachmentValueID: String(supplier.attachmentValueID ?? ""),
            attachmentFileName: String(supplier.attachmentFileName ?? "")
        };
    }
}
