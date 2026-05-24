export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="field-label">
      {children}
    </label>
  );
}

export function ComboInput({
  id,
  name,
  defaultValue,
  suggestions,
  placeholder,
  required,
  error,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  error?: boolean;
}) {
  const listId = `${id}-suggestions`;
  const hasSuggestions = suggestions.length > 0;

  return (
    <>
      <input
        id={id}
        name={name}
        type="text"
        list={hasSuggestions ? listId : undefined}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={`input-field ${error ? "input-field--error" : ""}`}
      />
      {hasSuggestions ? (
        <datalist id={listId}>
          {suggestions.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      ) : null}
    </>
  );
}

export function TextInput({
  id,
  name,
  defaultValue,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  type = "text",
  error,
  min,
  max,
  step,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  error?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number | string;
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      {...(value !== undefined ? { value } : { defaultValue })}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      className={`input-field ${error ? "input-field--error" : ""}`}
    />
  );
}

export function SelectInput({
  id,
  name,
  defaultValue,
  options,
  required,
  placeholder,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      className="input-field"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function TextArea({
  id,
  name,
  defaultValue,
  rows = 3,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      defaultValue={defaultValue}
      className="input-field resize-y"
    />
  );
}

export function FormFeedback({
  error,
  success,
}: {
  error?: string;
  success?: boolean;
}) {
  if (error) {
    return (
      <p role="alert" className="field-error">
        {error}
      </p>
    );
  }
  if (success) {
    return <p className="form-success">Saved successfully</p>;
  }
  return null;
}
