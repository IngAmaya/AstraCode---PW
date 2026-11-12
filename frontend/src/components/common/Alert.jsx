import { Alert as ReactstrapAlert } from 'reactstrap';

export default function Alert({ color = 'info', children }) {
  return <ReactstrapAlert color={color}>{children}</ReactstrapAlert>;
}
