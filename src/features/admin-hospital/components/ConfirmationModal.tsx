import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, description }) => {
    if (!isOpen) {
        return null;
    }

    return (
        // Overlay (fundo)
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
            {/* Conteúdo do Modal */}
            <div
                onClick={(e) => e.stopPropagation()} // Impede que o clique dentro do modal o feche
                className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            >
                {/* Cabeçalho */}
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                </div>

                {/* Corpo */}
                <div className="mb-6">
                    <p className="text-base leading-relaxed text-gray-600">{description}</p>
                </div>

                {/* Rodapé com os botões */}
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="rounded-md border border-gray-300 bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-200"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={onConfirm}
                        className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                        CONFIRMAR
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;