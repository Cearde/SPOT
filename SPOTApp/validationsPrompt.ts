import * as React from "react";
import * as ReactDOM from "react-dom";
import { 
    NormalPeoplePicker, 
    IBasePickerSuggestionsProps 
} from "@fluentui/react/lib/Pickers";
import { IPersonaProps } from "@fluentui/react/lib/Persona";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import { MaterialSupplier, validationsPromptResult,userTableRow } from "./interfaces";

// Inicializamos los íconos Fluent de Microsoft
initializeIcons();

interface IValidationModalProps {
    materialName: string;
    rutSupplier: string;
    offer: MaterialSupplier;
    availableUsers: IPersonaProps[];
    onConfirm: (email: string) => void;
    onCancel: () => void;
}

// 1. Componente construido sin usar JSX (Válido para archivos .ts)
class ValidationModal extends React.Component<IValidationModalProps, { selectedUser: IPersonaProps | null }> {
    constructor(props: IValidationModalProps) {
        super(props);
        this.state = { selectedUser: null };
    }

    private onFilterChanged = (filterText: string): IPersonaProps[] => {
        if (!filterText) return [];
        return this.props.availableUsers.filter(item => 
            (item.text || "").toLowerCase().indexOf(filterText.toLowerCase()) !== -1 ||
            (item.secondaryText || "").toLowerCase().indexOf(filterText.toLowerCase()) !== -1
        );
    };

    private handleConfirm = () => {
        if (!this.state.selectedUser || !this.state.selectedUser.secondaryText) {
            alert("Por favor, busca y selecciona un validador de la lista.");
            return;
        }
        this.props.onConfirm(this.state.selectedUser.secondaryText);
    };

    render() {
        const suggestionProps: IBasePickerSuggestionsProps = {
            suggestionsHeaderText: 'Personas sugeridas',
            noResultsFoundText: 'No se encontraron resultados',
            loadingText: 'Buscando...',
        };

        // Construimos el árbol de elementos usando React.createElement para saltarnos el JSX
        return React.createElement("div", { className: "spot-modal" },
            React.createElement("div", { className: "spot-modal-overlay", onClick: this.props.onCancel }),
            React.createElement("div", { className: "spot-modal-content", style: { overflow: 'visible' } },
                React.createElement("h3", { className: "spot-modal-title" }, "Aprobar Oferta"),
                React.createElement("p", null, "Estás enviando a validar la ficha técnica de esta oferta:"),
                React.createElement("p", null, React.createElement("strong", null, this.props.materialName)),
                React.createElement("p", null, "Proveedor: ", React.createElement("strong", null, `${this.props.offer.supplierName} (${this.props.rutSupplier})`)),
                
                React.createElement("div", { className: "spot-input-group", style: { marginTop: '15px' } },
                    React.createElement("label", null, React.createElement("strong", null, "Usuario Revisor (Validador):")),
                    React.createElement("div", { style: { marginTop: '8px' } },
                        // Inyectamos el People Picker Nativo de Microsoft
                        React.createElement(NormalPeoplePicker, {
                            onResolveSuggestions: this.onFilterChanged,
                            getTextFromItem: (item: IPersonaProps) => item.text || '',
                            pickerSuggestionsProps: suggestionProps,
                            key: "normal-people-picker",
                            onChange: (items?: IPersonaProps[]) => {
                                if (items && items.length > 0) this.setState({ selectedUser: items[0] });
                                else this.setState({ selectedUser: null });
                            },
                            itemLimit: 1,
                            inputProps: { placeholder: "Escribe el nombre o correo del revisor..." }
                        })
                    )
                ),
                
                React.createElement("div", { className: "spot-modal-actions", style: { marginTop: '30px' } },
                    React.createElement("button", { className: "spot-btn", onClick: this.props.onCancel }, "Cancelar"),
                    React.createElement("button", { className: "spot-btn primary", onClick: this.handleConfirm }, "Aceptar")
                )
            )
        );
    }
}

// 2. Función puente que llama tu index.ts
export function showValidationsPrompt(
    materialName: string,
    rutSupplier: string,
    offer: MaterialSupplier,
    rawUsers: userTableRow[] = []// { displayName: string; mail: string; }[] = []
): Promise<validationsPromptResult | null> {
    return new Promise((resolve) => {
        const modalId = "spot-validation-modal";
        let targetDiv = document.getElementById(modalId) as HTMLDivElement;
        
        if (targetDiv) {
            ReactDOM.unmountComponentAtNode(targetDiv);
            targetDiv.remove();
        }

        targetDiv = document.createElement("div");
        targetDiv.id = modalId;
        document.body.appendChild(targetDiv);
        document.body.style.overflow = "hidden";
       
        const formattedUsers: IPersonaProps[] = rawUsers.map(u => ({
            text: u.DisplayName,
            secondaryText: u.Mail
        }));

        const closePrompt = () => {
            ReactDOM.unmountComponentAtNode(targetDiv);
            targetDiv.remove();
            document.body.style.overflow = "";
        };

        // Renderizamos el componente usando React.createElement
        ReactDOM.render(
            React.createElement(ValidationModal, {
                materialName,
                rutSupplier,
                offer,
                availableUsers: formattedUsers,
                onConfirm: (email) => {
                    closePrompt();
                    resolve({ id: offer.id, materialName, rutSupplier, email });
                },
                onCancel: () => {
                    closePrompt();
                    resolve(null);
                }
            }),
            targetDiv
        );
    });
}