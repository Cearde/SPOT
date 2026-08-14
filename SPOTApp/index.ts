import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { SPOTApp as SPOTAppGrid, ISPOTAppProps } from "./components/SPOTApp";
import { TableDataRow, MaterialSupplier,  IBiddingDocument } from "./interfaces";

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
    //private _statusDocument: string | undefined;
    private _detailUpdate: string | undefined;

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
        //(window as any).pcfContext = context;
        
       // this._selectedDocument = context.parameters.selectedDocument?.raw ?? undefined;

        this._props = {
            gridTitle: context.parameters.gridTitle?.raw || "Matriz SPOT",
            statusDocument: context.parameters.statusDocument?.raw || "",
            rows: this.parseTableData(context.parameters.tableData?.raw),
            onDiscard: (result: string) => {
                this._discardData = result;
                this._detailUpdate = "";
                this._validationEmail = "";
                this._closeData = "";
               // this._statusDocument = "";
                this._notifyOutputChanged();
            },
            onValidation: (email: string) => {
                this._validationEmail = email;
               // this._statusDocument = "";
                this._closeData = "";
                this._discardData = ""; 
                this._detailUpdate = "";
                this._notifyOutputChanged();
            },
            onClose:(result: string) => {
                this._closeData = result;
              //  this._statusDocument = "";
                this._discardData = "";
                this._validationEmail = "";
                this._detailUpdate = "";
                this._notifyOutputChanged();
            },
            onDetailUpdate:(result: string) =>{
                
                this._detailUpdate = result;
                this._closeData = "";
                //this._statusDocument = "";
                this._discardData = "";
                this._validationEmail = "";
                this._notifyOutputChanged();

            },
            biddingDocuments: this.parseBiddingDocument(context.parameters.biddingDocuments?.raw),
            //selectedDocument: this._selectedDocument,
           /* onDocumentChange: (status: string) => {
                this._statusDocument = status;
                this._closeData = "";
                this._discardData = "";
                this._validationEmail = "";              
                this._detailUpdate = "";
                this._notifyOutputChanged();
            }*/
        };

        this.render();
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this._props.gridTitle = context.parameters.gridTitle?.raw || "Matriz SPOT";
        this._props.rows = this.parseTableData(context.parameters.tableData?.raw);
        this._props.biddingDocuments = this.parseBiddingDocument(context.parameters.biddingDocuments?.raw);
        //this._props.selectedDocument = context.parameters.selectedDocument?.raw ?? "";
        

        this.render();
    }

    public getOutputs(): IOutputs {
        return {
            datosDescarte: this._discardData,
            correoValidacion: this._validationEmail,
            cerrarOferta: this._closeData,
            //statusDocument: this._statusDocument,
            updateDetail: this._detailUpdate
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

    private parseBiddingDocument(bids: string | null | undefined): IBiddingDocument[] {
        if (!bids) return [];
        try {
            const parsed = JSON.parse(bids);
            if (!Array.isArray(parsed)) return [];
            return parsed.map((item: { eventID: string; eventName: string; }) => ({
                value: String(item.eventID),
                label: String(item.eventID)
            }));
        } catch (e) {
            console.error("Error parsing biddingDocuments data", e);
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
            eventID: String(supplier.eventID ?? ""),
            requisitionId: String(supplier.requisitionId ?? ""),
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
            hasOTIF: Number(supplier.hasOTIF ?? 0),
            resultProcessAI: String(supplier.resultProcessAI ?? ""),
            confidenceRating: Number(supplier.confidenceRating) || 0,
            summaryJustification: String(supplier.summaryJustification ?? ""),
            fileBase64: String(supplier.fileBase64 ?? ""),
            mimeType:String(supplier.mimeType ?? ""),
            onValidation: Boolean(supplier.onValidation ?? false),
            validationStatus: String(supplier.validationStatus ?? ""),
            validationComment: String(supplier.validationComment ?? ""),
            validationAlert: Boolean(supplier.validationAlert ?? false),
            attachmentValueID: String(supplier.attachmentValueID ?? ""),
            attachmentFileName: String(supplier.attachmentFileName ?? ""),
           // totalBidds: Number(supplier.totalBidds) || 0
        };
    }
}