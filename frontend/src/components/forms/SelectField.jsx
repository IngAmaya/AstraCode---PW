export default function SelectField({ label, id, options = [], ...props }) {
  return (
    <div className="mb-3">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <select className="form-select" id={id} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
