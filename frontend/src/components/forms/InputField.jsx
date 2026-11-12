export default function InputField({ label, id, ...props }) {
  return (
    <div className="mb-3">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <input className="form-control" id={id} {...props} />
    </div>
  );
}
