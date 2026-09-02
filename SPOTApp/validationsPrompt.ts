import * as React from "react";
import * as ReactDOM from "react-dom";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import { MaterialSupplier, validationsPromptResult, selectedFicha, TableDataRow } from "./interfaces";

// Inicializamos los íconos Fluent de Microsoft
initializeIcons();

interface IValidationModalProps {
    offer: TableDataRow[]; //MaterialSupplier[];
    onConfirm: (emails: string, selectedFichas: selectedFicha[]) => void;
    onCancel: () => void;
}

interface IValidationModalState {
    emailsText: string;
    selectedFichas: selectedFicha[]; // Controlamos la selección estructurada bajo la interfaz selectedFicha
    error: string | null;
}

class ValidationModal extends React.Component<IValidationModalProps, IValidationModalState> {
    constructor(props: IValidationModalProps) {
        super(props);
        
        // Convertimos el tipo seguro pasando primero por 'unknown' para evitar conflictos de solapamiento en TS
        const initialFichas: selectedFicha[] = props.offer
            .map((item) => {
                const rawItem = item as unknown as {
                    materialNumber?: string;
                    materialName?: string;
                  //  materialNumber?: string;
                };
                
                const filename = rawItem.materialName || rawItem.materialName || "";
                const valueID = rawItem.materialNumber || "";
                
                return {
                    selected: filename.trim() !== "",
                    materialNumber: valueID,
                    materialName: filename
                };
            })
            .filter((ficha) => ficha.materialName.trim() !== "");

        this.state = { 
            emailsText: "",
            selectedFichas: initialFichas,
            error: null
        };
    }

    private handleCheckboxChange = (index: number, isChecked: boolean) => {
        this.setState((prevState) => {
            const updatedFichas = [...prevState.selectedFichas];
            updatedFichas[index] = {
                ...updatedFichas[index],
                selected: isChecked
            };
            
            return { 
                selectedFichas: updatedFichas,
                error: null 
            };
        });
    };

    private handleConfirm = () => {
        const { emailsText, selectedFichas } = this.state;
        
        // 1. Validar que se haya seleccionado al menos un documento (fichas con selected: true)
        const selectedCount = selectedFichas.filter((ficha) => ficha.selected).length;
        if (selectedCount === 0) {
            this.setState({ error: "Por favor, selecciona al menos un documento para enviar a validar." });
            return;
        }

        // 2. Validar que el campo de correos no esté vacío
        if (!emailsText || !emailsText.trim()) {
            this.setState({ error: "Por favor, ingresa al menos un correo electrónico." });
            return;
        }

        // Dividir los correos por punto y coma, limpiar espacios vacíos y filtrar elementos vacíos
        const emails = emailsText.split(";").map((email) => email.trim()).filter(Boolean);
        
        // Expresión regular para validar formato de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emails.filter((email) => !emailRegex.test(email));

        if (invalidEmails.length > 0) {
            this.setState({ 
                error: `Formato de correo inválido en: ${invalidEmails.join(", ")}` 
            });
            return;
        }

        this.setState({ error: null });
        // Retornamos tanto la cadena de correos como el listado de selectedFichas
        this.props.onConfirm(emailsText, selectedFichas);
    };

    render() {
        const hasFichas = this.state.selectedFichas.length > 0;

        return React.createElement("div", { className: "spot-modal" },
            React.createElement("div", { className: "spot-modal-overlay", onClick: this.props.onCancel }),
            React.createElement("div", { className: "spot-modal-content", style: { overflow: "visible" } },
                React.createElement("h3", { className: "spot-modal-title" }, "Enviar fichas a validación"),
                !hasFichas
                    ? React.createElement("p", null, "No hay fichas técnicas para validar.")
                    : React.createElement(React.Fragment, null,
                        React.createElement("p", null, "Selecciona los materiales y especifica los destinatarios para realizar la validación:"),
                        
                        // Contenedor de Documentos con Scroll y Checkboxes
                        React.createElement("div", { 
                            className: "spot-input-group", 
                            style: { marginTop: "15px", marginBottom: "15px" } 
                        },
                            React.createElement("label", null, React.createElement("strong", null, "Materiales a Validar:")),
                            React.createElement("div", {
                                style: {
                                    marginTop: "8px",
                                    maxHeight: "150px",
                                    overflowY: "auto",
                                    border: "1px solid #d8d2cc",
                                    borderRadius: "8px",
                                    padding: "10px",
                                    backgroundColor: "#fbf8f6",
                                    boxSizing: "border-box"
                                }
                            },
                                this.state.selectedFichas.map((ficha, index) => {
                                    const filename = ficha.materialName || `Documento sin nombre (${index + 1})`;
                                    const isChecked = ficha.selected;

                                    return React.createElement("div", {
                                        key: index,
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            marginBottom: index === this.state.selectedFichas.length - 1 ? "0px" : "10px",
                                            cursor: "pointer"
                                        }
                                    },
                                        React.createElement("input", {
                                            type: "checkbox",
                                            id: `chk-doc-${index}`,
                                            checked: isChecked,
                                            style: { 
                                                marginRight: "10px", 
                                                width: "16px", 
                                                height: "16px", 
                                                cursor: "pointer" 
                                            },
                                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                                this.handleCheckboxChange(index, e.target.checked);
                                            }
                                        }),
                                        React.createElement("label", {
                                            htmlFor: `chk-doc-${index}`,
                                            style: { 
                                                fontSize: "13px", 
                                                cursor: "pointer", 
                                                userSelect: "none", 
                                                color: "#3c3c3c",
                                                fontWeight: "600"
                                            }
                                        }, filename)
                                    );
                                })
                            )
                        ),

                        // Formulario para correos electrónicos
                        React.createElement("div", { className: "spot-input-group", style: { marginTop: "15px" } },
                            React.createElement("label", null, React.createElement("strong", null, "Correos de Validadores (separados por ';'):")),
                            React.createElement("div", { style: { marginTop: "8px" } },
                                React.createElement("input", {
                                    type: "text",
                                    className: "spot-input",
                                    style: {
                                        width: "100%",
                                        padding: "10px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        boxSizing: "border-box",
                                        fontSize: "14px"
                                    },
                                    placeholder: "usuario1@empresa.com; usuario2@empresa.com",
                                    value: this.state.emailsText,
                                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                        this.setState({ emailsText: e.target.value, error: null });
                                    }
                                })
                            ),
                            this.state.error && React.createElement("div", {
                                style: {
                                    color: "#a80000",
                                    fontSize: "12px",
                                    marginTop: "8px",
                                    fontWeight: "bold"
                                }
                            }, this.state.error)
                        )
                    ),
                
                // Botonera de Acción del Modal
                React.createElement("div", { className: "spot-modal-actions", style: { marginTop: "30px" } },
                    React.createElement("button", { className: "spot-btn", onClick: this.props.onCancel }, hasFichas ? "Cancelar" : "Cerrar"),
                    hasFichas && React.createElement("button", { className: "spot-btn primary", onClick: this.handleConfirm }, "Aceptar")
                )
            )
        );
    }
}

export function showValidationsPrompt(
    offer: TableDataRow[],//MaterialSupplier[]
    bidsId: string 
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

        ReactDOM.render(
            React.createElement(ValidationModal, {
                offer,
                onConfirm: (emails, selectedFichas) => {
                    closePrompt();
                    // Resolvemos la promesa con la interfaz validationsPromptResult completa y bien tipada
                    resolve({ 
                        selectedFichas: selectedFichas, 
                        email: emails,
                        eventID: bidsId
                    } as validationsPromptResult); 
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