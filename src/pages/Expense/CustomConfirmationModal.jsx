import React from 'react';

const CustomConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-gray-700 mb-6">{message}</p>
            <div className="flex justify-end space-x-3">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-md font-semibold text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-6 py-2.5 rounded-md font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                >
                    Confirm
                </button>
            </div>
        </Modal>
    );
};

export default CustomConfirmationModal;