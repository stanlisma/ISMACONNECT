"use client";

type FieldHelpProps = {
  text: string;
  label?: string;
};

export function FieldHelp({ text, label = "Help" }: FieldHelpProps) {
  return (
    <details className="field-help">
      <summary className="field-help-badge" aria-label={`${label}: ${text}`}>
        <span aria-hidden="true">?</span>
      </summary>
      <div className="field-help-popover" role="note">
        {text}
      </div>
    </details>
  );
}

export function FieldLabelWithHelp({
  label,
  helpText
}: {
  label: string;
  helpText?: string | null;
}) {
  return (
    <span className="field-label-row">
      <span className="field-label">{label}</span>
      {helpText ? <FieldHelp text={helpText} label={label} /> : null}
    </span>
  );
}
