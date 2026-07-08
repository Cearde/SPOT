export interface MaterialSupplier {
    rutSupplier: string;
    supplierName: string; // Added supplierName
    avgDeliveryDays: string;
    brandModel: string;
    deliveryDays: number;
    price: number;
    esMasBarato: number;// | 0 | 1 | 2 | 3;
    incoterm: string;
    incotermPerc: number;
    PEP   : string; 
    PER   : string; 
    AR   : string; 
    ruleOut: boolean;
    ruleOutReason: string[] ;
    ruleOutObservations: string | null;
    id: number;
    hasADD: boolean;
    hasOTIF: boolean;
    resultProcessAI: string;
    confidenceRating: number;
    summaryJustification: string;
    fileBase64:string;
    mimeType:string;
    onValidation:boolean;
	validationStatus:string;
    validationComment: string;
    validationAlert: boolean;
    attachmentValueID:string;
    attachmentFileName:string;
    totalBidds: number;
    
    //discardReasons: string[]  | null;
   // discardObservations: string | null;
}

export interface TableDataRow {
    materialName: string;
    materialNumber: string;
    quantityAmount: number | string;
    quantityUnitCode: string;
    suppliers: MaterialSupplier[];
    requisitionId: string;
    lastPurchasePrice: number;
    lastPurchaseDate: string;
    agreement: boolean;
    agreementDate: string | null;
    agreementDetails: string | null;
}



export interface TableStats {
    totalSuppliers: number;
    qualifiedSuppliers: number;
    discardedSuppliers: number;
    totalMaterials: number;
    materialsWithoutOffer: number;
}
/*
export interface DiscardPromptResult {
    materialName: string;
    rutSupplier: string;
    offer: MaterialSupplier;
    reasons: string[];
    observations: string | null;
}*/

export interface DiscardPromptResult {
    id: number;
    materialName: string;
    rutSupplier: string;
    supplierName: string; // Added supplierName
    offer: MaterialSupplier;
    reasons: string[];
    observations: string | null;
}

export interface validationsPromptResult {
    //id: number;
    //materialName: string;
    //rutSupplier: string;
    email: string;
    eventID:string;
    selectedFichas: selectedFicha[];
}

export interface selectedFicha {
    selected:boolean;
    materialNumber:string;
    materialName:string;

}

export interface CloseBiddingResult {
    decision: boolean;  // true si presiona "Aceptar", false si presiona "Cancelar"
    email: string;      // Correo electrónico ingresado (cadena vacía si no se especificó)
}

export interface IBiddingDocument {
    value: string;
    label: string;
}
