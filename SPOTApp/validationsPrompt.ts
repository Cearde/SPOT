import * as React from "react";
import * as ReactDOM from "react-dom";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import { MaterialSupplier, validationsPromptResult, userTableRow } from "./interfaces";

// Inicializamos los íconos Fluent de Microsoft
initializeIcons();

interface IValidationModalProps {
    materialName: string;
    rutSupplier: string;
    offer: MaterialSupplier;
    onConfirm: (emails: string) => void;
    onCancel: () => void;
}

interface IValidationModalState {
    emailsText: string;
    error: string | null;
}

// Componente construido sin usar JSX (ideal para compatibilidad directa en archivos .ts)
class ValidationModal extends React.Component<IValidationModalProps, IValidationModalState> {
    constructor(props: IValidationModalProps) {
        super(props);
        this.state = { 
            emailsText: "",
            error: null
        };
    }

    private handleConfirm = () => {
        const { emailsText } = this.state;
        
        if (!emailsText || !emailsText.trim()) {
            this.setState({ error: "Por favor, ingresa al menos un correo electrónico." });
            return;
        }

        // Dividir los correos por punto y coma, limpiar espacios vacíos y filtrar elementos vacíos
        const emails = emailsText.split(';').map(email => email.trim()).filter(Boolean);
        
        // Expresión regular simple para validar formato de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emails.filter(email => !emailRegex.test(email));

        if (invalidEmails.length > 0) {
            this.setState({ 
                error: `Formato de correo inválido en: ${invalidEmails.join(', ')}` 
            });
            return;
        }

        this.setState({ error: null });
        // Retornamos la cadena completa de correos tal cual la ingresó el usuario
        this.props.onConfirm(emailsText);
    };

    render() {
        return React.createElement("div", { className: "spot-modal" },
            React.createElement("div", { className: "spot-modal-overlay", onClick: this.props.onCancel }),
            React.createElement("div", { className: "spot-modal-content", style: { overflow: 'visible' } },
                React.createElement("h3", { className: "spot-modal-title" }, "Aprobar Oferta"),
                React.createElement("p", null, "Estás enviando a validar la ficha técnica de esta oferta:"),
                React.createElement("p", null, React.createElement("strong", null, this.props.materialName)),
                React.createElement("p", null, "Proveedor: ", React.createElement("strong", null, `${this.props.offer.supplierName} (${this.props.rutSupplier})`)),
                
                React.createElement("div", { className: "spot-input-group", style: { marginTop: '15px' } },
                    React.createElement("label", null, React.createElement("strong", null, "Correos de Validadores (separados por ';'):")),
                    React.createElement("div", { style: { marginTop: '8px' } },
                        // Input de texto plano para ingresar correos manuales
                        React.createElement("input", {
                            type: "text",
                            className: "spot-input",
                            style: {
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                boxSizing: 'border-box',
                                fontSize: '14px'
                            },
                            placeholder: "usuario1@empresa.com; usuario2@empresa.com",
                            value: this.state.emailsText,
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                this.setState({ emailsText: e.target.value, error: null });
                            }
                        })
                    ),
                    // Mensaje de error dinámico e inline (evitamos alert bloqueantes)
                    this.state.error && React.createElement("div", {
                        style: {
                            color: '#a80000',
                            fontSize: '12px',
                            marginTop: '8px',
                            fontWeight: 'bold'
                        }
                    }, this.state.error)
                ),
                
                React.createElement("div", { className: "spot-modal-actions", style: { marginTop: '30px' } },
                    React.createElement("button", { className: "spot-btn", onClick: this.props.onCancel }, "Cancelar"),
                    React.createElement("button", { className: "spot-btn primary", onClick: this.handleConfirm }, "Aceptar")
                )
            )
        );
    }
}

// Función puente para inicializar y renderizar el Modal
export function showValidationsPrompt(
    materialName: string,
    rutSupplier: string,
    offer: MaterialSupplier,
    rawUsers: userTableRow[] = [] // Mantenido para no romper la firma de la función en otras llamadas
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

        const closePrompt = () => {
            ReactDOM.unmountComponentAtNode(targetDiv);
            targetDiv.remove();
            document.body.style.overflow = "";
        };

        // Renderizamos el componente actualizado
        ReactDOM.render(
            React.createElement(ValidationModal, {
                materialName,
                rutSupplier,
                offer,
                onConfirm: (emails) => {
                    closePrompt();
                    resolve({ id: offer.id, materialName, /*rutSupplier,*/ email: emails });
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