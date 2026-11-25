import { Modal as ReactstrapModal, ModalBody, ModalHeader } from 'reactstrap';

export default function Modal({ isOpen = false, toggle, title, children }) {
  return (
    <ReactstrapModal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>{title}</ModalHeader>
      <ModalBody>{children}</ModalBody>
    </ReactstrapModal>
  );
}
