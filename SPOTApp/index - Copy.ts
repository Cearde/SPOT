import { IInputs, IOutputs } from "./generated/ManifestTypes";

interface TableDataRow {
    materialName: string;
    materialNumber: string;
    quantityAmount: string;
    quantityUnitCode: string;
    suppliers: {
        rutSupplier: string;
        brandModel: string;
        deliveryDays: number;
        price: number;
        incoterm: string;
        esMasBarato: boolean;
    }[];
}

export class SPOTApp implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;

    /**
     * Empty constructor.
     */
    constructor() {
        // Empty
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._container = container;
        this._container.style.overflowX = "auto"; // Enable horizontal scrolling for the table
        this._container.style.overflowY = "auto";
       

    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this._container.innerHTML = ""; // Clear previous content

        const gridTitle = context.parameters.gridTitle.raw || "Dynamic Table"; // Get title, default if not provided
        const tableDataString = context.parameters.tableData.raw;

        // Add title to the grid
        const titleElement = document.createElement("h3");
        titleElement.innerText = gridTitle;
        titleElement.style.textAlign = "center";
        titleElement.style.marginBottom = "10px";
        this._container.appendChild(titleElement);


        if (!tableDataString) {
            this._container.innerText += "No table data provided."; // Append to existing content
            return;
        }

        let data: TableDataRow[];
        try {
            data = JSON.parse(tableDataString);
        } catch (e) {
            this._container.innerText += "Invalid JSON data provided."; // Append to existing content
            console.error("Error parsing tableData JSON:", e);
            return;
        }

        if (!data || data.length === 0) {
            this._container.innerText += "No data to display."; // Append to existing content
            return;
        }

        // Extract unique rutSuppliers
        const allRutSuppliers = new Set<string>();
        data.forEach(row => {
            row.suppliers.forEach(supplier => {
                allRutSuppliers.add(supplier.rutSupplier);
            });
        });
        const uniqueRutSuppliers = Array.from(allRutSuppliers).sort(); // Sort for consistent column order

        // Create table element
        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.fontFamily = "Segoe UI, Arial, sans-serif";
        table.style.fontSize = "12px";

        // Create table header
        const thead = document.createElement("thead");
        const headerRow1 = document.createElement("tr");
        const headerRow2 = document.createElement("tr");

        const materialNameHeader1 = document.createElement("th");
        materialNameHeader1.rowSpan = 2;
        materialNameHeader1.innerText = "Material";
        materialNameHeader1.style.border = "1px solid #ccc";
        materialNameHeader1.style.padding = "8px";
        materialNameHeader1.style.backgroundColor = "#f2f2f2";
        materialNameHeader1.style.textAlign = "center";
        materialNameHeader1.style.minWidth = "350px"; // Set width for material column
        headerRow1.appendChild(materialNameHeader1);
        
        const materialNumberHeader1 = document.createElement("th");
        materialNumberHeader1.rowSpan = 2;
        materialNumberHeader1.innerText = "Código Material";
        materialNumberHeader1.style.border = "1px solid #ccc";
        materialNumberHeader1.style.padding = "8px";
        materialNumberHeader1.style.backgroundColor = "#f2f2f2";
        materialNumberHeader1.style.textAlign = "center";
        headerRow1.appendChild(materialNumberHeader1);

        

        const quantityAmountHeader1 = document.createElement("th");
        quantityAmountHeader1.rowSpan = 2;
        quantityAmountHeader1.innerText = "Cantidad";
        quantityAmountHeader1.style.border = "1px solid #ccc";
        quantityAmountHeader1.style.padding = "8px";
        quantityAmountHeader1.style.backgroundColor = "#f2f2f2";
        quantityAmountHeader1.style.textAlign = "center";
        headerRow1.appendChild(quantityAmountHeader1);

        const quantityUnitCodeHeader1 = document.createElement("th");
        quantityUnitCodeHeader1.rowSpan = 2;
        quantityUnitCodeHeader1.innerText = "UDM";
        quantityUnitCodeHeader1.style.border = "1px solid #ccc";
        quantityUnitCodeHeader1.style.padding = "8px";
        quantityUnitCodeHeader1.style.backgroundColor = "#f2f2f2";
        quantityUnitCodeHeader1.style.textAlign = "center";
        headerRow1.appendChild(quantityUnitCodeHeader1);

        uniqueRutSuppliers.forEach(rutSupplier => {
            const rutSupplierHeader = document.createElement("th");
            rutSupplierHeader.colSpan = 6; // Each rutSupplier gets 4 columns
            rutSupplierHeader.innerText = rutSupplier;
            rutSupplierHeader.style.border = "1px solid #ccc";
            rutSupplierHeader.style.padding = "8px";
            rutSupplierHeader.style.backgroundColor = "#e0e0e0";
            rutSupplierHeader.style.textAlign = "center";
            headerRow1.appendChild(rutSupplierHeader);
        });
        thead.appendChild(headerRow1);

        // Second header row: sub-headers for each rutSupplier
        uniqueRutSuppliers.forEach(() => {
            [ "Precio Unitario", "Precio Homologado","Variación Precio Unitario","Días de Entrega", "Incoterm","Modelo"].forEach(subHeader => {
                const th = document.createElement("th");
                th.innerText = subHeader;
                th.style.border = "1px solid #ccc";
                th.style.padding = "8px";
                th.style.backgroundColor = "#f9f9f9";
                th.style.textAlign = "center";
                th.style.flexWrap = "wrap"; // Allow text to wrap if it's too long
                headerRow2.appendChild(th);
            });
        });
        thead.appendChild(headerRow2);
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement("tbody");
        data.forEach(rowData => {
            const tr = document.createElement("tr");

            const materialNameCell = document.createElement("td");
            materialNameCell.innerText = rowData.materialName;
            materialNameCell.style.border = "1px solid #ccc";
            materialNameCell.style.padding = "8px";
            materialNameCell.style.verticalAlign = "top";
            materialNameCell.style.textAlign = "left"; // Set width for material column
            tr.appendChild(materialNameCell);

            const materialNumberCell = document.createElement("td");
            materialNumberCell.innerText = rowData.materialNumber;
            materialNumberCell.style.border = "1px solid #ccc";
            materialNumberCell.style.padding = "8px";
            materialNumberCell.style.verticalAlign = "top";
            tr.appendChild(materialNumberCell);

            const quantityAmountCell = document.createElement("td");
            quantityAmountCell.innerText = rowData.quantityAmount;
            quantityAmountCell.style.border = "1px solid #ccc";
            quantityAmountCell.style.padding = "8px";
            quantityAmountCell.style.verticalAlign = "top";
            tr.appendChild(quantityAmountCell);

            const quantityUnitCodeCell = document.createElement("td");
            quantityUnitCodeCell.innerText = rowData.quantityUnitCode;
            quantityUnitCodeCell.style.border = "1px solid #ccc";
            quantityUnitCodeCell.style.padding = "8px";
            quantityUnitCodeCell.style.verticalAlign = "top";
            tr.appendChild(quantityUnitCodeCell);

            uniqueRutSuppliers.forEach(rutSupplier => {
                const supplierData = rowData.suppliers.find(s => s.rutSupplier === rutSupplier);

                const priceCell = document.createElement("td");
                priceCell.innerText = supplierData ? supplierData.price.toFixed(2) : "-"; // Format price
                priceCell.style.border = "1px solid #ccc";
                priceCell.style.padding = "8px";
                priceCell.style.backgroundColor = supplierData ? (supplierData.esMasBarato ? "#d4edda" : "transparent") : "transparent"; // Green for cheapest, red for others
                tr.appendChild(priceCell);

                const priceH = document.createElement("td");
                priceH.innerText = supplierData ? supplierData.price.toFixed(2) : "-"; // Format price
                priceH.style.border = "1px solid #ccc";
                priceH.style.padding = "8px";
                priceH.style.backgroundColor = supplierData ? (supplierData.esMasBarato ? "#d4edda" : "transparent") : "transparent"; // Green for cheapest, red for others
                tr.appendChild(priceH);

                const priceV = document.createElement("td");
                priceV.innerText = supplierData ? supplierData.price.toFixed(2) : "-"; // Format price
                priceV.style.border = "1px solid #ccc";
                priceV.style.padding = "8px";
                priceV.style.backgroundColor = supplierData ? (supplierData.esMasBarato ? "#d4edda" : "transparent") : "transparent"; // Green for cheapest, red for others
                tr.appendChild(priceV);

                const deliveryDaysCell = document.createElement("td");
                deliveryDaysCell.innerText = supplierData ? supplierData.deliveryDays.toString() : "-";
                deliveryDaysCell.style.border = "1px solid #ccc";
                deliveryDaysCell.style.padding = "8px";
                deliveryDaysCell.style.backgroundColor = supplierData ? (supplierData.esMasBarato ? "#d4edda" : "transparent") : "transparent"; // Green for cheapest, red for others
                tr.appendChild(deliveryDaysCell);

                

                const incotermCell = document.createElement("td");
                incotermCell.innerText = supplierData ? supplierData.incoterm : "-";
                incotermCell.style.border = "1px solid #ccc";
                incotermCell.style.padding = "8px";
                incotermCell.style.backgroundColor = supplierData ? (supplierData.esMasBarato ? "#d4edda" : "transparent") : "transparent"; // Green for cheapest, red for others
                tr.appendChild(incotermCell);

                const brandModelCell = document.createElement("td");
                brandModelCell.innerText = supplierData ? supplierData.brandModel : "-";
                brandModelCell.style.border = "1px solid #ccc";
                brandModelCell.style.padding = "8px";
                brandModelCell.style.backgroundColor = supplierData ? (supplierData.esMasBarato ? "#d4edda" : "transparent") : "transparent"; // Green for cheapest, red for others
                tr.appendChild(brandModelCell);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        this._container.appendChild(table);
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }
}
