"use client";

import type { CreateUserRequest, UpdateUserRequest, UserRole } from "@socios/shared";
import {
  isValidUserName,
  isValidUserPassword,
  normalizeMemberEmail,
  USER_PASSWORD_MIN_LENGTH,
  USER_ROLE_LABELS,
  USER_ROLE_VALUES,
} from "@socios/shared";
import { type FormEvent, useState } from "react";

interface UserFormCreateProps {
  mode: "create";
  initial?: Partial<CreateUserRequest>;
  submitLabel: string;
  onSubmit: (values: CreateUserRequest) => Promise<void>;
}

interface UserFormEditProps {
  mode: "edit";
  initial?: Partial<CreateUserRequest> & { email?: string };
  submitLabel: string;
  onSubmit: (values: UpdateUserRequest) => Promise<void>;
}

type UserFormProps = UserFormCreateProps | UserFormEditProps;

export function UserForm(props: UserFormProps) {
  const { initial, submitLabel, onSubmit, mode } = props;
  const emailReadOnly = mode === "edit";
  const passwordRequired = mode === "create";
  const [email, setEmail] = useState(initial?.email ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(initial?.role ?? USER_ROLE_VALUES[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const trimmedName = name.trim();
    if (!isValidUserName(trimmedName)) {
      setError("El nombre debe tener entre 2 y 80 caracteres");
      setSubmitting(false);
      return;
    }

    if (passwordRequired && !isValidUserPassword(password)) {
      setError(`La contraseña debe tener al menos ${USER_PASSWORD_MIN_LENGTH} caracteres`);
      setSubmitting(false);
      return;
    }

    if (!passwordRequired && password && !isValidUserPassword(password)) {
      setError(`La contraseña debe tener al menos ${USER_PASSWORD_MIN_LENGTH} caracteres`);
      setSubmitting(false);
      return;
    }

    try {
      if (mode === "edit") {
        const payload: UpdateUserRequest = {
          name: trimmedName,
          role,
        };
        if (password.trim()) {
          payload.password = password;
        }
        await onSubmit(payload);
      } else {
        const normalizedEmail = normalizeMemberEmail(email);
        await onSubmit({
          email: normalizedEmail,
          name: trimmedName,
          password,
          role,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el usuario");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card stack" onSubmit={(e) => void handleSubmit(e)}>
      <div className="field">
        <label htmlFor="user-email">Email</label>
        <input
          id="user-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={emailReadOnly}
          required={!emailReadOnly}
          disabled={emailReadOnly || submitting}
        />
      </div>

      <div className="field">
        <label htmlFor="user-name">Nombre</label>
        <input
          id="user-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={submitting}
        />
      </div>

      <div className="field">
        <label htmlFor="user-password">Contraseña{passwordRequired ? "" : " (opcional)"}</label>
        <input
          id="user-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={passwordRequired}
          disabled={submitting}
          autoComplete={passwordRequired ? "new-password" : "off"}
        />
      </div>

      <div className="field">
        <label htmlFor="user-role">Rol</label>
        <select
          id="user-role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          disabled={submitting}
        >
          {USER_ROLE_VALUES.map((value) => (
            <option key={value} value={value}>
              {USER_ROLE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="actions">
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
