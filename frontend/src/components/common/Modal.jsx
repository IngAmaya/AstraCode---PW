import React from 'react';
import { Modal as RsModal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
function Modal({ isOpen, toggle, title, children, onConfirm, confirmText = 'Guardar' }) {
 return (
 <RsModal isOpen={isOpen} toggle={toggle}>
 <ModalHeader toggle={toggle}>{title}</ModalHeader>
 <ModalBody>{children}</ModalBody>
 <ModalFooter>
 <Button color="secondary" onClick={toggle}>Cancelar</Button>
 <Button color="success" onClick={onConfirm}>{confirmText}</Button>
 </ModalFooter>
 </RsModal>
 );
}
export default Modal;
